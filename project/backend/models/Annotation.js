import mongoose from 'mongoose';

const annotationSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true
    },
    intent: {
      type: String,
      required: true
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true
    },
    entities: [
      {
        entity: String,
        value: String
      }
    ],
    createdBy: {  // <-- added field
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  },
  { timestamps: true }
);

export default mongoose.model('Annotation', annotationSchema);
