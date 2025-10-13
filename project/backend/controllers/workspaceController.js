import { validationResult } from 'express-validator';
import Workspace from '../models/Workspace.js';
import Dataset from '../models/Dataset.js';
import Annotation from '../models/Annotation.js';
import ModelMeta from '../models/ModelMeta.js';

// Helper to get userId from req
const getUserId = (req) => req?.user?.userId || req?.user?._id || null;

// Create workspace
export const createWorkspace = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });

    const { name, description, settings } = req.body;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const workspace = new Workspace({ name, description, owner: userId, settings: settings || {} });
    await workspace.save();

    res.status(201).json({ message: 'Workspace created successfully', workspace });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ message: 'Failed to create workspace', error: error.message });
  }
};

// Get user workspaces
export const getUserWorkspaces = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const workspaces = await Workspace.find({ owner: userId, isActive: true })
      .select('-__v')
      .sort({ createdAt: -1 })
      .populate({ path: 'datasets', select: 'name format statistics' })
      .populate({ path: 'annotations', select: 'text intent' })
      .populate({ path: 'models', select: 'name version status' })
      .lean();

    res.json({ workspaces, count: workspaces.length });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ message: 'Failed to fetch workspaces', error: error.message });
  }
};

// Get workspace by ID
export const getWorkspaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const workspace = await Workspace.findOne({ _id: id, owner: userId })
      .populate('datasets')
      .populate('annotations')
      .populate('models')
      .populate('owner', 'name email');

    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    res.json({ workspace });
  } catch (error) {
    console.error('Get workspace error:', error);
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid workspace id' });
    res.status(500).json({ message: 'Failed to fetch workspace', error: error.message });
  }
};

// Update workspace
export const updateWorkspace = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });

    const { id } = req.params;
    const { name, description, settings } = req.body;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const workspace = await Workspace.findOneAndUpdate(
      { _id: id, owner: userId },
      { name, description, settings },
      { new: true, runValidators: true }
    );

    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    res.json({ message: 'Workspace updated successfully', workspace });
  } catch (error) {
    console.error('Update workspace error:', error);
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid workspace id' });
    res.status(500).json({ message: 'Failed to update workspace', error: error.message });
  }
};

// Delete workspace
export const deleteWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const workspace = await Workspace.findOneAndUpdate({ _id: id, owner: userId }, { isActive: false }, { new: true });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Delete workspace error:', error);
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid workspace id' });
    res.status(500).json({ message: 'Failed to delete workspace', error: error.message });
  }
};

// Get workspace statistics
export const getWorkspaceStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Missing authenticated user' });

    const workspace = await Workspace.findOne({ _id: id, owner: userId });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const [datasetCount, annotationCount, modelCount] = await Promise.all([
      Dataset.countDocuments({ workspace: id }),
      Annotation.countDocuments({ workspace: id }),
      ModelMeta.countDocuments({ workspace: id })
    ]);

    res.json({
      stats: {
        datasets: datasetCount,
        annotations: annotationCount,
        models: modelCount,
        createdAt: workspace.createdAt
      }
    });
  } catch (error) {
    console.error('Get workspace stats error:', error);
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid workspace id' });
    res.status(500).json({ message: 'Failed to fetch workspace statistics', error: error.message });
  }
};
