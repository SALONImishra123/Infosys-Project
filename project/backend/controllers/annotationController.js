import { validationResult } from 'express-validator';
import Annotation from '../models/Annotation.js';
import Workspace from '../models/Workspace.js';

// Create annotation
export const createAnnotation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { text, intent, entities, workspaceId, datasetId, notes } = req.body;

    // Verify workspace ownership
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const annotation = new Annotation({
      text,
      intent,
      entities: entities || [],
      workspace: workspaceId,
      dataset: datasetId,
      annotatedBy: req.user._id,
      notes
    });

    await annotation.save();

    // Add annotation to workspace
    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: { annotations: annotation._id }
    });

    await annotation.populate('annotatedBy', 'name email');

    res.status(201).json({
      message: 'Annotation saved successfully',
      annotation
    });
  } catch (error) {
    console.error('Create annotation error:', error);
    res.status(500).json({ message: 'Failed to save annotation' });
  }
};

// Get workspace annotations
export const getWorkspaceAnnotations = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { page = 1, limit = 50, intent, validated } = req.query;

    // Verify workspace ownership
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Build filter
    const filter = { workspace: workspaceId };
    if (intent) filter['intent.name'] = intent;
    if (validated !== undefined) filter.isValidated = validated === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [annotations, total] = await Promise.all([
      Annotation.find(filter)
        .select('-__v')
        .populate('annotatedBy', 'name email')
        .populate('dataset', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Annotation.countDocuments(filter)
    ]);

    res.json({
      annotations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get annotations error:', error);
    res.status(500).json({ message: 'Failed to fetch annotations' });
  }
};

// Get annotation by ID
export const getAnnotationById = async (req, res) => {
  try {
    const { id } = req.params;

    const annotation = await Annotation.findById(id)
      .populate('workspace', 'name owner')
      .populate('dataset', 'name')
      .populate('annotatedBy', 'name email');

    if (!annotation) {
      return res.status(404).json({ message: 'Annotation not found' });
    }

    // Verify workspace ownership
    if (annotation.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ annotation });
  } catch (error) {
    console.error('Get annotation error:', error);
    res.status(500).json({ message: 'Failed to fetch annotation' });
  }
};

// Update annotation
export const updateAnnotation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { text, intent, entities, isValidated, notes } = req.body;

    const annotation = await Annotation.findById(id).populate('workspace', 'owner');

    if (!annotation) {
      return res.status(404).json({ message: 'Annotation not found' });
    }

    // Verify workspace ownership
    if (annotation.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update annotation
    const updatedAnnotation = await Annotation.findByIdAndUpdate(
      id,
      { text, intent, entities, isValidated, notes },
      { new: true, runValidators: true }
    ).populate('annotatedBy', 'name email');

    res.json({
      message: 'Annotation updated successfully',
      annotation: updatedAnnotation
    });
  } catch (error) {
    console.error('Update annotation error:', error);
    res.status(500).json({ message: 'Failed to update annotation' });
  }
};

// Delete annotation
export const deleteAnnotation = async (req, res) => {
  try {
    const { id } = req.params;

    const annotation = await Annotation.findById(id).populate('workspace', 'owner');

    if (!annotation) {
      return res.status(404).json({ message: 'Annotation not found' });
    }

    // Verify workspace ownership
    if (annotation.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Annotation.findByIdAndDelete(id);

    // Remove annotation from workspace
    await Workspace.findByIdAndUpdate(annotation.workspace._id, {
      $pull: { annotations: id }
    });

    res.json({ message: 'Annotation deleted successfully' });
  } catch (error) {
    console.error('Delete annotation error:', error);
    res.status(500).json({ message: 'Failed to delete annotation' });
  }
};

// Get annotation statistics
export const getAnnotationStats = async (req, res) => {
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

    const [totalAnnotations, validatedAnnotations, intentStats, entityStats] = await Promise.all([
      Annotation.countDocuments({ workspace: workspaceId }),
      Annotation.countDocuments({ workspace: workspaceId, isValidated: true }),
      Annotation.aggregate([
        { $match: { workspace: workspace._id } },
        { $group: { _id: '$intent.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Annotation.aggregate([
        { $match: { workspace: workspace._id } },
        { $unwind: '$entities' },
        { $group: { _id: '$entities.entity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const stats = {
      total: totalAnnotations,
      validated: validatedAnnotations,
      pending: totalAnnotations - validatedAnnotations,
      intents: intentStats,
      entities: entityStats
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get annotation stats error:', error);
    res.status(500).json({ message: 'Failed to fetch annotation statistics' });
  }
};