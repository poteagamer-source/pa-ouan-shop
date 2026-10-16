import type { ImgHTMLAttributes } from 'react';
import manifest from '../data/optimized-images.json';

const optimized: Record<string, string> = manifest;

/** Only bundled images use WebP; uploaded and remote URLs remain unchanged. */
export function OptimizedImage({ src, loading = 'lazy', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} src={src ? optimized[src] ?? src : src} loading={loading} decoding="async" />;
}
