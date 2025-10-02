import mongoose from 'mongoose';

const annotationSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Text is required'],
    trim: true
  },
  intent: {
    name: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1
    }
  },
  entities: [{
    entity: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    start: {
      type: Number,
      required: true
    },
    end: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1
    }
  }],
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  dataset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset'
  },
  annotatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isValidated: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Annotation', annotationSchema);
