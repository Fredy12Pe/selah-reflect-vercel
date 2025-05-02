import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { ImageProps } from 'next/dist/client/image';

interface BackgroundImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src?: string;
  alt?: string;
  fallbackSrc: string;
  type?: 'hymn' | 'resources' | 'scripture' | 'devotion';
}

/**
 * A component that renders an image with a fallback
 * It first renders the fallback image, then tries to load the src image
 * If the src image fails to load, it keeps showing the fallback
 */
export default function BackgroundImage({
  src,
  alt = 'Background image',
  fallbackSrc,
  type = 'devotion',
  ...props
}: BackgroundImageProps) {
  // Default images based on type
  const defaultImages = {
    hymn: '/images/hymn-bg.jpg',
    resources: '/images/resources-bg.jpg',
    scripture: '/images/devotion-bg.jpg',
    devotion: '/images/devotion-bg.jpg',
  };

  // Use the fallback or default image
  const defaultSrc = fallbackSrc || defaultImages[type];
  
  // State to track which image to display
  const [imageSrc, setImageSrc] = useState<string>(defaultSrc);
  const [isLoading, setIsLoading] = useState(!!src); // Only show loading if we're trying to load a src

  // Try to load the src image after component mounts
  useEffect(() => {
    if (!src) return;

    const img = document.createElement('img');
    let mounted = true;

    img.onload = () => {
      // Only update state if component is still mounted
      if (mounted) {
        setImageSrc(src);
        setIsLoading(false);
      }
    };

    img.onerror = () => {
      if (mounted) {
        console.warn(`Failed to load image: ${src}, using fallback`);
        setImageSrc(defaultSrc);
        setIsLoading(false);
      }
    };

    img.src = src;

    // Cleanup function to prevent memory leaks and state updates on unmounted component
    return () => {
      mounted = false;
    };
  }, [src, defaultSrc]);

  return (
    <>
      <Image
        src={imageSrc}
        alt={alt}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </>
  );
} 