"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { getDevotionByDate } from "@/lib/services/devotionService";
import { Devotion } from "@/lib/types/devotion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

interface DevotionPageClientProps {
  date: string;
}

// Bible verse interface
interface BibleVerse {
  text: string;
  reference: string;
  verses: {
    verse: number;
    text: string;
  }[];
}

/**
 * Helper functions to handle both old and new data formats
 */
const getBibleReference = (devotion: any): string => {
  // Try new format first, then fall back to old format
  return devotion.bibleText || devotion.scriptureReference || "";
};

const getReflectionQuestions = (devotion: any): string[] => {
  // Try new format first
  if (devotion.reflectionSections && devotion.reflectionSections.length > 0) {
    // Flatten all questions from all sections
    return devotion.reflectionSections.reduce((acc: string[], section: any) => {
      return acc.concat(section.questions || []);
    }, []);
  }
  // Fall back to old format
  return devotion.reflectionQuestions || [];
};

const hasReflectionContent = (devotion: any): boolean => {
  // Check new format
  if (devotion.reflectionSections) {
    return devotion.reflectionSections.some(
      (section: any) => section.questions && section.questions.length > 0
    );
  }
  // Check old format
  return Array.isArray(devotion.reflectionQuestions) && devotion.reflectionQuestions.length > 0;
};

export default function DevotionPageClient({ date }: DevotionPageClientProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [bibleVerse, setBibleVerse] = useState<BibleVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't do anything while auth is loading
    if (authLoading) return;

    // If no user and auth is done loading, redirect to login
    if (!user) {
      router.push("/auth/login");
      return;
    }

    let mounted = true;

    async function fetchBibleVerse(reference: string) {
      if (!mounted) return null;
      try {
        console.log("Client: Fetching Bible verse for reference:", reference);
        const response = await fetch(
          `https://bible-api.com/${encodeURIComponent(
            reference
          )}?verse_numbers=true`
        );

        if (!response.ok) {
          throw new Error(`Bible API error: ${response.statusText}`);
        }

        const data = await response.json();
        if (!mounted) return null;
        console.log("Client: Bible API response:", data);

        if (!data.verses || data.verses.length === 0) {
          console.error("No verses found for reference:", reference);
          return null;
        }

        return {
          text: data.text,
          reference: data.reference,
          verses: data.verses.map((v: any) => ({
            verse: v.verse,
            text: v.text.trim(),
          })),
        };
      } catch (error) {
        console.error("Error fetching Bible verse:", error);
        return null;
      }
    }

    async function loadDevotion() {
      if (!mounted) return;
      try {
        setLoading(true);
        setError(null);
        console.log("Loading devotion for date:", date);
        const devotionData = await getDevotionByDate(date);
        if (!mounted) return;
        console.log("Devotion data:", devotionData);
        
        if (!devotionData) {
          router.replace(`/devotion/${date}/reflection`);
          return;
        }
        
        setDevotion(devotionData);

        const reference = getBibleReference(devotionData);
        if (reference) {
          console.log("Using reference for Bible API:", reference);
          const verse = await fetchBibleVerse(reference);
          if (mounted && verse) {
            console.log("Successfully fetched Bible verses:", verse);
            setBibleVerse(verse);
          }
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error("Error loading devotion:", err);
        const errorMessage = err.message || "Failed to load devotion";
        
        if (errorMessage.includes("permission") || errorMessage.includes("sign in")) {
          router.push("/auth/login");
        } else {
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDevotion();

    return () => {
      mounted = false;
    };
  }, [date, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center relative"
        style={{ backgroundImage: "url(/images/background.jpg)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-cover bg-center relative"
        style={{ backgroundImage: "url(/images/background.jpg)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white">
          <p className="text-xl mb-4">{error}</p>
          {error.includes("sign in") ? (
            <button
              onClick={() => router.push("/auth/login")}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!devotion) {
    return (
      <div
        className="min-h-screen bg-cover bg-center relative"
        style={{ backgroundImage: "url(/images/background.jpg)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white">
          <p className="text-xl">No devotion found for this date</p>
        </div>
      </div>
    );
  }

  // Get Bible reference for display - handle both data formats
  const displayReference = getBibleReference(devotion);

  // Handle reflection questions from both formats
  const hasReflectionQuestions = hasReflectionContent(devotion);

  // Get reflection questions - handle both data formats
  const reflectionQuestions = getReflectionQuestions(devotion);

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: "url(/images/background.jpg)" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
      <div className="relative z-10 container mx-auto px-4 py-12 text-white">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Scripture Section */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 space-y-4">
            <h2 className="text-2xl font-semibold">{displayReference}</h2>

            {/* Scripture Text */}
            <div className="space-y-4">
              {bibleVerse?.verses ? (
                bibleVerse.verses.map((verse) => (
                  <p
                    key={verse.verse}
                    className="text-lg leading-relaxed text-white/90"
                  >
                    <span className="text-white/50 text-sm align-super mr-2">
                      {verse.verse}
                    </span>
                    {verse.text}
                  </p>
                ))
              ) : (
                <p className="text-lg leading-relaxed text-white/90">
                  {(devotion as any).scriptureText
                    ? (devotion as any).scriptureText
                    : "Loading scripture text..."}
                </p>
              )}
            </div>
          </div>

          {/* Reflection Questions Section */}
          {hasReflectionQuestions && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Reflection Questions</h2>
              <ul className="space-y-4">
                {reflectionQuestions.map((question: string, index: number) => (
                  <li key={index} className="bg-black/20 p-6 rounded-lg">
                    <p className="text-lg">{question}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Link to Reflection Page */}
          <Link
            href={`/devotion/${date}/reflection`}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-black/40 rounded-lg hover:bg-black/60 transition-colors"
          >
            <span>See Today's Reflection</span>
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
