import React, { useState, useEffect } from 'react';
import { Package, ImageOff } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  category?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackClassName,
  size = 'md',
  category
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  // Clean source check: must be a non-empty string
  const cleanSrc = src && typeof src === 'string' && src.trim() !== '' ? src.trim() : null;

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
      {isLoading && (
        <div className="absolute inset-0 bg-stone-100 animate-pulse flex items-center justify-center">
          <Package className="w-6 h-6 text-stone-300 animate-pulse" />
        </div>
      )}
      <img
        src={cleanSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading="lazy"
      />
    </div>
  );
};
