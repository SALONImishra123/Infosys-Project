import express from 'express';
import { body } from 'express-validator';
import {
  createAnnotation,
  getWorkspaceAnnotations,
  getAnnotationById,
  updateAnnotation,
  deleteAnnotation,
  getAnnotationStats
} from '../controllers/annotationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const annotationValidation = [
  body('text')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Text is required'),
  body('intent.name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Intent name is required'),
  body('workspaceId')
    .isMongoId()
    .withMessage('Valid workspace ID is required'),
  body('entities')
    .optional()
    .isArray()
    .withMessage('Entities must be an array')
];

// All routes require authentication
router.use(authenticateToken);

// Routes
router.post('/', annotationValidation, createAnnotation);
router.get('/workspace/:workspaceId', getWorkspaceAnnotations);
router.get('/workspace/:workspaceId/stats', getAnnotationStats);
router.get('/:id', getAnnotationById);
router.put('/:id', annotationValidation, updateAnnotation);
router.delete('/:id', deleteAnnotation);

export default router;