import mongoose from 'mongoose';

const datasetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Dataset name is required'],
    trim: true
  },
  format: {
    type: String,
    enum: ['csv', 'json', 'rasa'],
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  data: {
    intents: [{
      name: String,
      examples: [String]
    }],
    entities: [{
      name: String,
      values: [String]
    }],
    rawData: mongoose.Schema.Types.Mixed
  },
  statistics: {
    totalExamples: {
      type: Number,
      default: 0
    },
    totalIntents: {
      type: Number,
      default: 0
    },
    totalEntities: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'error'],
    default: 'processing'
  }
}, {
  timestamps: true
});

export default mongoose.model('Dataset', datasetSchema);