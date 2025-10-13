// routes/model.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  predict,
  trainModel,
  getWorkspaceModels,
  getModelById,
  updateModel,
  deleteModel,
  getModelStatus
} from '../controllers/modelController.js';

const router = express.Router();

// Protect all model routes
router.use(authenticateToken);

// POST /api/models/predict
// (keeps token available in req.user if frontend includes Authorization header)
router.post('/predict', predict);

// POST /api/models/train
router.post('/train', trainModel);

// GET /api/models/workspace/:workspaceId
router.get('/workspace/:workspaceId', getWorkspaceModels);

// GET /api/models/:id/status
router.get('/:id/status', getModelStatus);

// GET /api/models/:id
router.get('/:id', getModelById);

// PUT /api/models/:id
router.put('/:id', updateModel);

// DELETE /api/models/:id
router.delete('/:id', deleteModel);

export default router;
