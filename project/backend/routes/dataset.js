// routes/dataset.js
import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import {
  uploadDataset,
  getWorkspaceDatasets,
  getDatasetById,
  deleteDataset,
  getDatasetStats
} from '../controllers/datasetController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


router.use(authenticateToken);

// Validation
const uploadValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Dataset name is required'),
  body('format')
    .notEmpty()
    .customSanitizer(v => (v ? v.toString().toLowerCase() : v))
    .isIn(['csv', 'json', 'rasa'])
    .withMessage('Format must be csv, json, or rasa'),
  body('workspaceId')
    .isMongoId()
    .withMessage('Valid workspace ID is required'),
  // data may be provided in body (JSON) OR file via multipart
  body('data').optional()
];



// Upload supports JSON body (data field) OR multipart file under 'file'
router.post('/upload', upload.single('file'), uploadValidation, uploadDataset);

// Support POST directly on workspace datasets route (file or JSON)
router.post('/workspace/:workspaceId', upload.single('file'), uploadValidation, (req, res) => {
  req.body.workspaceId = req.params.workspaceId;
  uploadDataset(req, res);
});

// Other routes
router.get('/workspace/:workspaceId', getWorkspaceDatasets);
router.get('/:id', getDatasetById);
router.delete('/:id', deleteDataset);
router.get('/:id/stats', getDatasetStats);

export default router;
