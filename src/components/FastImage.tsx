import React, { useState, useEffect } from 'react';
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
 * Optimized for ultra-fast media rendering and strict synchronization with Firebase,
 * eliminating stale browser history and disk/memory cache artifacts.
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

  // Fresh URL strictly matching Firebase, bypassing any stale browser cache
  const freshSrc = getFreshImageUrl(src, updatedAt);
  const finalSrc = hasError ? fallbackSrc : freshSrc;

  // Whenever source or updatedAt changes, reset loading/error state
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src, updatedAt]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton / Spinner placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-200/80 animate-pulse flex items-center justify-center z-10 rounded-inherit">
          <ImageIcon className="w-6 h-6 text-slate-400 animate-bounce" />
        </div>
      )}

      <img
        key={finalSrc}
        src={finalSrc}
        alt={alt}
        loading="eager"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
};
