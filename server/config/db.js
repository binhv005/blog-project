import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows DNS SRV query ECONNREFUSED on MongoDB Atlas
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch (e) {
    console.warn('[DNS] Không thể gán custom DNS servers:', e.message);
  }
}

// Serverless-ready MongoDB connection caching
let cachedPromise = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dudi_blog';
  cachedPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  }).then((conn) => {
    console.log(`[MongoDB] Kết nối thành công tới: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  }).catch((error) => {
    cachedPromise = null;
    console.error(`[MongoDB] Lỗi kết nối: ${error.message}`);
    console.warn(`[MongoDB] Vui lòng kiểm tra lại dịch vụ MongoDB hoặc cấu hình MONGODB_URI trong file .env`);
    return false;
  });

  return cachedPromise;
};
