import React, { useState } from 'react';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1606103920295-9a091573f160?auto=format&fit=crop&q=80&w=800'
];

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({ src, fallbackSrc, alt, className, ...props }) => {
  const [error, setError] = useState(false);
  const [currentFallback, setCurrentFallback] = useState<string | null>(null);
  
  const handleImageError = () => {
    if (!error) {
      const randomIndex = Math.floor(Math.random() * FALLBACK_IMAGES.length);
      setCurrentFallback(FALLBACK_IMAGES[randomIndex]);
      setError(true);
    }
  };

  // If no src is provided, use a fallback immediately
  const imageSrc = error ? (fallbackSrc || currentFallback || FALLBACK_IMAGES[0]) : (src || fallbackSrc || FALLBACK_IMAGES[0]);

  return (
    <img
      src={imageSrc}
      onError={handleImageError}
      className={className}
      alt={alt}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
};
