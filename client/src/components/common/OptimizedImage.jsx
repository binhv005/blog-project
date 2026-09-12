import React, { useState, useEffect, useRef, memo } from 'react';
import { optimizeImageUrl, generateSrcSet, getLowQualityPlaceholder } from '../../utils/mediaOptimizer';

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80&fm=webp';

/**
 * Enterprise Optimized Image Component
 * - Next-gen format (WebP/AVIF) and quality optimization via Cloudinary CDN
 * - Responsive srcSet & sizes for various viewports
 * - Native lazy loading for below-the-fold & high-priority eager for Hero
 * - Progressive blur-up placeholder to eliminate Cumulative Layout Shift (CLS)
 * - Automatic error recovery & duplicate request deduplication
 */
function OptimizedImageComponent({
  src,
  alt = 'Hình ảnh',
  className = '',
  containerClassName = '',
  width,
  height,
  priority = false,
  sizes,
  aspectRatio,
  fallbackSrc = DEFAULT_FALLBACK,
  showBlurPlaceholder = true,
  objectFit = 'cover',
  onClick,
  style = {},
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Compute optimized main URL, responsive srcSet and low-res placeholder
  const activeSrc = hasError ? fallbackSrc : (src || fallbackSrc);
  const optimizedMainSrc = optimizeImageUrl(activeSrc, { width: width || 1200, height });
  const responsiveSrcSet = !hasError && (!width || width > 300)
    ? generateSrcSet(activeSrc, [360, 640, 960, 1200, 1600])
    : undefined;
  const lqipSrc = showBlurPlaceholder && !hasError && !activeSrc.startsWith('data:') && !activeSrc.startsWith('/')
    ? getLowQualityPlaceholder(activeSrc)
    : '';

  // Reset loaded status when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    // If image is already cached by browser, mark as loaded immediately
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setIsLoaded(true);
    }
  };

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={{
        aspectRatio: aspectRatio || undefined,
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
        ...style
      }}
      onClick={onClick}
    >
      {/* 1. Low-Quality Blur-Up Placeholder / Background Skeleton */}
      {showBlurPlaceholder && !isLoaded && (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-200/80 dark:bg-[#1a1426] z-0 animate-pulse">
          {lqipSrc ? (
            <img
              src={lqipSrc}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover filter blur-lg scale-110 opacity-70"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-[#1a1426] dark:via-[#261f36] dark:to-[#1a1426]" />
          )}
        </div>
      )}

      {/* 2. High-Performance Optimized Main Image */}
      <img
        ref={imgRef}
        src={optimizedMainSrc}
        srcSet={responsiveSrcSet}
        sizes={sizes || (priority ? '100vw' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw')}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : undefined}
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full transition-opacity duration-500 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${objectFit === 'cover' ? 'object-cover' : objectFit === 'contain' ? 'object-contain' : ''} ${className}`}
        {...props}
      />
    </div>
  );
}

const OptimizedImage = memo(OptimizedImageComponent);
export default OptimizedImage;
