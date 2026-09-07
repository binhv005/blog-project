import express from 'express';
import { uploadImage, syncAllImages } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/', uploadImage);
router.post('/sync-all', syncAllImages);

export default router;
