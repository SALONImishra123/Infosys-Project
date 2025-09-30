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

const router = express.Router();

// Validation rules
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

// All routes require authentication
router.use(authenticateToken);

// Routes
router.post('/', workspaceValidation, createWorkspace);
router.get('/', getUserWorkspaces);
router.get('/:id', getWorkspaceById);
router.put('/:id', workspaceValidation, updateWorkspace);
router.delete('/:id', deleteWorkspace);
router.get('/:id/stats', getWorkspaceStats);

export default router;