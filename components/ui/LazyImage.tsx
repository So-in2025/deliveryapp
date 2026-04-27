import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className = '', ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoaded(false);
    setError(false);

    const img = new Image();
    img.src = src;
    // Note: img.referrerPolicy = 'no-referrer' is supported in modern browsers
    img.referrerPolicy = 'no-referrer'; 
    
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
      {/* Placeholder Background */}
      <div 
        className={`absolute inset-0 bg-stone-100 dark:bg-stone-900 flex items-center justify-center transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'} ${isLoaded ? 'pointer-events-none' : ''}`}
      >
         {error ? (
             <span className="text-stone-400 text-[10px] flex flex-col items-center gap-1 font-black uppercase tracking-widest">
                 <ImageIcon size={20} className="opacity-40" />
                 Error
             </span>
         ) : (
            <div className="w-10 h-10 border-4 border-stone-200 dark:border-white/5 border-t-brand-500 rounded-full animate-spin opacity-20"></div>
         )}
      </div>

      {/* Actual Image */}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
        {...props}
      />
    </div>
  );
};
