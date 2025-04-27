"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/context/AuthContext";
import { safeDoc, safeGetDoc } from "@/lib/utils/firebase-helpers";
import { toast, Toaster } from "react-hot-toast";
import {
  getDailyDevotionImage,
  UnsplashImage,
} from "@/lib/services/unsplashService";
import DynamicBackground from "@/app/components/DynamicBackground";

interface DevotionData {
  date: string;
  title: string;
  scriptureReference: string;
  scriptureText: string;
  content: string;
  prayer: string;
  reflectionQuestions: string[];
  bibleText?: string; // For API compatibility with new format
}

interface BibleVerse {
  text: string;
  reference: string;
  verses: {
    verse: number;
    text: string;
  }[];
}

// Get the ESV API key from environment variables
const ESV_API_KEY = process.env.NEXT_PUBLIC_ESV_API_KEY;

export default function DevotionPage({ params }: { params: { date: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [devotion, setDevotion] = useState<DevotionData | null>(null);
  const [bibleVerse, setBibleVerse] = useState<BibleVerse | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    // If no date is provided or it's invalid, redirect to today's date
    const todayDate = getTodayDate();
    if (!params.date || isNaN(Date.parse(params.date))) {
      router.replace(`/devotion/${todayDate}`);
      return;
    }

    // Check if the date is today, if not redirect to today
    if (params.date !== todayDate) {
      router.replace(`/devotion/${todayDate}`);
      return;
    }

    if (!loading && !user) {
      const currentPath = window.location.pathname;
      router.push(`/auth/login?from=${encodeURIComponent(currentPath)}`);
      return;
    }

    const fetchBibleVerse = async (reference: string) => {
      try {
        console.log("Fetching Bible verse for reference:", reference);
        const response = await fetch(
          `https://bible-api.com/${encodeURIComponent(
            reference
          )}?verse_numbers=true`
        );

        if (!response.ok) {
          throw new Error(`Bible API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Bible API response:", data);

        if (!data.verses || data.verses.length === 0) {
          console.error("No verses found for reference:", reference);
          return null;
        }

        // Format the verses from the API response
        const verses = data.verses.map((v: any) => ({
          verse: v.verse,
          text: v.text.trim(),
        }));

        return {
          text: data.text,
          reference: data.reference,
          verses,
        };
      } catch (error) {
        console.error("Error fetching Bible verse:", error);
        return null;
      }
    };

    const fetchData = async () => {
      try {
        const devotionRef = safeDoc("devotions", params.date);
        const devotionSnap = await safeGetDoc(devotionRef);

        if (devotionSnap.exists()) {
          const devotionData = devotionSnap.data() as DevotionData;
          console.log("Devotion data from Firestore:", devotionData);
          setDevotion(devotionData);

          // Try fetching Bible verse using bibleText field first (new format)
          // Fall back to scriptureReference for backward compatibility
          const reference =
            devotionData.bibleText || devotionData.scriptureReference;
          if (reference) {
            console.log("Using reference for Bible API:", reference);
            const verse = await fetchBibleVerse(reference);
            if (verse) {
              setBibleVerse(verse);
              console.log("Successfully loaded Bible verse:", verse.reference);
            } else {
              console.error(
                "Failed to fetch Bible verse for reference:",
                reference
              );
            }
          } else {
            console.warn("No Bible reference found in devotion data");
          }
        } else {
          console.log("No devotion found for date:", params.date);
          toast.error("No devotion available for today");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load devotion");
      } finally {
        setPageLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [params.date, user, loading, router]);

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!devotion) {
    return null;
  }

  // Format the date properly using the current date
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(today);

  const firstName = user?.displayName?.split(" ")[0] || "";

  // For debugging
  console.log("Bible verse state:", bibleVerse);

  return (
    <DynamicBackground
      date={params.date}
      query="landscape mountains sunset forest"
      showAttribution={true}
      overlayOpacity={0.7}
      className="h-screen flex flex-col overflow-hidden"
    >
      <Toaster position="top-center" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header Section - Constrained Width */}
        <div className="flex-none p-6">
          <div className="max-w-lg mx-auto pt-12 space-y-1">
            <h1 className="text-5xl font-bold text-white">
              {formattedDate.split(",")[0]},
              <br />
              {formattedDate.split(",")[1].trim()}
            </h1>
            <p className="text-xl text-white/90">
              Have a blessed day, {firstName}!
            </p>
          </div>
        </div>

        {/* Scripture Box - Full Width Background */}
        <div className="flex-1 mt-12 bg-black/50 backdrop-blur-md rounded-t-3xl flex flex-col min-h-0">
          {/* Content Container - Constrained Width */}
          <div className="max-w-lg mx-auto w-full p-8 flex flex-col min-h-0">
            {/* Scripture Reference - Fixed */}
            <h2 className="text-2xl font-bold text-white flex-none mb-6">
              {bibleVerse?.reference ||
                devotion?.bibleText ||
                devotion?.scriptureReference}
            </h2>

            {/* Scripture Text - Scrollable */}
            <div
              className="flex-1 overflow-y-auto min-h-0 pr-4 mb-6 
              scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            >
              <div className="space-y-4">
                {bibleVerse?.verses ? (
                  bibleVerse.verses.map((verse) => (
                    <p
                      key={verse.verse}
                      className="text-lg leading-relaxed text-white/95"
                    >
                      <span className="text-white/60 text-sm align-super mr-2">
                        {verse.verse}
                      </span>
                      {verse.text}
                    </p>
                  ))
                ) : (
                  <p className="text-lg leading-relaxed text-white/95">
                    {devotion?.scriptureText || "Loading scripture text..."}
                  </p>
                )}
              </div>
            </div>

            {/* Reflection Button - Fixed */}
            <button
              onClick={() => router.push(`/devotion/${params.date}/reflection`)}
              className="w-full bg-white/10 hover:bg-white/20 text-white 
                rounded-full py-4 px-6 font-medium transition-all flex items-center 
                justify-between flex-none"
            >
              <span>See Today's Reflection</span>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </DynamicBackground>
  );
}
