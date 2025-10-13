// controllers/annotationController.js
import { validationResult } from 'express-validator';
import Workspace from '../models/Workspace.js';
import Annotation from '../models/Annotation.js';

// Helper to get userId from req
const getUserId = (req) => req?.user?.userId || req?.user?._id || null;

// Create annotation
export const createAnnotation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });

    const { text, intent, entities } = req.body;
    const { workspaceId } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    // normalize intent (accept either string or object { name })
    const intentName = typeof intent === 'string' ? intent : (intent && intent.name) ? intent.name : null;
    if (!intentName) return res.status(400).json({ message: 'Intent name is required' });

    // Check workspace ownership
    const workspace = await Workspace.findOne({ _id: workspaceId, owner: userId });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const annotation = new Annotation({
      text,
      intent: intentName,
      entities: Array.isArray(entities) ? entities.map(e => ({ entity: e.entity, value: e.value })) : [],
      workspace: workspaceId,
      createdBy: userId
    });

    await annotation.save();

    // Add annotation to workspace (avoid duplicates)
    if (!workspace.annotations) workspace.annotations = [];
    workspace.annotations.push(annotation._id);
    await workspace.save();

    res.status(201).json({ message: 'Annotation created successfully', annotation });
  } catch (error) {
    console.error('Create annotation error:', error);
    res.status(500).json({ message: 'Failed to create annotation', error: error.message });
  }
};

// Get annotations for a workspace
export const getWorkspaceAnnotations = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const workspace = await Workspace.findOne({ _id: workspaceId, owner: userId });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const annotations = await Annotation.find({ workspace: workspaceId })
      .lean()
      .populate ? await Annotation.find({ workspace: workspaceId }).populate('createdBy', 'name email').sort({ createdAt: -1 }) : await Annotation.find({ workspace: workspaceId }).sort({ createdAt: -1 });

    // if we used lean() above we can't populate in the same chain — above is defensive:
    // to keep simple, if populate exists we'll run that version (populating createdBy), else use lean()

    // Normalize response shape if needed
    const normalized = Array.isArray(annotations) ? annotations.map(a => ({
      ...a,
      intent: typeof a.intent === 'object' ? (a.intent.name || a.intent) : a.intent
    })) : [];

    res.json({ annotations: normalized, count: normalized.length });
  } catch (error) {
    console.error('Get annotations error:', error);
    res.status(500).json({ message: 'Failed to fetch annotations', error: error.message });
  }
};

// Get annotation by ID
export const getAnnotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const annotation = await Annotation.findById(id)
      .populate('workspace', 'name owner')
      .populate('createdBy', 'name email');

    if (!annotation) return res.status(404).json({ message: 'Annotation not found' });

    if (!annotation.workspace || !annotation.workspace.owner) {
      // defensive: if workspace not populated, fetch
      const ws = await Workspace.findById(annotation.workspace);
      if (!ws || ws.owner.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (annotation.workspace.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Normalize intent if stored as object
    const normalized = {
      ...annotation.toObject(),
      intent: typeof annotation.intent === 'object' ? (annotation.intent.name || annotation.intent) : annotation.intent
    };

    res.json({ annotation: normalized });
  } catch (error) {
    console.error('Get annotation error:', error);
    res.status(500).json({ message: 'Failed to fetch annotation', error: error.message });
  }
};

// Update annotation
export const updateAnnotation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });

    const { id } = req.params;
    const { text, intent, entities } = req.body;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const annotation = await Annotation.findById(id).populate('workspace', 'owner');
    if (!annotation) return res.status(404).json({ message: 'Annotation not found' });
    if (!annotation.workspace || annotation.workspace.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // normalize intent (string or object)
    const intentName = typeof intent === 'string' ? intent : (intent && intent.name) ? intent.name : null;
    if (!intentName) return res.status(400).json({ message: 'Intent name is required' });

    annotation.text = text !== undefined ? text : annotation.text;
    annotation.intent = intentName;
    annotation.entities = Array.isArray(entities) ? entities.map(e => ({ entity: e.entity, value: e.value })) : annotation.entities || [];
    await annotation.save();

    res.json({ message: 'Annotation updated successfully', annotation });
  } catch (error) {
    console.error('Update annotation error:', error);
    res.status(500).json({ message: 'Failed to update annotation', error: error.message });
  }
};

// Delete annotation
export const deleteAnnotation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const annotation = await Annotation.findById(id).populate('workspace', 'owner');
    if (!annotation) return res.status(404).json({ message: 'Annotation not found' });
    if (!annotation.workspace || annotation.workspace.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Annotation.findByIdAndDelete(id);

    // Remove annotation from workspace
    try {
      await Workspace.findByIdAndUpdate(annotation.workspace._id, { $pull: { annotations: id } });
    } catch (e) {
      // Not critical if workspace update fails; log for debugging
      console.error('Failed to remove annotation ref from workspace:', e);
    }

    res.json({ message: 'Annotation deleted successfully' });
  } catch (error) {
    console.error('Delete annotation error:', error);
    res.status(500).json({ message: 'Failed to delete annotation', error: error.message });
  }
};

export const getAnnotationStats = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const workspace = await Workspace.findOne({ _id: workspaceId, owner: userId });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    // Total annotations
    const totalAnnotations = await Annotation.countDocuments({ workspace: workspaceId });

    // Unique intents & entities (examples)
    const intentsAgg = await Annotation.aggregate([
      { $match: { workspace: workspace._id } },
      { $group: { _id: '$intent' } },
      { $project: { intent: '$_id', _id: 0 } }
    ]);

    const entitiesAgg = await Annotation.aggregate([
      { $match: { workspace: workspace._id } },
      { $unwind: { path: '$entities', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$entities.entity' } },
      { $project: { entity: '$_id', _id: 0 } }
    ]);

    const stats = {
      total: totalAnnotations,
      intents: intentsAgg.map(i => (typeof i.intent === 'object' ? (i.intent.name || i.intent) : i.intent)).filter(Boolean),
      entities: entitiesAgg.map(e => e.entity).filter(Boolean),
      validated: 0 // placeholder — extend if you track validation status
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get annotation stats error:', error);
    res.status(500).json({ message: 'Failed to fetch annotation stats', error: error.message });
  }
};
