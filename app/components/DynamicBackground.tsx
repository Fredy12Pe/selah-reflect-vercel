"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getFallbackImageUrl } from "@/lib/utils/imageUtils";

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
 * Displays a background image from Unsplash based on the date and query
 * Falls back to a local image if the API fails
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
  const unsplashKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

  const getUnsplashUrl = () => {
    if (unsplashKey) {
      // Create a deterministic seed from the date
      const dateSeed = date.replace(/-/g, "");
      return `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&content_filter=high&client_id=${unsplashKey}&seed=${dateSeed}`;
    }
    return null;
  };

  // Fallback images if Unsplash API fails
  const getFallbackImage = () => {
    // Create a simple hash from the date to select different backgrounds
    const dateHash = date
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Pre-defined set of beautiful landscape images
    const landscapes = [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2000",
      "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=2000",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2000",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000",
    ];

    // Select an image based on date hash
    return landscapes[dateHash % landscapes.length];
  };

  const [backgroundImage, setBackgroundImage] = useState<string>(
    getFallbackImage()
  );
  const [attribution, setAttribution] = useState<string>("");
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    const fetchImage = async () => {
      const apiUrl = getUnsplashUrl();
      if (!apiUrl) return;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch from Unsplash");

        const data = await response.json();
        setBackgroundImage(data.urls.regular);

        if (showAttribution && data.user) {
          setAttribution(`Photo by ${data.user.name} on Unsplash`);
        }
      } catch (error) {
        console.error("Error fetching Unsplash image:", error);
        setBackgroundImage(getFallbackImage());
      }
    };

    fetchImage();
  }, [date, query, showAttribution]);

  const handleImageError = () => {
    // If image loading fails, use fallback
    console.log(
      `DynamicBackground: Image error, using local fallback:`,
      imageType
    );
    setImageError(true);
    setBackgroundImage(getFallbackImage());
  };

  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 -z-10 bg-gray-900">
        <Image
          src={backgroundImage}
          alt="Background"
          fill
          className="object-cover"
          priority={priority}
          sizes="100vw"
          quality={90}
          onError={handleImageError}
        />
        <div className="absolute inset-0" style={overlayStyle} />

        {/* Attribution */}
        {showAttribution && attribution && !imageError && (
          <div className="absolute bottom-1 right-2 text-white/50 text-xs">
            {attribution}
          </div>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
