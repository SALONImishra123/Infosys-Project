import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true,
    maxlength: [100, 'Workspace name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  datasets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset'
  }],
  annotations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Annotation'
  }],
  models: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ModelMeta'
  }],
  settings: {
    language: {
      type: String,
      default: 'en'
    },
    nluBackend: {
      type: String,
      enum: ['rasa', 'spacy', 'huggingface'],
      default: 'rasa'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
workspaceSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model('Workspace', workspaceSchema);