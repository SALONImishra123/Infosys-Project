import express from 'express';
import { body } from 'express-validator';
import {
  uploadDataset,
  getWorkspaceDatasets,
  getDatasetById,
  deleteDataset,
  getDatasetStats
} from '../controllers/datasetController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const uploadValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Dataset name is required'),
  body('format')
    .isIn(['csv', 'json', 'rasa'])
    .withMessage('Format must be csv, json, or rasa'),
  body('workspaceId')
    .isMongoId()
    .withMessage('Valid workspace ID is required'),
  body('data')
    .notEmpty()
    .withMessage('Dataset data is required')
];

// All routes require authentication
router.use(authenticateToken);

// Routes
router.post('/upload', uploadValidation, uploadDataset);
router.get('/workspace/:workspaceId', getWorkspaceDatasets);
router.get('/:id', getDatasetById);
router.delete('/:id', deleteDataset);
router.get('/:id/stats', getDatasetStats);

export default router;