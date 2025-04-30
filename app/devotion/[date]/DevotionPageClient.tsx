"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
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
  return devotion.bibleText || devotion.scriptureReference || "";
};

const getReflectionQuestions = (devotion: any): string[] => {
  if (devotion.reflectionSections && devotion.reflectionSections.length > 0) {
    return devotion.reflectionSections.reduce((acc: string[], section: any) => {
      return acc.concat(section.questions || []);
    }, []);
  }
  return devotion.reflectionQuestions || [];
};

const hasReflectionContent = (devotion: any): boolean => {
  if (devotion.reflectionSections) {
    return devotion.reflectionSections.some(
      (section: any) => section.questions && section.questions.length > 0
    );
  }
  return Array.isArray(devotion.reflectionQuestions) && devotion.reflectionQuestions.length > 0;
};

export default function DevotionPageClient({ date }: DevotionPageClientProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [bibleVerse, setBibleVerse] = useState<BibleVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  const fetchBibleVerse = useCallback(async (reference: string, signal?: AbortSignal) => {
      try {
        // Import utility for getting cached verses
        const { getVerse, getCachedVerse } = await import('@/lib/bibleApi');
        
        // Try to get from cache first (not affected by AbortController)
        try {
          // Check if we have this verse in localStorage
          const cachedESV = getCachedVerse(reference, 'esv');
          if (cachedESV) {
            console.log('DevotionPageClient: Found Bible verse in cache:', reference);
            return cachedESV;
          }
          
          const cachedBibleApi = getCachedVerse(reference, 'bible-api');
          if (cachedBibleApi) {
            console.log('DevotionPageClient: Found Bible verse in cache (bible-api):', reference);
            return cachedBibleApi;
          }
        } catch (cacheError) {
          console.warn('DevotionPageClient: Cache retrieval error:', cacheError);
          // Continue to fetch from API
        }
        
        // Check if request was aborted
        if (signal?.aborted) return null;
        
        console.log('DevotionPageClient: Fetching Bible verse from API:', reference);
        
        // Use our helper function which handles API calls and caching
        return await getVerse(reference);
      } catch (error: any) {
        if (error.name === 'AbortError') return null;
        console.error("DevotionPageClient: Error fetching Bible verse:", error);
        
        // Try to at least show a basic verse object
        return {
          text: reference,
          reference: reference,
          verses: [{ verse: 1, text: "Could not load verse text." }]
        };
      }
  }, []);

  const loadDevotion = useCallback(async (signal?: AbortSignal) => {
    if (!user) return;

      try {
        setLoading(true);
        setError(null);
      
      const token = await user.getIdToken(true);
      const response = await fetch(`/api/devotions/${date}`, {
        credentials: 'include',
        signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          const newToken = await user.getIdToken(true);
          const retryResponse = await fetch(`/api/devotions/${date}`, {
            credentials: 'include',
            signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Authorization': `Bearer ${newToken}`
            }
          });
          
          if (!retryResponse.ok) {
            throw new Error('Authentication failed');
          }
          
          const data = await retryResponse.json();
          if (data.notFound) {
            router.push(`/devotion/${date}/reflection`);
            return;
          }
          
          setDevotion(data);
          const reference = getBibleReference(data);
        if (reference) {
            const verse = await fetchBibleVerse(reference, signal);
            if (verse) setBibleVerse(verse);
          }
          return;
        }
        throw new Error(`Failed to fetch devotion: ${response.statusText}`);
          }

      const data = await response.json();
      if (data.notFound) {
        router.push(`/devotion/${date}/reflection`);
        return;
      }
      
      setDevotion(data);
      const reference = getBibleReference(data);
      if (reference) {
        const verse = await fetchBibleVerse(reference, signal);
        if (verse) setBibleVerse(verse);
        }
      } catch (err: any) {
      if (err.name === 'AbortError') return;
      
        console.error("Error loading devotion:", err);
      const errorMessage = err.message || "Failed to load devotion";
      
      if (errorMessage.includes("Authentication failed") || errorMessage.includes("sign in")) {
        if (!window.location.pathname.includes('/auth/login')) {
          router.push(`/auth/login?from=/devotion/${date}`);
        }
        } else {
        setError(errorMessage);
        }
      } finally {
        setLoading(false);
      setHasAttemptedLoad(true);
      }
  }, [user, date, router, fetchBibleVerse]);

  // Handle auth initialization and loading
  useEffect(() => {
    if (!authLoading) {
      if (!user && !window.location.pathname.includes('/auth/login')) {
        router.push(`/auth/login?from=/devotion/${date}`);
      }
    }
  }, [authLoading, user, router, date]);

  // Handle data loading
  useEffect(() => {
    if (authLoading || !user || hasAttemptedLoad) return;

    const controller = new AbortController();
    loadDevotion(controller.signal);

    return () => {
      controller.abort();
    };
  }, [authLoading, user, loadDevotion, hasAttemptedLoad]);

  if (authLoading || (loading && !hasAttemptedLoad)) {
    return (
      <div className="min-h-screen bg-black/90 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black/90 flex flex-col items-center justify-center text-white p-4">
          <p className="text-xl mb-4">{error}</p>
            <button
          onClick={() => {
            setHasAttemptedLoad(false);
            loadDevotion();
          }}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              Try Again
            </button>
      </div>
    );
  }

  if (!devotion) {
    return (
      <div className="min-h-screen bg-black/90 flex items-center justify-center text-white">
          <p className="text-xl">No devotion found for this date</p>
      </div>
    );
  }

  const displayReference = getBibleReference(devotion);
  const hasReflectionQuestions = hasReflectionContent(devotion);
  const reflectionQuestions = getReflectionQuestions(devotion);

  return (
    <div className="min-h-screen bg-black/90">
      <div className="container mx-auto px-4 py-12 text-white">
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
                  {(devotion as any).scriptureText || "Loading scripture text..."}
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
