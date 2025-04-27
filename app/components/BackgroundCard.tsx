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

  // Fetch image from Unsplash when component mounts
  useEffect(() => {
    const fetchImage = async () => {
      try {
        const image = await getDailyDevotionImage(date, query);
        if (image && image !== backgroundImage) {
          setBackgroundImage(image);
        }
      } catch (error) {
        console.error("Error fetching background image:", error);
        // Keep using the local image if there's an error
      }
    };

    fetchImage();
  }, [date, query, backgroundImage]);

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
