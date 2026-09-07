import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import postRoutes from './routes/postRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'DUDI Blog MongoDB Backend', timestamp: new Date().toISOString() });
});

// Post Routes
app.use('/api/posts', postRoutes);

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
