"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BackgroundImageProps {
  type?: "devotion" | "hymn" | "resources" | "scripture";
  className?: string;
  priority?: boolean;
  fill?: boolean;
  height?: string;
  width?: string;
  alt?: string;
}

/**
 * BackgroundImage component
 * 
 * A reliable component for displaying background images
 * that always works even when Unsplash API fails
 */
export default function BackgroundImage({
  type = "devotion",
  className = "",
  priority = true,
  fill = true,
  height,
  width,
  alt = "Background",
}: BackgroundImageProps) {
  // Get image path based on type
  const getImagePath = () => {
    switch (type) {
      case "hymn":
        return "/images/hymn-bg.jpg";
      case "resources":
        return "/images/resources-bg.jpg";
      case "scripture":
        return "/images/scripture-bg.jpg";
      default:
        return "/images/devotion-bg.jpg";
    }
  };

  // Store the image path
  const [imagePath] = useState<string>(getImagePath());

  return (
    <div className={`relative ${fill ? "w-full h-full" : ""} ${className}`}>
      <Image
        src={imagePath}
        alt={alt}
        fill={fill}
        width={!fill ? width || 800 : undefined}
        height={!fill ? height || 500 : undefined}
        className={`object-cover ${className}`}
        priority={priority}
        sizes="100vw"
        quality={90}
      />
    </div>
  );
} 