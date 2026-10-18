import React, { useState } from 'react';
import { Package } from 'lucide-react';

type ImageLoading = 'eager' | 'lazy';
type ImagePriority = 'high' | 'low' | 'auto';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  category?: string;
  loading?: ImageLoading;
  fetchPriority?: ImagePriority;
  sizes?: string;
}

const CLOUDINARY_TRANSFORMATION = /^([a-z]{1,3})_[^/]+$/;
const CLOUDINARY_TRANSFORM_KEYS = new Set([
  'a', 'ar', 'b', 'c', 'd', 'dn', 'e', 'f', 'fl', 'g', 'h', 'if', 'l', 'o', 'q',
  'r', 'so', 't', 'u', 'w', 'x', 'y', 'z'
]);

function isCloudinaryTransformation(segment: string): boolean {
  const tokens = segment.split(',');
  return tokens.length > 0 && tokens.every((token) => {
    const match = token.match(CLOUDINARY_TRANSFORMATION);
    return Boolean(match && CLOUDINARY_TRANSFORM_KEYS.has(match[1]));
  });
}

/** Create resized delivery URLs only for untransformed Cloudinary image URLs. */
function getCloudinaryVariants(source: string): Array<{ url: string; width: number }> | null {
  let url: URL;
  try {
    url = new URL(source);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return null;
  const uploadMarker = '/image/upload/';
  const markerAt = url.pathname.indexOf(uploadMarker);
  if (markerAt < 0) return null;

  const beforeUpload = url.pathname.slice(0, markerAt + uploadMarker.length);
  const afterUpload = url.pathname.slice(markerAt + uploadMarker.length);
  const segments = afterUpload.split('/');
  const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
  const prefix = versionIndex >= 0 ? segments.slice(0, versionIndex) : segments.slice(0, 1);

  // Keep existing Cloudinary transformations intact instead of stacking another set.
  if (prefix.some(isCloudinaryTransformation) || segments.some((segment) => /^s--[^/]+--$/.test(segment))) return null;

  const suffix = url.search + url.hash;
  return [160, 240, 320, 480, 640, 960].map((width) => ({
    width,
    url: `${url.origin}${beforeUpload}f_auto,q_auto,w_${width},c_limit/${afterUpload}${suffix}`
  }));
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackClassName,
  size = 'md',
  category,
  loading = 'lazy',
  fetchPriority = 'auto',
  sizes = '(max-width: 639px) 50vw, (max-width: 1023px) 33vw, min(25vw, 300px)'
}) => {
  const [originalFallbackSource, setOriginalFallbackSource] = useState<string | null>(null);
  const [failedSource, setFailedSource] = useState<string | null>(null);

  // Clean source check: must be a non-empty string
  const cleanSrc = src && typeof src === 'string' && src.trim() !== '' ? src.trim() : null;
  const isUsingOriginalFallback = Boolean(cleanSrc && originalFallbackSource === cleanSrc);
  const hasError = Boolean(cleanSrc && failedSource === cleanSrc);
  const imageVariants = cleanSrc ? getCloudinaryVariants(cleanSrc) : null;

  // If no source provided or failed to load, display polished fallback placeholder
  if (!cleanSrc || hasError) {
    const iconSize =
      size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-14 h-14';

    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#f5f5f3] text-stone-400 select-none transition-colors ${
          fallbackClassName || 'w-full h-full'
        }`}
        title={alt}
      >
        <div className="p-3 rounded-2xl bg-white/70 border border-stone-200/60 shadow-2xs flex items-center justify-center">
          <Package className={`${iconSize} stroke-[1.5] text-stone-400`} />
        </div>
        {size === 'lg' || size === 'xl' ? (
          <div className="mt-2 text-center px-2">
            <span className="text-[11px] font-semibold text-stone-500 block leading-tight">
              {category || 'Retail Product'}
            </span>
            <span className="text-[9px] text-stone-400 font-medium tracking-wide uppercase">
              No Image Stored
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      <img
        src={isUsingOriginalFallback ? cleanSrc : (imageVariants?.find((variant) => variant.width === 480)?.url || cleanSrc)}
        srcSet={imageVariants && !isUsingOriginalFallback ? imageVariants.map((variant) => `${variant.url} ${variant.width}w`).join(', ') : undefined}
        sizes={imageVariants && !isUsingOriginalFallback ? sizes : undefined}
        alt={alt}
        width={640}
        height={640}
        referrerPolicy="no-referrer"
        decoding="async"
        fetchPriority={fetchPriority}
        onError={() => {
          if (imageVariants && !isUsingOriginalFallback) setOriginalFallbackSource(cleanSrc);
          else setFailedSource(cleanSrc);
        }}
        className={className}
        loading={loading}
      />
    </div>
  );
};
