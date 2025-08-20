"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/context/AuthContext";
import { safeDoc, safeGetDoc, safeGetDocWithFallback } from "@/lib/utils/firebase-helpers";
import { toast, Toaster } from "react-hot-toast";
import {
  getDailyDevotionImage,
  UnsplashImage,
} from "@/lib/services/unsplashService";
import DynamicBackground from "@/app/components/DynamicBackground";
import BackgroundImage from "@/app/components/BackgroundImage";
import ReliableBackground from "@/app/components/ReliableBackground";
import { format, parseISO, isToday, addDays, isFuture } from "date-fns";
import { getVerse, createScriptureVerse } from "@/lib/bibleApi";
import Link from "next/link";

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

// Bible verse fetching function
const fetchBibleVerse = async (reference: string, scriptureText?: string) => {
  if (!reference) {
    console.log("No reference provided to fetchBibleVerse");
    return null;
  }
  
  try {
    console.log("Fetching Bible verse for reference:", reference);
    const verse = await getVerse(reference, scriptureText);
    return verse;
  } catch (error) {
    console.error("Error in fetchBibleVerse:", error);
    return null;
  }
};

export default function DevotionPage({ params }: { params: { date: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [devotion, setDevotion] = useState<DevotionData | null>(null);
  const [bibleVerse, setBibleVerse] = useState<BibleVerse | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [apiKeyStatus, setApiKeyStatus] = useState<'unknown' | 'valid' | 'invalid' | 'testing'>('unknown');

  const currentDate = parseISO(params.date);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Check ESV API key validity
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        // Check if the API key exists and is not the default
        const apiKey = process.env.NEXT_PUBLIC_ESV_BIBLE_API_KEY;
        if (!apiKey || apiKey === 'YOUR_ESV_API_KEY') {
          console.log('API key is invalid or missing');
          setApiKeyStatus('invalid');
          return;
        }

        // Test with a simple verse
        setApiKeyStatus('testing');
        console.log('Testing ESV API key...');
        const testReference = 'John 3:16';
        const verse = await fetchBibleVerse(testReference);
        
        if (verse && verse.text && !verse.text.includes('Could not load verse')) {
          console.log('ESV API key is valid');
          setApiKeyStatus('valid');
        } else {
          console.log('ESV API key test failed');
          setApiKeyStatus('invalid');
        }
      } catch (error) {
        console.error('Error testing API key:', error);
        setApiKeyStatus('invalid');
      }
    };

    if (!loading && user) {
      checkApiKey();
    }
  }, [loading, user]);

  useEffect(() => {
    // If no date is provided or it's invalid, redirect to today's date
    const todayDate = getTodayDate();
    if (!params.date || isNaN(Date.parse(params.date))) {
      router.replace(`/devotion/${todayDate}`);
      return;
    }

    // Check if the date is more than 7 days in the future, and redirect to today if it is
    const dateObj = parseISO(params.date);
    const oneWeekFromNow = addDays(new Date(), 7);
    if (isFuture(dateObj) && dateObj > oneWeekFromNow) {
      console.log('Date is more than a week in the future, redirecting to today');
      router.replace(`/devotion/${todayDate}`);
      return;
    }

    if (!loading && !user) {
      const currentPath = window.location.pathname;
      router.push(`/auth/login?from=${encodeURIComponent(currentPath)}`);
      return;
    }

    const fetchData = async () => {
      try {
        // Check for connectivity issues
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.warn("Device appears to be offline. Firestore operations may fail.");
          toast.error("You appear to be offline. Some features may not work properly.");
        }
        
        // Create a document reference using our safe helper
        const devotionRef = safeDoc("devotions", params.date);
        
        // If we couldn't get a document reference, show error
        if (!devotionRef) {
          console.error("Failed to create document reference for date:", params.date);
          setPageLoading(false);
          toast.error("Failed to load devotion");
          return;
        }
        
        // Use our fallback helper to avoid crashing on errors
        const devotionSnap = await safeGetDocWithFallback(devotionRef);
        
        // Check if we have a valid snapshot
        if (!devotionSnap) {
          console.error("Failed to fetch devotion data for date:", params.date);
          setPageLoading(false);
          toast.error("Failed to load devotion");
          return;
        }

        // We have data
        const devotionData = devotionSnap as DevotionData;
        console.log("Devotion data from Firestore:", devotionData);
        setDevotion(devotionData);

        // Try fetching Bible verse using bibleText field first (new format)
        // Fall back to scriptureReference for backward compatibility
        const reference =
          devotionData.bibleText || devotionData.scriptureReference;
        
        if (reference) {
          console.log("Using reference for Bible API:", reference);
            
          // Create a simple fallback in case Bible APIs fail
          const fallbackVerse = {
            text: devotionData.scriptureText || reference,
            reference: reference,
            verses: devotionData.scriptureText 
              ? [{ verse: 1, text: devotionData.scriptureText }]
              : [{ verse: 1, text: reference }]
          };
            
          // If we have scriptureText, set it as an immediate temporary value 
          // while API request is being made
          if (devotionData.scriptureText) {
            console.log("Setting temporary Bible verse from scriptureText");
            setBibleVerse(fallbackVerse);
          }
          
          // Function to fetch with retries
          const fetchWithRetry = async (maxRetries = 2) => {
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
              try {
                console.log(`Attempt ${attempt + 1} to fetch Bible verse`);
                
                // Add exponential backoff between retries
                if (attempt > 0) {
                  const delay = 1000 * Math.pow(2, attempt);
                  console.log(`Waiting ${delay}ms before retry...`);
                  await new Promise(r => setTimeout(r, delay));
                }
                
                const verse = await fetchBibleVerse(reference, devotionData.scriptureText);
                
                if (verse) {
                  console.log("Successfully loaded Bible verse:", verse.reference);
                  setBibleVerse(verse);
                  return true;
                }
              } catch (error) {
                console.error(`Error on attempt ${attempt + 1}:`, error);
                if (attempt === maxRetries) {
                  console.error("All retry attempts failed");
                  return false;
                }
              }
            }
            return false;
          };
          
          // Start the fetch attempt
          fetchWithRetry().then(success => {
            if (!success && devotionData.scriptureText) {
              console.log("All fetch attempts failed, using scriptureText as fallback");
              setBibleVerse(fallbackVerse);
            }
          });
        } else {
          console.warn("No Bible reference found in devotion data");
          // If we have scriptureText but no reference, we can still create a verse object
          if (devotionData.scriptureText) {
            console.log("Using scriptureText with no reference");
            setBibleVerse({
              text: devotionData.scriptureText,
              reference: "Scripture",
              verses: [{ verse: 1, text: devotionData.scriptureText }]
            });
          }
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

  // Add a second useEffect to retry Bible verse loading if it fails initially
  useEffect(() => {
    const retryBibleVerseFetch = async () => {
      // Only retry if we have devotion data but no Bible verse
      if (devotion && !bibleVerse) {
        console.log("Retrying Bible verse fetch...");
        const reference = devotion.bibleText || devotion.scriptureReference;
        
        if (reference) {
          try {
            const verse = await fetchBibleVerse(reference, devotion.scriptureText);
            if (verse) {
              console.log("Successfully loaded Bible verse on retry:", verse.reference);
              setBibleVerse(verse);
            } else if (devotion.scriptureText) {
              console.log("Using scriptureText as fallback after retry");
              setBibleVerse({
                text: devotion.scriptureText,
                reference: reference || "Scripture",
                verses: [{ verse: 1, text: devotion.scriptureText }]
              });
            }
          } catch (error) {
            console.error("Failed to fetch Bible verse on retry:", error);
            // On retry failure, use scriptureText as fallback if available
            if (devotion.scriptureText) {
              setBibleVerse({
                text: devotion.scriptureText,
                reference: reference || "Scripture",
                verses: [{ verse: 1, text: devotion.scriptureText }]
              });
            }
          }
        }
      }
    };
    
    if (!pageLoading && devotion && !bibleVerse) {
      retryBibleVerseFetch();
    }
  }, [devotion, bibleVerse, pageLoading]);

  // Function to check if a date is a weekday and within the preview window
  const isPreviewableWeekday = (date: Date): boolean => {
    const isWeekday = !['Saturday', 'Sunday'].includes(format(date, 'EEEE'));
    return isFuture(date) && date <= addDays(new Date(), 7) && isWeekday;
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!devotion && !isPreviewableWeekday(currentDate)) {
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
          {/* Header Section */}
          <div className="flex-none p-6">
            <div className="max-w-lg mx-auto pt-12 space-y-1">
              <h1 className="text-5xl font-bold text-white">
                {format(currentDate, "EEEE")},
                <br />
                {format(currentDate, "MMMM d")}
              </h1>
              <p className="text-xl text-white/90">
                Have a blessed day{user ? `, ${user.displayName?.split(" ")[0] || ""}` : ""}!
              </p>
            </div>
          </div>

          {/* No Devotion Message */}
          <div className="flex-1 mt-12 bg-black/50 backdrop-blur-md rounded-t-3xl flex flex-col items-center justify-center text-white text-center p-8">
            <div className="space-y-6">
              <p className="text-2xl">"No devotion is available for today.</p>
              <p className="text-xl">
                New devotions are posted Monday through Friday</p>
              <p className="text-xl">check back soon!"</p>
              
              <div className="mt-8">
                <Link
                  href={`/devotion/${params.date}/reflection`}
                  className="px-6 py-3 bg-white rounded-full hover:bg-white/90 inline-flex items-center text-black font-medium"
                >
                  <span>Go to Reflection</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DynamicBackground>
    );
  }

  // Handle previewable future weekday without devotion data
  if (!devotion && isPreviewableWeekday(currentDate)) {
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
          {/* Header Section */}
          <div className="flex-none p-6">
            <div className="max-w-lg mx-auto pt-12 space-y-1">
              <h1 className="text-5xl font-bold text-white">
                {format(currentDate, "EEEE")},
                <br />
                {format(currentDate, "MMMM d")}
              </h1>
              <p className="text-xl text-white/90">
                Have a blessed day{user ? `, ${user.displayName?.split(" ")[0] || ""}` : ""}!
              </p>
              
              {/* Future Date Preview Indicator */}
              <div className="mt-2 px-3 py-2 bg-blue-600/30 rounded-lg text-sm">
                <p>📆 You're viewing a future date</p>
                <p className="text-white/80 text-xs mt-1">Preview mode</p>
              </div>
            </div>
          </div>

          {/* Preview Mode Content */}
          <div className="flex-1 mt-12 bg-black/50 backdrop-blur-md rounded-t-3xl flex flex-col min-h-0">
            <div className="max-w-lg mx-auto w-full p-8 flex flex-col min-h-0">
              <h2 className="text-2xl font-bold text-white flex-none mb-6">
                Preview Content
              </h2>

              <div className="flex-1 overflow-y-auto min-h-0 pr-4 mb-6">
                <div className="space-y-8">
                  <div className="bg-zinc-800/50 animate-pulse h-8 rounded mb-4 w-3/4"></div>
                  <div className="bg-zinc-800/50 animate-pulse h-6 rounded w-1/2 mb-2"></div>
                  <div className="bg-zinc-800/50 animate-pulse h-6 rounded w-5/6"></div>
                  <div className="bg-zinc-800/50 animate-pulse h-6 rounded w-4/6"></div>
                </div>
              </div>

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
              
              {/* Future Date Indicator */}
              <div className="mt-4 px-4 py-3 bg-blue-600/30 rounded-lg text-sm text-center">
                <p className="font-medium">📆 You're viewing a future date</p>
                <p className="text-white/80 text-xs mt-1">Content will be available on {format(currentDate, "MMMM d")}.</p>
              </div>
            </div>
          </div>
        </div>
      </DynamicBackground>
    );
  }

  const firstName = user?.displayName?.split(" ")[0] || "";

  // For debugging
  console.log("Bible verse state:", bibleVerse);
  console.log("Devotion data:", devotion);
  
  // Log what text sources are available for debugging
  const availableTextSources = {
    hasBibleVerseText: !!bibleVerse?.text,
    hasBibleVerseVerses: !!bibleVerse?.verses?.length,
    hasScriptureText: !!devotion?.scriptureText,
    hasScriptureReference: !!devotion?.scriptureReference,
    hasBibleText: !!devotion?.bibleText,
  };
  console.log("Available text sources:", availableTextSources);
  
  // Check if current date is today
  const isTodaysDate = isToday(currentDate);

  return (
    <>
      {/* For today's date, use ReliableBackground */}
      {isTodaysDate ? (
        <ReliableBackground type="devotion" overlayOpacity={0.7}>
          <Toaster position="top-center" />
          {/* Content */}
          <div className="flex flex-col h-full">
            {/* Header Section - Constrained Width */}
            <div className="flex-none p-6">
              <div className="max-w-lg mx-auto pt-12 space-y-1">
                <h1 className="text-5xl font-bold text-white">
                  {format(currentDate, "EEEE")},
                  <br />
                  {format(currentDate, "MMMM d")}
                </h1>
                <p className="text-xl text-white/90">
                  Have a blessed day, {firstName}!
                </p>
                
                {/* API Key Status - Only shown when there's an issue */}
                {apiKeyStatus === 'invalid' && (
                  <div className="mt-2 px-3 py-2 bg-red-900/50 rounded-lg text-sm">
                    <p className="mb-1">⚠️ Bible API configuration issue detected</p>
                    <Link href="/debug/esv-api-setup" className="text-blue-300 underline text-xs">
                      Click here to fix
                    </Link>
                  </div>
                )}
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
                    devotion?.scriptureReference ||
                    "Today's Scripture"}
                </h2>

                {/* Scripture Text - Scrollable */}
                <div
                  className="flex-1 overflow-y-auto min-h-0 pr-4 mb-6 
                  scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                >
                  <div className="space-y-4">
                    {bibleVerse?.verses && bibleVerse.verses.length > 0 ? (
                      // Case 1: We have properly formatted Bible verses with verse numbers
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
                    ) : bibleVerse?.text ? (
                      // Case 2: We have Bible text but not formatted with verse numbers
                      <p className="text-lg leading-relaxed text-white/95">
                        {bibleVerse.text}
                      </p>
                    ) : devotion?.scriptureText ? (
                      // Case 3: Fallback to scriptureText field from devotion
                      <p className="text-lg leading-relaxed text-white/95">
                        {devotion.scriptureText}
                      </p>
                    ) : (
                      // Case 4: Last resort fallback - just show the reference with error
                      <div className="text-center py-4">
                        <p className="text-lg leading-relaxed text-white/70 italic mb-4">
                          {devotion?.bibleText || devotion?.scriptureReference || "Loading scripture..."}
                        </p>
                        {(devotion?.bibleText || devotion?.scriptureReference) && (
                          <div className="py-2">
                            <p className="text-red-400 mb-4">Could not load scripture text</p>
                            <div className="space-y-2">
                              <button 
                                onClick={() => {
                                  // Try fetching again
                                  if (devotion.bibleText || devotion.scriptureReference) {
                                    const reference = devotion.bibleText || devotion.scriptureReference;
                                    fetchBibleVerse(reference, devotion.scriptureText).then(verse => {
                                      if (verse) setBibleVerse(verse);
                                    });
                                  }
                                }}
                                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-white"
                              >
                                Retry
                              </button>
                              
                              {apiKeyStatus === 'invalid' && (
                                <div className="mt-2">
                                  <p className="text-sm text-white/70 mb-2">Bible API key issue detected</p>
                                  <Link href="/debug/esv-api-setup">
                                    <button className="px-4 py-2 bg-blue-600/60 rounded-lg hover:bg-blue-700/60 text-white text-sm">
                                      Configure API Key
                                    </button>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* API Configuration Note - Only shown when there's a loading issue */}
                {apiKeyStatus === 'invalid' && !bibleVerse?.verses && !bibleVerse?.text && (
                  <div className="mb-4 px-4 py-3 bg-blue-900/30 rounded-lg text-sm">
                    <p className="mb-1">💡 Bible verses require API configuration</p>
                    <p className="text-white/80 mb-2">Set up your ESV Bible API key to unlock all features</p>
                    <Link href="/debug/esv-api-setup">
                      <button className="px-3 py-1.5 bg-blue-600/60 rounded-lg hover:bg-blue-700/60 text-white text-sm">
                        Configure API Key
                      </button>
                    </Link>
                  </div>
                )}

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
                
                {/* Future Date Indicator */}
                {isFuture(currentDate) && (
                  <div className="mt-4 px-4 py-3 bg-blue-600/30 rounded-lg text-sm text-center">
                    <p className="font-medium">📆 You're viewing a future date</p>
                    <p className="text-white/80 text-xs mt-1">Some content may not be available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ReliableBackground>
      ) : (
        /* For past dates, use DynamicBackground with Unsplash */
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
                  {format(currentDate, "EEEE")},
                  <br />
                  {format(currentDate, "MMMM d")}
                </h1>
                <p className="text-xl text-white/90">
                  Have a blessed day, {firstName}!
                </p>
                
                {/* API Key Status - Only shown when there's an issue */}
                {apiKeyStatus === 'invalid' && (
                  <div className="mt-2 px-3 py-2 bg-red-900/50 rounded-lg text-sm">
                    <p className="mb-1">⚠️ Bible API configuration issue detected</p>
                    <Link href="/debug/esv-api-setup" className="text-blue-300 underline text-xs">
                      Click here to fix
                    </Link>
                  </div>
                )}
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
                    devotion?.scriptureReference ||
                    "Today's Scripture"}
                </h2>

                {/* Scripture Text - Scrollable */}
                <div
                  className="flex-1 overflow-y-auto min-h-0 pr-4 mb-6 
                  scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                >
                  <div className="space-y-4">
                    {bibleVerse?.verses && bibleVerse.verses.length > 0 ? (
                      // Case 1: We have properly formatted Bible verses with verse numbers
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
                    ) : bibleVerse?.text ? (
                      // Case 2: We have Bible text but not formatted with verse numbers
                      <p className="text-lg leading-relaxed text-white/95">
                        {bibleVerse.text}
                      </p>
                    ) : devotion?.scriptureText ? (
                      // Case 3: Fallback to scriptureText field from devotion
                      <p className="text-lg leading-relaxed text-white/95">
                        {devotion.scriptureText}
                      </p>
                    ) : (
                      // Case 4: Last resort fallback - just show the reference with error
                      <div className="text-center py-4">
                        <p className="text-lg leading-relaxed text-white/70 italic mb-4">
                          {devotion?.bibleText || devotion?.scriptureReference || "Loading scripture..."}
                        </p>
                        {(devotion?.bibleText || devotion?.scriptureReference) && (
                          <div className="py-2">
                            <p className="text-red-400 mb-4">Could not load scripture text</p>
                            <div className="space-y-2">
                              <button 
                                onClick={() => {
                                  // Try fetching again
                                  if (devotion.bibleText || devotion.scriptureReference) {
                                    const reference = devotion.bibleText || devotion.scriptureReference;
                                    fetchBibleVerse(reference, devotion.scriptureText).then(verse => {
                                      if (verse) setBibleVerse(verse);
                                    });
                                  }
                                }}
                                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-white"
                              >
                                Retry
                              </button>
                              
                              {apiKeyStatus === 'invalid' && (
                                <div className="mt-2">
                                  <p className="text-sm text-white/70 mb-2">Bible API key issue detected</p>
                                  <Link href="/debug/esv-api-setup">
                                    <button className="px-4 py-2 bg-blue-600/60 rounded-lg hover:bg-blue-700/60 text-white text-sm">
                                      Configure API Key
                                    </button>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* API Configuration Note - Only shown when there's a loading issue */}
                {apiKeyStatus === 'invalid' && !bibleVerse?.verses && !bibleVerse?.text && (
                  <div className="mb-4 px-4 py-3 bg-blue-900/30 rounded-lg text-sm">
                    <p className="mb-1">💡 Bible verses require API configuration</p>
                    <p className="text-white/80 mb-2">Set up your ESV Bible API key to unlock all features</p>
                    <Link href="/debug/esv-api-setup">
                      <button className="px-3 py-1.5 bg-blue-600/60 rounded-lg hover:bg-blue-700/60 text-white text-sm">
                        Configure API Key
                      </button>
                    </Link>
                  </div>
                )}

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
                
                {/* Future Date Indicator */}
                {isFuture(currentDate) && (
                  <div className="mt-4 px-4 py-3 bg-blue-600/30 rounded-lg text-sm text-center">
                    <p className="font-medium">📆 You're viewing a future date</p>
                    <p className="text-white/80 text-xs mt-1">Some content may not be available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DynamicBackground>
      )}
    </>
  );
}
