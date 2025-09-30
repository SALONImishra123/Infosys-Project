import mongoose from 'mongoose';

const modelMetaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Model name is required'],
    trim: true
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  backend: {
    type: String,
    enum: ['rasa', 'spacy', 'huggingface'],
    required: true
  },
  status: {
    type: String,
    enum: ['training', 'ready', 'failed', 'archived'],
    default: 'training'
  },
  trainingData: {
    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dataset'
    },
    annotationsCount: {
      type: Number,
      default: 0
    },
    intentsCount: {
      type: Number,
      default: 0
    },
    entitiesCount: {
      type: Number,
      default: 0
    }
  },
  performance: {
    accuracy: Number,
    precision: Number,
    recall: Number,
    f1Score: Number
  },
  configuration: {
    pipeline: [String],
    hyperparameters: mongoose.Schema.Types.Mixed
  },
  trainedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trainingStarted: Date,
  trainingCompleted: Date,
  modelPath: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('ModelMeta', modelMetaSchema);