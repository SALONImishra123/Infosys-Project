import express from 'express';
import { body } from 'express-validator';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceStats
} from '../controllers/workspaceController.js';
import { authenticateToken } from '../middleware/auth.js';
import { getWorkspaceDatasets } from '../controllers/datasetController.js';
import { getWorkspaceAnnotations, getAnnotationStats } from '../controllers/annotationController.js';
import ModelMeta from '../models/ModelMeta.js';

// 🟩 ADD THIS IMPORT
import { trainModel } from '../controllers/modelController.js';


const router = express.Router();

// Validation
const workspaceValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Workspace name is required and must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

// Automatically attach authentication middleware
router.use(authenticateToken);

// CRUD
router.post('/', workspaceValidation, createWorkspace);
router.get('/', getUserWorkspaces);
router.get('/:id([0-9a-fA-F]{24})', getWorkspaceById);
router.put('/:id([0-9a-fA-F]{24})', workspaceValidation, updateWorkspace);
router.delete('/:id([0-9a-fA-F]{24})', deleteWorkspace);
router.get('/:id([0-9a-fA-F]{24})/stats', getWorkspaceStats);

// Nested routes
router.get('/:workspaceId([0-9a-fA-F]{24})/datasets', getWorkspaceDatasets);
router.get('/:workspaceId([0-9a-fA-F]{24})/annotations', getWorkspaceAnnotations);
router.get('/:workspaceId([0-9a-fA-F]{24})/annotations/stats', getAnnotationStats);
router.get('/:workspaceId([0-9a-fA-F]{24})/models', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const models = await ModelMeta.find({ workspace: workspaceId }).sort({ createdAt: -1 });
    res.json(models);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch models' });
  }
});

// 🟩 ADD THIS TRAINING ROUTE
router.post('/:workspaceId([0-9a-fA-F]{24})/train', trainModel);

export default router;
