import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { getFreshImageUrl } from '../lib/firebase';

interface FastImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  updatedAt?: string | number;
}

/**
 * FastImage Component
 * Optimized for instant media rendering, handles cached images reliably,
 * and eliminates stale browser history without flickering or reload loops.
 */
export const FastImage: React.FC<FastImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
  updatedAt,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const freshSrc = getFreshImageUrl(src, updatedAt);
  const finalSrc = hasError ? fallbackSrc : (freshSrc || fallbackSrc);

  // When src changes, reset error state
  useEffect(() => {
    setHasError(false);
  }, [src, updatedAt]);

  // Synchronously check if the image has already completed (e.g. from browser cache)
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [finalSrc]);

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      {/* Background Skeleton placeholder - only shown when not yet loaded and never intercepts events */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-200/50 flex items-center justify-center pointer-events-none z-0">
          <ImageIcon className="w-6 h-6 text-slate-300 animate-pulse" />
        </div>
      )}

      <img
        ref={(el) => {
          imgRef.current = el;
          if (el && el.complete && el.naturalWidth > 0 && !isLoaded) {
            setIsLoaded(true);
          }
        }}
        src={finalSrc}
        alt={alt}
        loading="eager"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 relative z-[1] ${
          isLoaded ? 'opacity-100' : 'opacity-90'
        } ${className}`}
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
};

