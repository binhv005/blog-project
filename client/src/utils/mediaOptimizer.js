/**
 * Enterprise Media Optimization Utility
 * - Cloudinary & Unsplash CDN on-the-fly transformations (f_auto, q_auto, w_xxx, dpr_auto)
 * - Responsive srcSet and sizes generator
 * - Low-Quality Image Placeholders (LQIP blur-up)
 * - Client-side HTML5 Canvas WebP image compression
 * - Privacy and performance-optimized video embed URLs
 */

const DEFAULT_WIDTHS = [360, 640, 960, 1200, 1600];

/**
 * Optimizes an image URL with CDN transformations (format, quality, width, crop, blur)
 * @param {string} url - Original image URL
 * @param {object} options - Transformation options
 * @returns {string} - Optimized CDN URL
 */
export function optimizeImageUrl(url, {
  width,
  height,
  quality = 'auto:good',
  format = 'auto',
  crop = 'limit',
  blur = 0,
  dpr = 'auto'
} = {}) {
  if (!url || typeof url !== 'string') return '';

  // Skip base64, blobs, SVG vectors, and local assets
  if (url.startsWith('data:') || url.startsWith('blob:') || url.endsWith('.svg') || url.startsWith('/')) {
    return url;
  }

  // 1. Cloudinary CDN Transformation
  if (url.includes('res.cloudinary.com')) {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex !== -1) {
      const prefix = url.substring(0, uploadIndex + 8);
      let suffix = url.substring(uploadIndex + 8);

      // Extract existing transformation if present (e.g. /upload/v12345/ or /upload/f_auto,w_800/v12345/)
      let versionAndPath = suffix;
      const firstSegment = suffix.split('/')[0];
      if (firstSegment && !firstSegment.startsWith('v') && !firstSegment.includes('.')) {
        // First segment is already a transformation, replace it
        versionAndPath = suffix.substring(firstSegment.length + 1);
      }

      const transforms = [`f_${format}`, `q_${quality}`];
      if (dpr) transforms.push(`dpr_${dpr}`);
      if (width) transforms.push(`w_${Math.round(width)}`);
      if (height) transforms.push(`h_${Math.round(height)}`);
      if (crop && (width || height)) transforms.push(`c_${crop}`);
      if (blur > 0) transforms.push(`e_blur:${Math.round(blur)}`);

      return `${prefix}${transforms.join(',')}/${versionAndPath}`;
    }
    return url;
  }

  // 2. Unsplash CDN Transformation
  if (url.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('fm', format === 'auto' ? 'webp' : format);
      urlObj.searchParams.set('q', quality.includes('auto') ? '80' : String(quality));
      if (width) urlObj.searchParams.set('w', String(Math.round(width)));
      if (height) urlObj.searchParams.set('h', String(Math.round(height)));
      if (blur > 0) urlObj.searchParams.set('blur', String(Math.min(100, blur)));
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  // 3. Google User Content / Photos CDN
  if (url.includes('googleusercontent.com')) {
    let cleanUrl = url.replace(/=(?:s|w|h)\d+[^?]*$/i, '');
    if (width) {
      return `${cleanUrl}=w${Math.round(width)}-rw`;
    }
    return `${cleanUrl}=rw`;
  }

  return url;
}

/**
 * Generates responsive srcSet for CDN images across standard viewport breakpoints
 * @param {string} url - Original image URL
 * @param {number[]} widths - Array of target widths in px
 * @param {object} options - Optimization parameters
 * @returns {string|undefined} - srcSet string e.g. "url1 360w, url2 640w..."
 */
export function generateSrcSet(url, widths = DEFAULT_WIDTHS, options = {}) {
  if (!url || typeof url !== 'string') return undefined;

  // Only generate srcSet for scalable remote CDN assets
  if (!url.includes('res.cloudinary.com') && !url.includes('images.unsplash.com') && !url.includes('googleusercontent.com')) {
    return undefined;
  }

  return widths
    .map((w) => {
      const optimized = optimizeImageUrl(url, { ...options, width: w });
      return `${optimized} ${w}w`;
    })
    .join(', ');
}

/**
 * Generates a tiny blurred placeholder for progressive blur-up loading (LQIP)
 * @param {string} url - Original image URL
 * @returns {string} - Low-quality placeholder URL
 */
export function getLowQualityPlaceholder(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) return url;

  if (url.includes('res.cloudinary.com')) {
    return optimizeImageUrl(url, { width: 30, quality: '10', blur: 300, format: 'auto' });
  }

  if (url.includes('images.unsplash.com')) {
    return optimizeImageUrl(url, { width: 30, quality: '10', blur: 50, format: 'webp' });
  }

  return optimizeImageUrl(url, { width: 40 });
}

/**
 * Client-side HTML5 Canvas WebP image compressor before upload
 * Resizes large photos to optimal dimensions & converts to WebP, saving 80-90% bandwidth
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

  // Preserve animations for GIFs and vector for SVGs
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

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

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
 * @param {string} url - YouTube / Vimeo URL or iframe embed snippet
 * @returns {string} - Fast embed URL
 */
export function formatVideoEmbedUrl(url) {
  if (!url) return '';
  let cleanUrl = String(url).trim();

  const iframeMatch = cleanUrl.match(/src=["']([^"']+)["']/i);
  if (iframeMatch) {
    cleanUrl = iframeMatch[1];
  }

  const ytMatch = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1&playsinline=1`;
  }

  const vimeoMatch = cleanUrl.match(
    /(?:vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|))(\d+)/i
  );
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1&app_id=122963`;
  }

  return cleanUrl;
}
