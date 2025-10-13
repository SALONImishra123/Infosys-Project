// server.js (improved)
import express from 'express';
import cors from 'cors';
import evalRoutes from './routes/eval.js';
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
import mongoose from 'mongoose';
import metricsRoutes from './routes/metricsRoutes.js';

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env (robust path)
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: fs.existsSync(envPath) ? envPath : undefined });

// App & config
const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT || '5050', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Reports dir (ensure exists)
const REPORTS_DIR = path.join(__dirname, 'reports');
fs.mkdirSync(REPORTS_DIR, { recursive: true });

// Middleware
const corsOptions = {
  origin: (origin, callback) => {
    // allow undefined origin (e.g., curl, server-side)
    if (!origin) return callback(null, true);
    // support comma-separated FRONTEND_URLs
    const allowed = (FRONTEND_URL || '').split(',').map(s => s.trim());
    if (allowed.includes(origin) || allowed.includes('*')) return callback(null, true);
    return callback(new Error('CORS policy: origin denied'), false);
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use('/api/eval', evalRoutes);
app.use('/api/models', metricsRoutes); // metricsRoutes contains /metrics and /confusion-matrix endpoints

// Serve reports folder publicly (so frontend can fetch /reports/confusion_matrix.png)
app.use('/reports', express.static(REPORTS_DIR));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/workspaces/:workspaceId/annotations', annotationRoutes);
app.use('/api/models', modelRoutes);

// Public fallback single-file route (optional)
app.get('/public/confusion-matrix', (req, res) => {
  try {
    const filePath = path.join(REPORTS_DIR, 'confusion_matrix.png');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.status(404).json({ message: 'Confusion matrix not found' });
  } catch (err) {
    console.error('Error sending public confusion matrix:', err);
    return res.status(500).json({ message: 'Failed to send confusion matrix' });
  }
});

// Health
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'NLU Trainer API is running' }));

// Error handling (last middlewares)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server only after DB connected
async function startServer() {
  try {
    await connectDB(); // ensure this throws on failure
    // optional: check mongoose connection
    if (mongoose.connection && mongoose.connection.readyState !== 1) {
      console.warn('Warning: mongoose not fully connected (state: ' + mongoose.connection.readyState + ')');
    }

    const port = await portfinder.getPortPromise({ port: DEFAULT_PORT });
    const server = app.listen(port, () => {
      console.log(`🚀 NLU Trainer Backend Server running on port ${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL(s): ${FRONTEND_URL}`);
      console.log(`📁 Reports dir: ${REPORTS_DIR}`);
    });

    // graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Server shutting down gracefully...');
      server.close(async () => {
        try {
          await mongoose.disconnect();
          console.log('✅ MongoDB disconnected');
          process.exit(0);
        } catch (e) {
          console.error('Error during shutdown:', e);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
