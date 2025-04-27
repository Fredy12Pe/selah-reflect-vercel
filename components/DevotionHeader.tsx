"use client";

import * as React from "react";
import type { FC } from "react";
import Image from "next/image";
import { format } from "date-fns";

interface DevotionHeaderProps {
  date: Date;
  userName?: string;
  backgroundImage?: string;
}

const DevotionHeader: FC<DevotionHeaderProps> = ({
  date,
  userName,
  backgroundImage = "/default-mountain.jpg",
}) => {
  const formattedDate = format(date, "EEEE, MMMM d");
  const greeting = `Have a blessed day${userName ? ", " + userName : ""}!`;

  return (
    <div className="relative w-full h-screen">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        <Image
          src={backgroundImage}
          alt="Daily devotion background"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 pt-12 text-white">
        <h1 className="text-5xl font-bold mb-2">
          {formattedDate.split(",")[0]},
        </h1>
        <h2 className="text-4xl font-bold mb-6">
          {formattedDate.split(",")[1]}
        </h2>
        <p className="text-xl">{greeting}</p>
      </div>
    </div>
  );
};

export default DevotionHeader;
