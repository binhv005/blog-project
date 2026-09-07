import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../server/config/db.js';
import postRoutes from '../server/routes/postRoutes.js';
import uploadRoutes from '../server/routes/uploadRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Middleware to ensure MongoDB connection before request processing
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DUDI Blog Serverless Backend (Vercel)',
    cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/posts', postRoutes);
app.use('/api/upload', uploadRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, message: err.message || 'Lỗi hệ thống máy chủ' });
});

export default app;
