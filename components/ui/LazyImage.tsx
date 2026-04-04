import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className = '', ...props }) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (src !== currentSrc) {
    setCurrentSrc(src);
    setIsLoaded(false);
    setError(false);
  }

  useEffect(() => {
    let mounted = true;
    const img = new Image();
    img.src = src;
    img.onload = () => {
        if (mounted) setIsLoaded(true);
    };
    img.onerror = () => {
        if (mounted) setError(true);
    };
    return () => { mounted = false; };
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder Background (No Skeleton) */}
      <div 
        className={`absolute inset-0 bg-stone-100 dark:bg-stone-900 flex items-center justify-center transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'} ${isLoaded ? 'pointer-events-none' : ''}`}
      >
         {error && (
             <span className="text-stone-400 text-xs flex flex-col items-center gap-1">
                 <ImageIcon size={20} />
                 Error
             </span>
         )}
      </div>

      {/* Actual Image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'} ${className}`}
        {...props}
      />
    </div>
  );
};
