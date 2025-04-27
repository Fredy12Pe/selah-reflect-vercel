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

  // Fetch image from Unsplash when component mounts
  useEffect(() => {
    // Create a cache key to prevent unnecessary fetches
    const cacheKey = `bgcard_${date}_${query}_${imageType}`;
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
      return;
    }

    // Otherwise fetch a new image, but only if we're not already loading
    if (!isLoading) {
      const fetchImage = async () => {
        setIsLoading(true);
        try {
          const image = await getDailyDevotionImage(date, query);
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
        } finally {
          setIsLoading(false);
        }
      };

      fetchImage();
    }
  }, [date, query, imageType, isLoading]);

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
