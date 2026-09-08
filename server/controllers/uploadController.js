import cloudinary from '../config/cloudinary.js';
import Post from '../models/Post.js';

// POST /api/upload - Upload single image (base64 or remote URL) to Cloudinary
export const uploadImage = async (req, res) => {
  try {
    const { image, folder = 'dudi_blog' } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'Dữ liệu ảnh không được để trống' });
    }

    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder,
      resource_type: 'image',
      format: 'webp',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    res.json({
      success: true,
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
      format: uploadResponse.format,
      width: uploadResponse.width,
      height: uploadResponse.height
    });
  } catch (error) {
    console.error('[Cloudinary Upload Error]', error);
// POST /api/upload/video - Upload single video (base64, data URI, or remote URL) to Cloudinary
export const uploadVideo = async (req, res) => {
  try {
    const { video, folder = 'dudi_blog/videos' } = req.body;

    if (!video) {
      return res.status(400).json({ success: false, message: 'Dữ liệu video không được để trống' });
    }

    const uploadResponse = await cloudinary.uploader.upload(video, {
      folder,
      resource_type: 'video'
    });

    res.json({
      success: true,
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
      format: uploadResponse.format,
      duration: uploadResponse.duration,
      width: uploadResponse.width,
      height: uploadResponse.height
    });
  } catch (error) {
    console.error('[Cloudinary Video Upload Error]', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi tải video lên Cloudinary' });
  }
};


// POST /api/upload/sync-all - Migrate & sync all post images in MongoDB to Cloudinary
export const syncAllImages = async (req, res) => {
  try {
    const posts = await Post.find();
    let syncedCount = 0;

    for (const post of posts) {
      let isModified = false;

      // 1. Sync Cover Image
      if (post.coverImage && !post.coverImage.includes('cloudinary.com')) {
        try {
          console.log(`[Cloudinary Sync] Đang đồng bộ ảnh bìa bài viết: ${post.title}`);
          const resCover = await cloudinary.uploader.upload(post.coverImage, {
            folder: 'dudi_blog/covers',
            format: 'webp',
            transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }]
          });
          post.coverImage = resCover.secure_url;
          isModified = true;
          syncedCount++;
        } catch (err) {
          console.warn(`[Cloudinary Sync Warning] Không thể upload ảnh bìa "${post.coverImage}":`, err.message);
        }
      }

      // 2. Sync Author Avatar
      if (post.author?.avatar && !post.author.avatar.includes('cloudinary.com')) {
        try {
          const resAvatar = await cloudinary.uploader.upload(post.author.avatar, {
            folder: 'dudi_blog/authors',
            format: 'webp',
            transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }]
          });
          post.author.avatar = resAvatar.secure_url;
          isModified = true;
          syncedCount++;
        } catch (err) {
          console.warn(`[Cloudinary Sync Warning] Không thể upload avatar "${post.author.avatar}":`, err.message);
        }
      }

      // 3. Sync Blocks Images
      if (post.blocks && Array.isArray(post.blocks)) {
        for (const block of post.blocks) {
          if (block.type === 'image' && block.url && !block.url.includes('cloudinary.com')) {
            try {
              console.log(`[Cloudinary Sync] Đang đồng bộ ảnh block: ${block.caption || block.url}`);
              const resBlock = await cloudinary.uploader.upload(block.url, {
                folder: 'dudi_blog/blocks',
                format: 'webp',
                transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }]
              });
              block.url = resBlock.secure_url;
              isModified = true;
              syncedCount++;
            } catch (err) {
              console.warn(`[Cloudinary Sync Warning] Không thể upload block image "${block.url}":`, err.message);
            }
          }
        }
      }

      if (isModified) {
        await post.save();
      }
    }

    const updatedPosts = await Post.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      message: `Đã đồng bộ thành công ${syncedCount} ảnh lên Cloudinary!`,
      syncedCount,
      data: updatedPosts
    });
  } catch (error) {
    console.error('[Cloudinary Sync All Error]', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi đồng bộ ảnh lên Cloudinary' });
  }
};
