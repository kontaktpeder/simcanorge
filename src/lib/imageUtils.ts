/**
 * Utility functions for responsive image handling
 * 
 * Supabase Storage supports image transformations on Pro plan via:
 * https://[project].supabase.co/storage/v1/render/image/public/[bucket]/[path]?width=X&height=Y&quality=Q
 * 
 * For projects without transform support, we fall back to original images.
 */

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const SUPABASE_STORAGE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1`;

// Standard responsive image widths
const RESPONSIVE_WIDTHS = [400, 800, 1200, 1600, 2048];

// Quality settings
const DEFAULT_QUALITY = 80;
const THUMBNAIL_QUALITY = 75;

/**
 * Check if a URL is from Supabase Storage
 */
function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage/v1/object/public/');
}

/**
 * Convert a Supabase Storage object URL to a render (transform) URL
 * 
 * From: https://xxx.supabase.co/storage/v1/object/public/bucket/path
 * To:   https://xxx.supabase.co/storage/v1/render/image/public/bucket/path?width=X
 */
function getTransformUrl(
  imageUrl: string, 
  width?: number, 
  height?: number, 
  quality: number = DEFAULT_QUALITY
): string {
  if (!isSupabaseStorageUrl(imageUrl)) {
    return imageUrl;
  }

  // Replace /object/public/ with /render/image/public/
  const renderUrl = imageUrl.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  const params = new URLSearchParams();
  if (width) params.set('width', String(Math.min(width, 2500)));
  if (height) params.set('height', String(Math.min(height, 2500)));
  params.set('quality', String(quality));
  params.set('resize', 'contain'); // Maintain aspect ratio

  return `${renderUrl}?${params.toString()}`;
}

/**
 * Get an optimized image URL for a specific size
 * Falls back to original if not a Supabase URL or transform fails
 */
export function getOptimizedImageUrl(
  imageUrl: string, 
  options?: { 
    width?: number; 
    height?: number; 
    quality?: number;
  }
): string {
  if (!imageUrl) return '';
  
  const { width, height, quality = DEFAULT_QUALITY } = options || {};
  
  // If no transforms needed, return original
  if (!width && !height) {
    return imageUrl;
  }

  return getTransformUrl(imageUrl, width, height, quality);
}

/**
 * Generate srcSet attribute for responsive images
 * Creates multiple size variants for browser to choose from
 */
export function getImageSrcSet(
  imageUrl: string,
  options?: {
    widths?: number[];
    quality?: number;
  }
): string {
  if (!imageUrl || !isSupabaseStorageUrl(imageUrl)) {
    return '';
  }

  const { widths = RESPONSIVE_WIDTHS, quality = DEFAULT_QUALITY } = options || {};

  return widths
    .map(w => `${getTransformUrl(imageUrl, w, undefined, quality)} ${w}w`)
    .join(', ');
}

/**
 * Get thumbnail URL (small, lower quality for quick loading)
 */
export function getThumbnailUrl(imageUrl: string, size: number = 400): string {
  return getOptimizedImageUrl(imageUrl, { 
    width: size, 
    quality: THUMBNAIL_QUALITY 
  });
}

/**
 * Common sizes configurations for different use cases
 */
export const IMAGE_SIZES = {
  // Hero images - full width on mobile, half on desktop
  hero: '(max-width: 768px) 100vw, 50vw',
  
  // Card thumbnails - smaller on all screens
  card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  
  // Gallery thumbnails - very small
  thumbnail: '(max-width: 640px) 25vw, 120px',
  
  // Full width content images
  fullWidth: '100vw',
  
  // Featured car on homepage
  featured: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px',
} as const;

/**
 * Preload critical images (like hero images)
 * Call this in useEffect to preload images that appear above the fold
 */
export function preloadImage(imageUrl: string, width?: number): void {
  const url = width 
    ? getOptimizedImageUrl(imageUrl, { width }) 
    : imageUrl;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * React component props helper for responsive images
 * Returns props to spread onto an img element
 */
export function getResponsiveImageProps(
  imageUrl: string,
  alt: string,
  options?: {
    sizes?: string;
    loading?: 'lazy' | 'eager';
    priority?: boolean; // If true, uses eager loading and higher quality
  }
) {
  const { 
    sizes = IMAGE_SIZES.card, 
    loading,
    priority = false 
  } = options || {};

  const effectiveLoading = loading ?? (priority ? 'eager' : 'lazy');

  const srcSet = getImageSrcSet(imageUrl, {
    quality: priority ? 85 : DEFAULT_QUALITY
  });

  return {
    src: priority 
      ? getOptimizedImageUrl(imageUrl, { width: 1200, quality: 85 })
      : getOptimizedImageUrl(imageUrl, { width: 800 }),
    srcSet: srcSet || undefined,
    sizes: srcSet ? sizes : undefined,
    alt,
    loading: effectiveLoading,
    decoding: priority ? 'sync' as const : 'async' as const,
    ...(priority ? { fetchPriority: 'high' as const } : {}),
  };
}
