import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ai1z2oaj',
  api_key: process.env.CLOUDINARY_API_KEY || '172892198212144',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'SM1DvYl34kk34BNEwAtz-F6k0l4',
  secure: true,
});

export default cloudinary;
