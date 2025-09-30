import { validationResult } from 'express-validator';
import ModelMeta from '../models/ModelMeta.js';
import Workspace from '../models/Workspace.js';
import Annotation from '../models/Annotation.js';

// Create/Train model
export const trainModel = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, workspaceId, backend, datasetId, configuration } = req.body;

    // Verify workspace ownership
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Count annotations for training data stats
    const annotationsCount = await Annotation.countDocuments({ workspace: workspaceId });
    
    if (annotationsCount === 0) {
      return res.status(400).json({ message: 'No annotations available for training' });
    }

    // Get unique intents and entities count
    const [intentStats, entityStats] = await Promise.all([
      Annotation.aggregate([
        { $match: { workspace: workspace._id } },
        { $group: { _id: '$intent.name' } },
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
      trainedBy: req.user._id,
      trainingStarted: new Date(),
      status: 'training'
    });

    await model.save();

    // Add model to workspace
    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: { models: model._id }
    });

    // Simulate training process (in real implementation, this would be async)
    setTimeout(async () => {
      try {
        await ModelMeta.findByIdAndUpdate(model._id, {
          status: 'ready',
          trainingCompleted: new Date(),
          performance: {
            accuracy: 0.85 + Math.random() * 0.1, // Mock performance
            precision: 0.82 + Math.random() * 0.1,
            recall: 0.80 + Math.random() * 0.1,
            f1Score: 0.81 + Math.random() * 0.1
          }
        });
        console.log(`Model ${model._id} training completed`);
      } catch (error) {
        console.error('Model training update error:', error);
        await ModelMeta.findByIdAndUpdate(model._id, { status: 'failed' });
      }
    }, 5000); // 5 seconds simulation

    await model.populate('trainedBy', 'name email');

    res.status(201).json({
      message: 'Model training started successfully',
      model
    });
  } catch (error) {
    console.error('Train model error:', error);
    res.status(500).json({ message: 'Failed to start model training' });
  }
};

// Get workspace models
export const getWorkspaceModels = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Verify workspace ownership
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const models = await ModelMeta.find({ 
      workspace: workspaceId,
      isActive: true 
    })
    .select('-__v')
    .populate('trainedBy', 'name email')
    .populate('trainingData.datasetId', 'name')
    .sort({ createdAt: -1 });

    res.json({
      models,
      count: models.length
    });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ message: 'Failed to fetch models' });
  }
};

// Get model by ID
export const getModelById = async (req, res) => {
  try {
    const { id } = req.params;

    const model = await ModelMeta.findById(id)
      .populate('workspace', 'name owner')
      .populate('trainedBy', 'name email')
      .populate('trainingData.datasetId', 'name');

    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    // Verify workspace ownership
    if (model.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ model });
  } catch (error) {
    console.error('Get model error:', error);
    res.status(500).json({ message: 'Failed to fetch model' });
  }
};

// Update model
export const updateModel = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { name, isActive } = req.body;

    const model = await ModelMeta.findById(id).populate('workspace', 'owner');

    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    // Verify workspace ownership
    if (model.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedModel = await ModelMeta.findByIdAndUpdate(
      id,
      { name, isActive },
      { new: true, runValidators: true }
    ).populate('trainedBy', 'name email');

    res.json({
      message: 'Model updated successfully',
      model: updatedModel
    });
  } catch (error) {
    console.error('Update model error:', error);
    res.status(500).json({ message: 'Failed to update model' });
  }
};

// Delete model
export const deleteModel = async (req, res) => {
  try {
    const { id } = req.params;

    const model = await ModelMeta.findById(id).populate('workspace', 'owner');

    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    // Verify workspace ownership
    if (model.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await ModelMeta.findByIdAndUpdate(id, { isActive: false });

    // Remove model from workspace
    await Workspace.findByIdAndUpdate(model.workspace._id, {
      $pull: { models: id }
    });

    res.json({ message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Delete model error:', error);
    res.status(500).json({ message: 'Failed to delete model' });
  }
};

// Get model status
export const getModelStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const model = await ModelMeta.findById(id)
      .select('status trainingStarted trainingCompleted performance')
      .populate('workspace', 'owner');

    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    // Verify workspace ownership
    if (model.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ 
      status: model.status,
      trainingStarted: model.trainingStarted,
      trainingCompleted: model.trainingCompleted,
      performance: model.performance
    });
  } catch (error) {
    console.error('Get model status error:', error);
    res.status(500).json({ message: 'Failed to fetch model status' });
  }
};