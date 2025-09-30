import { validationResult } from 'express-validator';
import Dataset from '../models/Dataset.js';
import Workspace from '../models/Workspace.js';
import { parseDataset } from '../utils/datasetParser.js';

// Upload dataset
export const uploadDataset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { workspaceId, name, format, data } = req.body;

    // Verify workspace ownership
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      owner: req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Parse dataset based on format
    const parsedData = await parseDataset(data, format);

    const dataset = new Dataset({
      name,
      format,
      workspace: workspaceId,
      uploadedBy: req.user._id,
      data: parsedData.data,
      statistics: parsedData.statistics,
      status: 'ready'
    });

    await dataset.save();

    // Add dataset to workspace
    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: { datasets: dataset._id }
    });

    res.status(201).json({
      message: 'Dataset uploaded successfully',
      dataset
    });
  } catch (error) {
    console.error('Upload dataset error:', error);
    res.status(500).json({ message: 'Failed to upload dataset', error: error.message });
  }
};

// Get workspace datasets
export const getWorkspaceDatasets = async (req, res) => {
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

    const datasets = await Dataset.find({ workspace: workspaceId })
      .select('-data.rawData') // Exclude raw data for performance
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      datasets,
      count: datasets.length
    });
  } catch (error) {
    console.error('Get datasets error:', error);
    res.status(500).json({ message: 'Failed to fetch datasets' });
  }
};

// Get dataset by ID
export const getDatasetById = async (req, res) => {
  try {
    const { id } = req.params;

    const dataset = await Dataset.findById(id)
      .populate('workspace', 'name owner')
      .populate('uploadedBy', 'name email');

    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    // Verify workspace ownership
    if (dataset.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ dataset });
  } catch (error) {
    console.error('Get dataset error:', error);
    res.status(500).json({ message: 'Failed to fetch dataset' });
  }
};

// Delete dataset
export const deleteDataset = async (req, res) => {
  try {
    const { id } = req.params;

    const dataset = await Dataset.findById(id).populate('workspace', 'owner');

    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    // Verify workspace ownership
    if (dataset.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Dataset.findByIdAndDelete(id);

    // Remove dataset from workspace
    await Workspace.findByIdAndUpdate(dataset.workspace._id, {
      $pull: { datasets: id }
    });

    res.json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    console.error('Delete dataset error:', error);
    res.status(500).json({ message: 'Failed to delete dataset' });
  }
};

// Get dataset statistics
export const getDatasetStats = async (req, res) => {
  try {
    const { id } = req.params;

    const dataset = await Dataset.findById(id)
      .select('statistics data.intents data.entities')
      .populate('workspace', 'owner');

    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    // Verify workspace ownership
    if (dataset.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = {
      ...dataset.statistics.toObject(),
      intentsList: dataset.data.intents.map(intent => ({
        name: intent.name,
        exampleCount: intent.examples.length
      })),
      entitiesList: dataset.data.entities.map(entity => ({
        name: entity.name,
        valueCount: entity.values.length
      }))
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get dataset stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dataset statistics' });
  }
};