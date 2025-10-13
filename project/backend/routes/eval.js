// backend/routes/eval.js
import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = path.join(__dirname, '..');
const REPORTS_DIR = path.join(BACKEND_DIR, 'reports');

// helper: get latest confusion png (or null)
function getLatestConfusion() {
  if (!fs.existsSync(REPORTS_DIR)) return null;
  const files = fs.readdirSync(REPORTS_DIR)
    .filter(f => /^confusion.*\.png$/i.test(f))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(REPORTS_DIR, f)).mtime }))
    .sort((a,b) => b.mtime - a.mtime);
  return files.length ? files[0].name : null;
}

// GET latest report meta
router.get('/latest', (req, res) => {
  try {
    const latest = getLatestConfusion();
    if (!latest) return res.status(404).json({ message: 'No confusion matrix found' });
    return res.json({ fileName: latest, reportUrl: `/reports/${latest}` });
  } catch (err) {
    console.error('Error /api/eval/latest', err);
    return res.status(500).json({ message: 'Failed to read reports' });
  }
});

// POST run evaluation (spawns python script generate_confusion.py)
router.post('/run', (req, res) => {
  try {
    const scriptPath = path.join(BACKEND_DIR, 'generate_confusion.py');
    if (!fs.existsSync(scriptPath)) return res.status(500).json({ message: 'Evaluation script not found', scriptPath });

    // choose python command robustly
    const isWin = process.platform === 'win32';
    const pythonCmd = process.env.PYTHON || (isWin ? 'py' : 'python');
    const args = isWin ? ['-3', scriptPath] : [scriptPath];

    const proc = spawn(pythonCmd, args, { cwd: BACKEND_DIR });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('error', (err) => {
      console.error('Failed to spawn python:', err);
      return res.status(500).json({ message: 'Failed to start python', error: err.message, stderr });
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script failed:', code, stderr);
        return res.status(500).json({ message: 'Python script failed', code, stderr });
      }
      const latest = getLatestConfusion();
      return res.json({ message: 'Report generated', reportUrl: latest ? `/reports/${latest}` : null, stdout });
    });
  } catch (err) {
    console.error('Eval run error', err);
    res.status(500).json({ message: 'Failed to run evaluation', error: err.message });
  }
});

export default router;
