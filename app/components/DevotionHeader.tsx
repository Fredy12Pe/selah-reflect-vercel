"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

interface DevotionHeaderProps {
  date?: Date;
  userName?: string;
  scripture: {
    reference: string;
    text: string;
  };
}

export default function DevotionHeader({
  date = new Date(),
  userName = "Friend",
  scripture,
}: DevotionHeaderProps) {
  return (
    <div className={`relative min-h-screen w-full ${inter.className}`}>
      {/* Background Image Layer */}
      <div className="fixed inset-0">
        <Image
          src="https://source.unsplash.com/featured/?mountains"
          alt="Mountain landscape"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={90}
          style={{ zIndex: -1 }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Section */}
        <div className="flex-1 px-6 pt-16">
          <h1 className="text-white text-6xl font-bold tracking-tight mb-3">
            {format(date, "EEEE,")}
            <br />
            {format(date, "MMMM d")}
          </h1>
          <p className="text-white/90 text-2xl font-medium">
            Have a blessed day, {userName}!
          </p>
        </div>

        {/* Scripture Section with Curved Overlay */}
        <div className="relative w-full mt-auto">
          {/* Dark Overlay with Curved Top */}
          <div className="absolute inset-0 bg-black/80 rounded-t-[40px]" />

          {/* Scripture Content */}
          <div className="relative px-6 pt-12 pb-24 space-y-8">
            <h2 className="text-white text-4xl font-bold">
              {scripture.reference}
            </h2>
            <p className="text-white/90 text-xl leading-relaxed">
              {scripture.text}
            </p>

            {/* CTA Button */}
            <Link
              href={`/devotion/${format(date, "yyyy-MM-dd")}/reflection`}
              className="inline-flex items-center justify-between w-full px-8 py-5
                text-white text-xl font-medium
                border border-white/30 rounded-full
                bg-white/10
                hover:bg-white/20 active:bg-white/30
                transition-all duration-300"
            >
              <span>See Today's Reflection</span>
              <svg
                className="w-7 h-7 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
