"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getDailyDevotionImage } from "@/lib/services/unsplashService";

interface BackgroundCardProps {
  date: string;
  query: string;
  height?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  imageType?: "devotion" | "hymn" | "resources";
}

// Flag to determine if we should skip Unsplash API due to persistent failures
let SKIP_UNSPLASH = false;

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useLocalOnly, setUseLocalOnly] = useState<boolean>(SKIP_UNSPLASH);

  // Fetch image from Unsplash when component mounts
  useEffect(() => {
    // If we're skipping Unsplash, just use local images
    if (useLocalOnly) {
      return;
    }

    // Create a cache key to prevent unnecessary fetches
    const cacheKey = `bgcard_${date}_${query}_${imageType}`;
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
      return;
    }

    // Otherwise fetch a new image, but only if we're not already loading
    if (!isLoading) {
      const fetchImage = async () => {
        setIsLoading(true);
        try {
          const image = await getDailyDevotionImage(date, query);
          
          // If the image doesn't start with http, it's a local fallback
          if (!image.startsWith('http')) {
            // This indicates the API is failing, so set the flag to skip future requests
            SKIP_UNSPLASH = true;
            setUseLocalOnly(true);
          }
          
          if (image) {
            // Cache the image for this session
            try {
              sessionStorage.setItem(cacheKey, image);
            } catch (error) {
              console.warn("Unable to store in sessionStorage", error);
            }
            setBackgroundImage(image);
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
  }, [date, query, imageType, isLoading, useLocalOnly]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ height }}
      onClick={onClick}
    >
      {/* Background Image */}
      <div className="absolute inset-0 bg-gray-900">
        {backgroundImage.startsWith("http") ? (
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover"
            onError={() => {
              // If loading the remote image fails, fall back to local
              console.warn("Failed to load Unsplash image, using local fallback");
              setBackgroundImage(getLocalImage());
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
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
