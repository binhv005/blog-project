import express from 'express';
import { uploadImage, uploadVideo, syncAllImages } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/', uploadImage);
router.post('/video', uploadVideo);
router.post('/sync-all', syncAllImages);

export default router;
