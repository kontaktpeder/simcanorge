import imageCompression from 'browser-image-compression';

export interface CompressionProgress {
  stage: 'compressing' | 'uploading';
  current: number;
  total: number;
  percentage: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  reduction: number;
}

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.82,
};

/**
 * Compress a single image file to WebP format
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
    
    // Rename to .webp extension
    const newName = file.name.replace(/\.[^.]+$/, '.webp');
    const webpFile = new File([compressed], newName, { type: 'image/webp' });
    
    return {
      file: webpFile,
      originalSize,
      compressedSize: webpFile.size,
      reduction: Math.round((1 - webpFile.size / originalSize) * 100),
    };
  } catch (error) {
    console.error('Compression failed, using original:', error);
    // Fallback to original file
    return {
      file,
      originalSize,
      compressedSize: file.size,
      reduction: 0,
    };
  }
}

/**
 * Compress multiple images with progress callback
 */
export async function compressImages(
  files: File[],
  onProgress?: (progress: CompressionProgress) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    onProgress?.({
      stage: 'compressing',
      current: i + 1,
      total: files.length,
      percentage: Math.round(((i + 1) / files.length) * 100),
    });
    
    const result = await compressImage(files[i]);
    results.push(result);
  }
  
  return results;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Generate a unique image ID for storage path
 */
export function generateImageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate storage path for car images
 */
export function getCarImagePath(carId: string, imageId: string): string {
  return `cars/${carId}/images/${imageId}/original.webp`;
}

/**
 * Generate storage path for submission images
 */
export function getSubmissionImagePath(submissionId: string, imageId: string): string {
  return `submissions/${submissionId}/images/${imageId}/original.webp`;
}

/**
 * Generate storage path for part images
 */
export function getPartImagePath(partId: string, imageId: string): string {
  return `parts/${partId}/images/${imageId}/original.webp`;
}
