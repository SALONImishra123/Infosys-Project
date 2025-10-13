// controllers/modelController.js
import { validationResult } from 'express-validator';
import ModelMeta from '../models/ModelMeta.js';
import Workspace from '../models/Workspace.js';
import Annotation from '../models/Annotation.js';

// Helper to get userId from req
const getUserId = (req) => req?.user?.userId || req?.user?._id || null;

// Simple rule-based predictor
export const predict = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'text is required' });

    const t = text.toLowerCase();

    const rules = [
      { intent: 'book_flight', keywords: ['book', 'flight', 'ticket', 'fly'] },
      { intent: 'book_hotel', keywords: ['hotel', 'room', 'stay', 'book a room', 'book room'] },
      { intent: 'check_weather', keywords: ['weather', 'forecast', 'temperature'] },
      { intent: 'find_restaurant', keywords: ['restaurant', 'eat', 'dine'] },
      { intent: 'cancel_reservation', keywords: ['cancel', 'cancellation', 'cancel my'] },
      { intent: 'get_directions', keywords: ['directions', 'how do i get', 'way to', 'from', 'to'] },
      { intent: 'greet', keywords: ['hi', 'hello', 'hey'] },
      { intent: 'goodbye', keywords: ['bye', 'goodbye', 'see you'] },
    ];

    let predicted = 'unknown';
    for (const r of rules) {
      if (r.keywords.some(k => t.includes(k))) {
        predicted = r.intent;
        break;
      }
    }

    const entities = [];
    const dateMatch = text.match(/(\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}\b|\btomorrow\b|\btoday\b)/i);
    if (dateMatch) entities.push({ entity: 'date', value: dateMatch[0] });

    const toMatch = text.match(/\bto\s+([A-Z][a-zA-Z0-9\s-]{1,40})/);
    if (toMatch) entities.push({ entity: 'location', value: toMatch[1].trim() });

    // Return shape frontend expects
    return res.json({
      reply: {
        intent: predicted,
        entities,
        text: `Demo predicted intent: ${predicted}`
      }
    });
  } catch (err) {
    console.error('Predict error:', err);
    return res.status(500).json({ message: 'Prediction failed', error: err.message });
  }
};

// Train a Model
export const trainModel = async (req, res) => {
  try {
    console.log('🚀 Training API called');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed');
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    let { name, workspaceId, backend, datasetId, configuration } = req.body;
    if (!workspaceId) return res.status(400).json({ message: 'workspaceId is required' });

    workspaceId = workspaceId.trim();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    // Verify workspace ownership
    const workspace = await Workspace.findOne({ _id: workspaceId, owner: userId });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    // Count annotations
    const annotationsCount = await Annotation.countDocuments({ workspace: workspaceId });
    if (annotationsCount === 0) return res.status(400).json({ message: 'No annotations available for training' });

    // Get intent/entity stats — group by "$intent" (intent stored as string)
    const [intentStats, entityStats] = await Promise.all([
      Annotation.aggregate([
        { $match: { workspace: workspace._id } },
        { $group: { _id: '$intent' } },
        { $count: 'total' }
      ]),
      Annotation.aggregate([
        { $match: { workspace: workspace._id } },
        { $unwind: '$entities' },
        { $group: { _id: '$entities.entity' } },
        { $count: 'total' }
      ])
    ]);

    const model = new ModelMeta({
      name,
      workspace: workspaceId,
      backend,
      trainingData: {
        datasetId,
        annotationsCount,
        intentsCount: intentStats[0]?.total || 0,
        entitiesCount: entityStats[0]?.total || 0
      },
      configuration: configuration || {},
      trainedBy: userId,
      trainingStarted: new Date(),
      status: 'training'
    });

    await model.save();
    await Workspace.findByIdAndUpdate(workspaceId, { $push: { models: model._id } });

    // Simulated async training (update performance after delay)
    setTimeout(async () => {
      try {
        await ModelMeta.findByIdAndUpdate(model._id, {
          status: 'ready',
          trainingCompleted: new Date(),
          performance: {
            accuracy: 0.85 + Math.random() * 0.1,
            precision: 0.82 + Math.random() * 0.1,
            recall: 0.80 + Math.random() * 0.1,
            f1Score: 0.81 + Math.random() * 0.1
          }
        });
        console.log(`✅ Model ${model._id} training completed`);
      } catch (error) {
        console.error('❌ Model training update error:', error);
        await ModelMeta.findByIdAndUpdate(model._id, { status: 'failed' });
      }
    }, 5000);

    await model.populate('trainedBy', 'name email');

    res.status(201).json({ message: 'Model training started successfully', model });
  } catch (error) {
    console.error('🔥 Train model error:', error);
    res.status(500).json({ message: 'Failed to start training', error: error.message });
  }
};

