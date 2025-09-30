import csv from 'csv-parser';
import { Readable } from 'stream';

// Parse CSV data
const parseCSV = (csvData) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from([csvData]);
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        try {
          const parsed = processCSVData(results);
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
};

// Process CSV data into NLU format
const processCSVData = (csvData) => {
  const intentsMap = new Map();
  const entitiesMap = new Map();

  csvData.forEach(row => {
    // Expecting CSV columns: text, intent, entities (optional)
    const text = row.text || row.example || row.sentence;
    const intentName = row.intent || row.label;
    
    if (!text || !intentName) return;

    // Process intent
    if (!intentsMap.has(intentName)) {
      intentsMap.set(intentName, []);
    }
    intentsMap.get(intentName).push(text.trim());

    // Process entities if present
    const entitiesStr = row.entities || row.entity || '';
    if (entitiesStr) {
      try {
        const entities = JSON.parse(entitiesStr);
        entities.forEach(entity => {
          if (!entitiesMap.has(entity.entity)) {
            entitiesMap.set(entity.entity, new Set());
          }
          entitiesMap.get(entity.entity).add(entity.value);
        });
      } catch (error) {
        // Handle simple entity format: "location:New York,date:tomorrow"
        const entityPairs = entitiesStr.split(',');
        entityPairs.forEach(pair => {
          const [entityType, entityValue] = pair.split(':');
          if (entityType && entityValue) {
            if (!entitiesMap.has(entityType.trim())) {
              entitiesMap.set(entityType.trim(), new Set());
            }
            entitiesMap.get(entityType.trim()).add(entityValue.trim());
          }
        });
      }
    }
  });

  return {
    data: {
      intents: Array.from(intentsMap.entries()).map(([name, examples]) => ({
        name,
        examples
      })),
      entities: Array.from(entitiesMap.entries()).map(([name, values]) => ({
        name,
        values: Array.from(values)
      })),
      rawData: csvData
    },
    statistics: {
      totalExamples: csvData.length,
      totalIntents: intentsMap.size,
      totalEntities: entitiesMap.size
    }
  };
};

// Parse JSON data
const parseJSON = (jsonData) => {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
    // Handle different JSON formats
    if (data.nlu_data || data.training_data) {
      // Rasa format in JSON
      return parseRasaFormat(data);
    } else if (data.intents && Array.isArray(data.intents)) {
      // Standard intent format
      return parseStandardFormat(data);
    } else if (Array.isArray(data)) {
      // Array of examples
      return parseExampleArray(data);
    }
    
    throw new Error('Unsupported JSON format');
  } catch (error) {
    throw new Error(`JSON parsing failed: ${error.message}`);
  }
};

// Parse Rasa format
const parseRasaFormat = (data) => {
  const nluData = data.nlu_data || data.training_data || data;
  const intentsMap = new Map();
  const entitiesMap = new Map();

  if (nluData.common_examples) {
    nluData.common_examples.forEach(example => {
      const { text, intent, entities } = example;
      
      // Process intent
      if (intent) {
        if (!intentsMap.has(intent)) {
          intentsMap.set(intent, []);
        }
        intentsMap.get(intent).push(text);
      }
      
      // Process entities
      if (entities && Array.isArray(entities)) {
        entities.forEach(entity => {
          if (!entitiesMap.has(entity.entity)) {
            entitiesMap.set(entity.entity, new Set());
          }
          entitiesMap.get(entity.entity).add(entity.value);
        });
      }
    });
  }

  return {
    data: {
      intents: Array.from(intentsMap.entries()).map(([name, examples]) => ({
        name,
        examples
      })),
      entities: Array.from(entitiesMap.entries()).map(([name, values]) => ({
        name,
        values: Array.from(values)
      })),
      rawData: data
    },
    statistics: {
      totalExamples: nluData.common_examples?.length || 0,
      totalIntents: intentsMap.size,
      totalEntities: entitiesMap.size
    }
  };
};

// Parse standard format
const parseStandardFormat = (data) => {
  const intentsMap = new Map();
  const entitiesMap = new Map();

  data.intents.forEach(intent => {
    intentsMap.set(intent.name, intent.examples || []);
  });

  if (data.entities) {
    data.entities.forEach(entity => {
      entitiesMap.set(entity.name, entity.values || []);
    });
  }

  const totalExamples = Array.from(intentsMap.values())
    .reduce((sum, examples) => sum + examples.length, 0);

  return {
    data: {
      intents: Array.from(intentsMap.entries()).map(([name, examples]) => ({
        name,
        examples
      })),
      entities: Array.from(entitiesMap.entries()).map(([name, values]) => ({
        name,
        values
      })),
      rawData: data
    },
    statistics: {
      totalExamples,
      totalIntents: intentsMap.size,
      totalEntities: entitiesMap.size
    }
  };
};

// Parse example array
const parseExampleArray = (data) => {
  const intentsMap = new Map();
  const entitiesMap = new Map();

  data.forEach(example => {
    const { text, intent, entities } = example;
    
    if (intent) {
      if (!intentsMap.has(intent)) {
        intentsMap.set(intent, []);
      }
      intentsMap.get(intent).push(text);
    }

    if (entities && Array.isArray(entities)) {
      entities.forEach(entity => {
        if (!entitiesMap.has(entity.entity || entity.type)) {
          entitiesMap.set(entity.entity || entity.type, new Set());
        }
        entitiesMap.get(entity.entity || entity.type).add(entity.value);
      });
    }
  });

  return {
    data: {
      intents: Array.from(intentsMap.entries()).map(([name, examples]) => ({
        name,
        examples
      })),
      entities: Array.from(entitiesMap.entries()).map(([name, values]) => ({
        name,
        values: Array.from(values)
      })),
      rawData: data
    },
    statistics: {
      totalExamples: data.length,
      totalIntents: intentsMap.size,
      totalEntities: entitiesMap.size
    }
  };
};

// Main parser function
export const parseDataset = async (data, format) => {
  switch (format.toLowerCase()) {
    case 'csv':
      return await parseCSV(data);
    case 'json':
      return parseJSON(data);
    case 'rasa':
      return parseJSON(data); // Rasa uses JSON format
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};