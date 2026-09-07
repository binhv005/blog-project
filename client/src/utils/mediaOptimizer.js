/**
 * Media Optimization Utility for High Performance Web Assets
 * - Dynamic CDN image transformations (Cloudinary, Unsplash, Google CDN)
 * - Fast client-side canvas compression to WebP before uploading
 * - Privacy and performance-optimized video embed URLs
 */

/**
 * Optimizes remote image URLs with CDN query parameters for WebP, auto-compression, and responsive width
 * @param {string} url - Original image URL
 * @param {object} options - Optimization parameters { width, quality, format }
 * @returns {string} - Optimized URL
 */
export function optimizeImageUrl(url, { width = 1200, quality = 80, format = 'webp' } = {}) {
  if (!url || typeof url !== 'string') return '';

  // Skip base64, blobs, and SVG
  if (url.startsWith('data:') || url.startsWith('blob:') || url.endsWith('.svg')) {
    return url;
  }

  // 1. Cloudinary CDN Transformation
  if (url.includes('res.cloudinary.com')) {
    if (url.includes('/upload/') && !url.includes('/upload/f_') && !url.includes('/upload/w_') && !url.includes('/upload/c_')) {
      const transform = `f_auto,q_auto:good,w_${width},c_limit`;
      return url.replace('/upload/', `/upload/${transform}/`);
    }
    return url;
  }

  // 2. Unsplash CDN Transformation
  if (url.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('fm', format);
      urlObj.searchParams.set('q', String(quality));
      if (width) urlObj.searchParams.set('w', String(width));
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  // 3. Google CDN Photos / Avatars
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=s\d+[^?]*$/i, `=s${width}-rw`).replace(/=w\d+[^?]*$/i, `=w${width}-rw`);
  }

  return url;
}

/**
 * Compresses an image file on the client using HTML5 Canvas before upload
 * Reduces upload time from seconds to milliseconds and cuts payload size by 70-90%
 * @param {File} file - Browser File object
 * @param {object} options - { maxWidth, maxHeight, quality }
 * @returns {Promise<{ base64: string, blob: Blob, width: number, height: number }>}
 */
export async function compressImageFile(
  file,
  { maxWidth = 1600, maxHeight = 1600, quality = 0.85 } = {}
) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Tệp không phải là hình ảnh');
  }

  // For GIFs or SVGs, skip canvas compression to preserve animation / vector quality
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ base64: reader.result, blob: file, width: 0, height: 0 });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio bounded by maxWidth & maxHeight
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ base64: e.target.result, blob: file, width, height });
          return;
        }

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for optimal compression
        let base64 = canvas.toDataURL('image/webp', quality);
        if (!base64.startsWith('data:image/webp')) {
          base64 = canvas.toDataURL('image/jpeg', quality);
        }

        canvas.toBlob(
          (blob) => {
            resolve({
              base64,
              blob: blob || file,
              width,
              height
            });
          },
          'image/webp',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Normalizes video URLs to lightweight, fast-loading privacy-enhanced embed URLs
 * @param {string} url - YouTube / Vimeo URL or embed code
 * @returns {string} - Fast embed URL
 */
export function formatVideoEmbedUrl(url) {
  if (!url) return '';
  let cleanUrl = String(url).trim();

  // Extract from iframe tag if pasted full iframe code
  const iframeMatch = cleanUrl.match(/src=["']([^"']+)["']/i);
  if (iframeMatch) {
    cleanUrl = iframeMatch[1];
  }

  // YouTube match (including shorts, live, standard watch, youtu.be)
  const ytMatch = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    // Use youtube-nocookie.com for lower tracking overhead & faster load
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1&playsinline=1`;
  }

  // Vimeo match
  const vimeoMatch = cleanUrl.match(
    /(?:vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|))(\d+)/i
  );
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1&app_id=122963`;
  }

  return cleanUrl;
}
