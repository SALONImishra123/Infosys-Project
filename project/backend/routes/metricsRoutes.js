// routes/metricsRoutes.js
import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Resolve reports directory relative to project root
const REPORTS_DIR = path.resolve(process.cwd(), 'backend', 'reports');

// GET /api/models/metrics
router.get('/metrics', (req, res) => {
  try {
    const metricsFile = path.join(REPORTS_DIR, 'latest_metrics.json');
    if (!fs.existsSync(metricsFile)) return res.status(404).json({ message: 'Metrics not found' });
    const data = JSON.parse(fs.readFileSync(metricsFile, 'utf-8'));
    return res.json(data);
  } catch (err) {
    console.error('Metrics fetch error:', err);
    return res.status(500).json({ message: 'Failed to fetch metrics' });
  }
});

// GET /api/models/metrics/versions
router.get('/metrics/versions', (req, res) => {
  try {
    if (!fs.existsSync(REPORTS_DIR)) return res.status(404).json({ message: 'Reports folder not found' });
    const files = fs.readdirSync(REPORTS_DIR).filter(f => f.startsWith('model_metadata_v') && f.endsWith('.json'));
    const versions = files.map(f => JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, f), 'utf-8')));
    return res.json(versions);
  } catch (err) {
    console.error('Versions fetch error:', err);
    return res.status(500).json({ message: 'Failed to fetch model versions' });
  }
});

// GET /api/models/confusion-matrix
router.get('/confusion-matrix', (req, res) => {
  try {
    if (!fs.existsSync(REPORTS_DIR)) return res.status(404).json({ message: 'Reports folder not found' });
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(f => /^confusion.*\.png$/i.test(f))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(REPORTS_DIR, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);

    if (!files.length) return res.status(404).json({ message: 'No confusion matrix available' });

    const latest = files[0].name;
    const filePath = path.join(REPORTS_DIR, latest);
    return res.sendFile(path.resolve(filePath));
  } catch (err) {
    console.error('Confusion fetch error:', err);
    return res.status(500).json({ message: 'Failed to fetch confusion matrix' });
  }
});

export default router;
