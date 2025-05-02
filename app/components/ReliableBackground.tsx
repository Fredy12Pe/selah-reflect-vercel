"use client";

import React from 'react';
import Image from 'next/image';

interface ReliableBackgroundProps {
  type?: 'devotion' | 'hymn' | 'resources' | 'scripture';
  overlayOpacity?: number;
  children: React.ReactNode;
}

/**
 * ReliableBackground component
 * 
 * A simple component to reliably show background images without
 * depending on external APIs. Used especially for current/today dates.
 */
export default function ReliableBackground({
  type = 'devotion',
  overlayOpacity = 0.7,
  children
}: ReliableBackgroundProps) {
  // Get image path
  const getImagePath = () => {
    switch (type) {
      case 'hymn':
        return '/images/hymn-bg.jpg';
      case 'resources':
        return '/images/resources-bg.jpg';
      case 'scripture':
        return '/images/scripture-bg.jpg';
      default:
        return '/images/devotion-bg.jpg';
    }
  };

  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-black">
        <Image
          src={getImagePath()}
          alt="Background"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          quality={90}
        />
        <div className="absolute inset-0" style={overlayStyle} />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
} 