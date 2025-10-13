import mongoose from "mongoose";

const modelMetaSchema = new mongoose.Schema({
  name: String,
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  backend: String,
  trainingData: {
    datasetId: { type: mongoose.Schema.Types.ObjectId, ref: "Dataset", required: false },
    annotationsCount: Number,
    intentsCount: Number,
    entitiesCount: Number
  },
  configuration: Object,
  trainedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  trainingStarted: Date,
  status: { type: String, enum: ["training", "ready", "failed"], default: "training" }
}, { timestamps: true });

export default mongoose.model("ModelMeta", modelMetaSchema);
