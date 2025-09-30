import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import portfinder from 'portfinder';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspace.js';
import datasetRoutes from './routes/dataset.js';
import annotationRoutes from './routes/annotation.js';
import modelRoutes from './routes/model.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/models', modelRoutes);

// --- Serve confusion matrix PNG ---
app.get('/api/confusion-matrix', (req, res) => {
  try {
    const cmPath = path.join(__dirname, 'reports', 'confusion_matrix.png'); 
    if (!fs.existsSync(cmPath)) return res.status(404).json({ message: 'Confusion matrix not found' });
    res.sendFile(cmPath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch confusion matrix' });
  }
});

// --- Serve metrics JSON ---
app.get('/api/models/metrics', (req, res) => {
  try {
    const metricsPath = path.join(__dirname, 'reports', 'eval.json'); 
    if (!fs.existsSync(metricsPath)) return res.status(404).json({ message: 'Metrics not found' });
    const metricsData = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
    res.json(metricsData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch metrics' });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'NLU Trainer API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// --- Auto Port Detection ---
const DEFAULT_PORT = process.env.PORT || 5050;

portfinder.getPortPromise({ port: DEFAULT_PORT })
  .then((port) => {
    app.listen(port, () => {
      console.log(`🚀 NLU Trainer Backend Server running on port ${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  })
  .catch((err) => {
    console.error("❌ Could not find a free port:", err);
    process.exit(1);
  });

// --- Graceful Shutdown ---
process.on('SIGINT', () => {
  console.log("\n🛑 Server shutting down gracefully...");
  process.exit(0);
});
