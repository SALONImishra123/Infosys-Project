import { validationResult } from 'express-validator';
import Workspace from '../models/Workspace.js';
import Dataset from '../models/Dataset.js';
import Annotation from '../models/Annotation.js';
import ModelMeta from '../models/ModelMeta.js';

// Create workspace
export const createWorkspace = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, settings } = req.body;

    const workspace = new Workspace({
      name,
      description,
      owner: req.user._id,
      settings: settings || {}
    });

    await workspace.save();

    res.status(201).json({
      message: 'Workspace created successfully',
      workspace
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ message: 'Failed to create workspace' });
  }
};

// Get user workspaces
export const getUserWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ 
      owner: req.user._id,
      isActive: true 
    })
    .select('-__v')
    .sort({ createdAt: -1 })
    .populate('datasets', 'name format statistics')
    .populate('annotations', 'text intent')
    .populate('models', 'name version status');

    res.json({
      workspaces,
      count: workspaces.length
    });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ message: 'Failed to fetch workspaces' });
  }
};

// Get workspace by ID
export const getWorkspaceById = async (req, res) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findOne({
      _id: id,
      owner: req.user._id
    })
    .populate('datasets')
    .populate('annotations')
    .populate('models')
    .populate('owner', 'name email');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    res.json({ workspace });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ message: 'Failed to fetch workspace' });
  }
};

// Update workspace
export const updateWorkspace = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { name, description, settings } = req.body;

    const workspace = await Workspace.findOneAndUpdate(
      { _id: id, owner: req.user._id },
      { name, description, settings },
      { new: true, runValidators: true }
    );

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    res.json({
      message: 'Workspace updated successfully',
      workspace
    });
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ message: 'Failed to update workspace' });
  }
};

// Delete workspace
export const deleteWorkspace = async (req, res) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findOneAndUpdate(
      { _id: id, owner: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ message: 'Failed to delete workspace' });
  }
};

// Get workspace statistics
export const getWorkspaceStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify workspace ownership
    const workspace = await Workspace.findOne({
      _id: id,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Get statistics
    const [datasetCount, annotationCount, modelCount] = await Promise.all([
      Dataset.countDocuments({ workspace: id }),
      Annotation.countDocuments({ workspace: id }),
      ModelMeta.countDocuments({ workspace: id })
    ]);

    const stats = {
      datasets: datasetCount,
      annotations: annotationCount,
      models: modelCount,
      createdAt: workspace.createdAt
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get workspace stats error:', error);
    res.status(500).json({ message: 'Failed to fetch workspace statistics' });
  }
};