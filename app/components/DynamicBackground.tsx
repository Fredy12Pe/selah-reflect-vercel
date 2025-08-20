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

// Flag to determine if we should skip Unsplash API due to persistent failures
let SKIP_UNSPLASH = false;

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
  const [useLocalOnly, setUseLocalOnly] = useState<boolean>(SKIP_UNSPLASH);

  // Fetch image from Unsplash when component mounts
  useEffect(() => {
    // If we're skipping Unsplash, just use local images
    if (useLocalOnly) {
      return;
    }
    
    // Create a cache key to prevent unnecessary fetches
    const cacheKey = `background_${date}_${query}_${imageType}`;
    let cachedImage = null;

    // Check if this is for today's date
    const isToday = new Date(date).toDateString() === new Date().toDateString();

    // Try to access sessionStorage (might fail in private browsing)
    try {
      // Only use cached image if it's not today's date
      if (!isToday) {
      cachedImage = sessionStorage.getItem(cacheKey);
      }
    } catch (error) {
      console.warn("Unable to access sessionStorage", error);
    }

    // If we have a cached image, use it immediately
    if (cachedImage) {
      setBackgroundImage(cachedImage);
      setIsUnsplashImage(cachedImage.startsWith('http'));
      if (showAttribution && cachedImage.startsWith('http')) {
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
          
          // If the image doesn't start with http, it's a local fallback
          const isRemoteImage = image.startsWith('http');
          if (!isRemoteImage) {
            // This indicates the API is failing, so set the flag to skip future requests
            SKIP_UNSPLASH = true;
            setUseLocalOnly(true);
          }
          
          if (image && image !== backgroundImage) {
            // Cache the image for this session
            try {
              sessionStorage.setItem(cacheKey, image);
            } catch (error) {
              console.warn("Unable to store in sessionStorage", error);
            }

            setBackgroundImage(image);
            setIsUnsplashImage(isRemoteImage);

            // Set basic attribution for Unsplash
            if (showAttribution && isRemoteImage) {
              setAttribution(getUnsplashAttribution(image));
            }
          }
        } catch (error) {
          console.error("Error fetching background image:", error);
          // Keep using the local image if there's an error
          SKIP_UNSPLASH = true;
          setUseLocalOnly(true);
        } finally {
          setIsLoading(false);
        }
      };

      fetchImage();
    }
  }, [date, query, showAttribution, imageType, isLoading, useLocalOnly]);

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
            onError={() => {
              // If loading the remote image fails, fall back to local
              console.warn("Failed to load Unsplash image, using local fallback");
              const localImage = getLocalImage();
              setBackgroundImage(localImage);
              setIsUnsplashImage(false);
              setAttribution("");
              // Mark to skip Unsplash for future components
              SKIP_UNSPLASH = true;
              setUseLocalOnly(true);
            }}
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