// Get all workspace models
export const getWorkspaceModels = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const workspace = await Workspace.findOne({ _id: workspaceId, owner: userId });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const models = await ModelMeta.find({ workspace: workspaceId, isActive: true })
      .select('-__v')
      .populate('trainedBy', 'name email')
      .populate('trainingData.datasetId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ models, count: models.length });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ message: 'Failed to fetch models', error: error.message });
  }
};

// Get a model by ID
export const getModelById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const model = await ModelMeta.findById(id)
      .populate('workspace', 'name owner')
      .populate('trainedBy', 'name email')
      .populate('trainingData.datasetId', 'name');

    if (!model) return res.status(404).json({ message: 'Model not found' });
    if (!model.workspace || model.workspace.owner.toString() !== userId.toString()) return res.status(403).json({ message: 'Access denied' });

    res.json({ model });
  } catch (error) {
    console.error('Get model error:', error);
    res.status(500).json({ message: 'Failed to fetch model', error: error.message });
  }
};

// Update model
export const updateModel = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });

    const { id } = req.params;
    const { name, isActive } = req.body;
    const userId = getUserId(req);

    const model = await ModelMeta.findById(id).populate('workspace', 'owner');
    if (!model) return res.status(404).json({ message: 'Model not found' });
    if (!model.workspace || model.workspace.owner.toString() !== userId.toString()) return res.status(403).json({ message: 'Access denied' });

    const updatedModel = await ModelMeta.findByIdAndUpdate(id, { name, isActive }, { new: true, runValidators: true })
      .populate('trainedBy', 'name email');

    res.json({ message: 'Model updated successfully', model: updatedModel });
  } catch (error) {
    console.error('Update model error:', error);
    res.status(500).json({ message: 'Failed to update model', error: error.message });
  }
};

// Delete model (soft-delete)
export const deleteModel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const model = await ModelMeta.findById(id).populate('workspace', 'owner');
    if (!model) return res.status(404).json({ message: 'Model not found' });
    if (!model.workspace || model.workspace.owner.toString() !== userId.toString()) return res.status(403).json({ message: 'Access denied' });

    await ModelMeta.findByIdAndUpdate(id, { isActive: false });
    await Workspace.findByIdAndUpdate(model.workspace._id, { $pull: { models: id } });

    res.json({ message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Delete model error:', error);
    res.status(500).json({ message: 'Failed to delete model', error: error.message });
  }
};

// Get model status
export const getModelStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const model = await ModelMeta.findById(id)
      .select('status trainingStarted trainingCompleted performance workspace')
      .populate('workspace', 'owner');

    if (!model) return res.status(404).json({ message: 'Model not found' });
    if (!model.workspace || model.workspace.owner.toString() !== userId.toString()) return res.status(403).json({ message: 'Access denied' });

    res.json({
      status: model.status,
      trainingStarted: model.trainingStarted,
      trainingCompleted: model.trainingCompleted,
      performance: model.performance
    });
  } catch (error) {
    console.error('Get model status error:', error);
    res.status(500).json({ message: 'Failed to fetch model status', error: error.message });
  }
};

