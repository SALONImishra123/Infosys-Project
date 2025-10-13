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

const router = express.Router({ mergeParams: true }); // mergeParams needed for workspaceId

// Validation rules
const annotationValidation = [
  body('text')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Text is required'),
  body('intent')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Intent name is required'),
  body('entities')
    .optional()
    .isArray()
    .withMessage('Entities must be an array')
];

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Routes under /workspaces/:workspaceId/annotations
router.post('/', annotationValidation, createAnnotation);        // POST /annotations
router.get('/', getWorkspaceAnnotations);                        // GET /annotations
router.get('/stats', getAnnotationStats);                        // GET /annotations/stats
router.get('/:id', getAnnotationById);                            // GET /annotations/:id
router.put('/:id', annotationValidation, updateAnnotation);      // PUT /annotations/:id
router.delete('/:id', deleteAnnotation);                         // DELETE /annotations/:id

export default router;
