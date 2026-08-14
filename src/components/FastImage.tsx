import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface FastImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

/**
 * FastImage Component
 * Optimized for ultra-fast media rendering using async decoding, lazy loading,
 * progressive skeleton placeholder, and smooth fade-in transitions.
 */
export const FastImage: React.FC<FastImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const finalSrc = hasError ? fallbackSrc : src;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton / Spinner placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-200/80 animate-pulse flex items-center justify-center z-10 rounded-inherit">
          <ImageIcon className="w-6 h-6 text-slate-400 animate-bounce" />
        </div>
      )}

      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
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
