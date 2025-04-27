"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  getDailyDevotionImage,
  getUnsplashAttribution,
} from "@/lib/services/unsplashService";

interface DynamicBackgroundProps {
  date: string;
  query?: string;
  overlayOpacity?: number;
  imageType?: "devotion" | "hymn" | "resources";
  children?: React.ReactNode;
  showAttribution?: boolean;
  priority?: boolean;
  className?: string;
}

/**
 * DynamicBackground component
 *
 * Displays a background image based on the image type
 * Fetches images from Unsplash with local fallbacks
 *
 * @param props Component props
 * @returns JSX Element
 */
export default function DynamicBackground({
  date,
  query = "landscape mountains forest nature",
  overlayOpacity = 0.6,
  imageType = "devotion",
  children,
  showAttribution = false,
  priority = true,
  className = "",
}: DynamicBackgroundProps) {
  // Use local images as fallback
  const getLocalImage = () => {
    switch (imageType) {
      case "hymn":
        return "/images/hymn-bg.jpg";
      case "resources":
        return "/images/resources-bg.jpg";
      default:
        return "/images/devotion-bg.jpg";
    }
  };

  const [backgroundImage, setBackgroundImage] = useState<string>(
    getLocalImage()
  );
  const [attribution, setAttribution] = useState<string>("");
  const [isUnsplashImage, setIsUnsplashImage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch image from Unsplash when component mounts
  useEffect(() => {
    // Create a cache key to prevent unnecessary fetches
    const cacheKey = `background_${date}_${query}_${imageType}`;
    let cachedImage = null;

    // Try to access sessionStorage (might fail in private browsing)
    try {
      cachedImage = sessionStorage.getItem(cacheKey);
    } catch (error) {
      console.warn("Unable to access sessionStorage", error);
    }

    // If we have a cached image, use it immediately
    if (cachedImage) {
      setBackgroundImage(cachedImage);
      setIsUnsplashImage(true);
      if (showAttribution) {
        setAttribution(getUnsplashAttribution(cachedImage));
      }
      return;
    }

    // Otherwise fetch a new image, but only if we're not already loading
    if (!isLoading) {
      const fetchImage = async () => {
        setIsLoading(true);
        try {
          const image = await getDailyDevotionImage(date, query);
          if (image && image !== backgroundImage) {
            // Cache the image for this session
            try {
              sessionStorage.setItem(cacheKey, image);
            } catch (error) {
              console.warn("Unable to store in sessionStorage", error);
            }

            setBackgroundImage(image);
            setIsUnsplashImage(true);

            // Set basic attribution for Unsplash
            if (showAttribution) {
              setAttribution(getUnsplashAttribution(image));
            }
          }
        } catch (error) {
          console.error("Error fetching background image:", error);
          // Keep using the local image if there's an error
        } finally {
          setIsLoading(false);
        }
      };

      fetchImage();
    }
  }, [date, query, showAttribution, imageType, isLoading]);

  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 -z-10 bg-gray-900">
        {/* Use a regular img tag for external URLs to avoid Next.js Image optimization issues */}
        {backgroundImage.startsWith("http") ? (
          <img
            src={backgroundImage}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Image
            src={backgroundImage}
            alt="Background"
            fill
            className="object-cover"
            priority={priority}
            sizes="100vw"
            quality={90}
          />
        )}
        <div className="absolute inset-0" style={overlayStyle} />
      </div>

      {/* Content */}
      {children}

      {/* Attribution */}
      {showAttribution && isUnsplashImage && attribution && (
        <div className="absolute bottom-2 right-2 text-xs text-white/70 bg-black/30 px-2 py-1 rounded">
          {attribution}
        </div>
      )}
    </div>
  );
}
