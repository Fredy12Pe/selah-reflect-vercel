"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getFallbackImageUrl } from "@/lib/utils/imageUtils";

interface BackgroundCardProps {
  date: string;
  query: string;
  height?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  imageType?: "devotion" | "hymn" | "resources";
}

/**
 * BackgroundCard component
 *
 * A card with a dynamic landscape background, designed specifically for
 * sections like "Hymn of the Month" and "Resources" in the reflection page.
 */
export default function BackgroundCard({
  date,
  query,
  height = "200px",
  children,
  className = "",
  onClick,
  imageType = "devotion",
}: BackgroundCardProps) {
  // Use a direct image URL for reliability - these are known to work
  const getBackgroundImage = () => {
    switch (imageType) {
      case "hymn":
        return "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&h=900";
      case "resources":
        return "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1600&h=900";
      default:
        return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&h=900";
    }
  };

  const [backgroundImage, setBackgroundImage] = useState<string>(
    getBackgroundImage()
  );
  const [imageError, setImageError] = useState<boolean>(false);

  // Handle any image errors by falling back to local images
  const handleImageError = () => {
    console.log(
      `BackgroundCard: Image error for ${imageType}, using local fallback`
    );
    setImageError(true);
    setBackgroundImage(getFallbackImageUrl(imageType));
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ height }}
      onClick={onClick}
    >
      {/* Background Image */}
      <div className="absolute inset-0 bg-gray-900">
        <Image
          src={backgroundImage}
          alt="Background"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          onError={handleImageError}
        />
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
