import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import postRoutes from './routes/postRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'DUDI Blog MongoDB Backend', 
    cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/posts', postRoutes);
app.use('/api/upload', uploadRoutes);

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, message: err.message || 'Lỗi hệ thống máy chủ' });
});

// Start Server & Connect MongoDB
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`🚀 [Server] Backend REST API đang chạy tại: http://localhost:${PORT}`);
    console.log(`📄 [API Docs] Endpoint bài viết: http://localhost:${PORT}/api/posts`);
  });

  // Connect MongoDB asynchronously
  connectDB();
};

startServer();
