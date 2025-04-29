"use client";

/**
 * Daily Reflection Page
 *
 * This page provides an interactive reflection experience:
 * - Recap of today's scripture
 * - Guided reflection questions
 * - Hymn of the month
 * - AI-powered reflection assistant
 *
 * Route: /devotion/[date]/reflection
 * Example: /devotion/2024-03-19/reflection
 */

import { useState, useEffect, useRef, createRef } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  addDays,
  subDays,
  isFuture,
  isToday,
  parseISO,
  isSameDay,
  parse,
} from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/context/AuthContext";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  CalendarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { getDevotionByDate } from "@/lib/services/devotionService";
import { Devotion } from "@/lib/types/devotion";
import { toast } from "react-hot-toast";
import { getDailyDevotionImage } from "@/lib/services/unsplashService";
import DynamicBackground from "@/app/components/DynamicBackground";
import BackgroundCard from "@/app/components/BackgroundCard";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/firebase";
import dynamic from 'next/dynamic';
import { safeDoc, safeGetDocWithFallback } from "@/lib/utils/firebase-helpers";

// Bible verse interface
interface BibleVerse {
  text: string;
  reference: string;
  verses: {
    verse: number;
    text: string;
  }[];
}

// Resource interface
interface ResourceItem {
  type: "commentary" | "video" | "podcast" | "book";
  title: string;
  description: string;
  url?: string;
  author?: string;
}

interface ResourcesResponse {
  resources: ResourceItem[];
  commentaries?: ResourceItem[];
  videos?: ResourceItem[];
  podcasts?: ResourceItem[];
  books?: ResourceItem[];
}

// New interface for previous reflections
interface StoredReflection {
  question: string;
  reflection: string;
  timestamp: string;
}

// Unsplash API access key
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

/**
 * Validate a URL to ensure it's safe to link to
 */
const isValidUrl = (url?: string): boolean => {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;

  // Check URL structure
  try {
    const urlObj = new URL(url);

    // Verify the domain is known and reliable
    const reliableDomains = [
      "biblehub.com",
      "blueletterbible.org",
      "bible.org",
      "biblegateway.com",
      "youtube.com",
      "youtu.be",
      "amazon.com",
      "christianbook.com",
      "goodreads.com",
      "bibleproject.com",
      "spotify.com",
      "apple.com",
      "podcasts.apple.com",
    ];

    const domain = urlObj.hostname;
    return reliableDomains.some((validDomain) => domain.includes(validDomain));
  } catch (e) {
    return false;
  }
};

/**
 * Generate a fallback URL for a resource type
 */
const getFallbackUrl = (type: string | undefined, title: string): string => {
  const searchQuery = encodeURIComponent(`${title} bible`);

  switch (type) {
    case "commentary":
      return `https://biblehub.com/commentaries/`;
    case "video":
      return `https://www.youtube.com/results?search_query=${searchQuery}`;
    case "podcast":
      return `https://podcasts.apple.com/us/genre/podcasts-religion-spirituality-christianity/id1439`;
    case "book":
      return `https://www.amazon.com/s?k=${searchQuery}`;
    default:
      return `https://www.google.com/search?q=${searchQuery}`;
  }
};

// Function to get the localStorage key for a date
const getReflectionStorageKey = (dateString: string) => {
  return `aiReflection_${dateString}`;
};

// Hymn interface
interface Hymn {
  title: string;
  lyrics: Array<{ lineNumber: number; text: string }>;
  author?: string;
}

// Define ReflectionSection interface to match the expected structure
interface ReflectionSection {
  questions: string[];
  title?: string;
  content?: string;
  passage?: string;
}

// Instead of extending Devotion, let's define our own interface
interface PartialDevotion {
  id?: string;
  date?: string;
  bibleText?: string;
  reflectionSections?: ReflectionSection[];
  title?: string;
  notFound?: boolean;
  error?: string;
}

// Add this ClientOnly component after your imports
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const [mountError, setMountError] = useState<Error | null>(null);
  
  useEffect(() => {
    try {
      setMounted(true);
    } catch (error) {
      console.error("Error mounting ClientOnly component:", error);
      setMountError(error instanceof Error ? error : new Error("Unknown error"));
    }
  }, []);
  
  if (mountError) {
    return (
      <div className="min-h-screen bg-black/90 flex items-center justify-center">
        <div className="bg-red-900/30 p-4 rounded-lg max-w-md text-center">
          <p className="text-red-400 mb-2">Error loading application:</p>
          <p className="text-white/80">{mountError.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black/90 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Loading Devotion...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

// Add dynamic import for DatePicker
const DatePicker = dynamic(() => import("@/app/components/DatePicker"), {
  ssr: false,
  loading: () => <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
});

export default function ReflectionPage({
  params,
}: {
  params: { date: string };
}) {
  console.log('ReflectionPage: Component starting render for date:', params.date);
  
  const router = useRouter();
  const { user, loading } = useAuth();
  console.log('ReflectionPage: Auth state:', { userExists: !!user, loading });
  
  const [devotionData, setDevotionData] = useState<Devotion | PartialDevotion | null>(null);
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hymnImage, setHymnImage] = useState<string>("/hymn-bg.jpg");
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Add a key based on the date to force re-mount on date change
  const componentKey = params.date;
  
  // Create calendar ref INSIDE the component
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Add reload protection
  const fetchAttemptCountRef = useRef(0);
  
  // Define CalendarWrapper inside the component
  const CalendarWrapper = ({ children }: { children: React.ReactNode }) => (
    <div
      ref={calendarRef}
      className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 p-4 rounded-2xl shadow-xl border border-zinc-800"
    >
      {children}
    </div>
  );
  
  // Parse date once and handle errors
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    try {
      const parsed = parseISO(params.date);
      if (isNaN(parsed.getTime())) {
        console.error('ReflectionPage: Invalid date in URL, using today instead');
        return new Date();
      }
      return parsed;
    } catch (error) {
      console.error('ReflectionPage: Error parsing date from URL, using today instead:', error);
      return new Date();
    }
  });
  
  // Important: Update the currentDate when params.date changes
  useEffect(() => {
    try {
      const parsed = parseISO(params.date);
      if (!isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
      }
    } catch (error) {
      console.error('Error updating currentDate from params:', error);
    }
  }, [params.date]);
  
  const today = new Date();
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  // Image states
  const [resourcesImage, setResourcesImage] = useState("/resources-bg.jpg");

  // AI reflection states
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Hymn modal state
  const [showHymnModal, setShowHymnModal] = useState(false);
  const [isHymnModalClosing, setIsHymnModalClosing] = useState(false);

  // Scripture modal state
  const [showScriptureModal, setShowScriptureModal] = useState(false);
  const [isScriptureModalClosing, setIsScriptureModalClosing] = useState(false);
  const [bibleVerse, setBibleVerse] = useState<BibleVerse | null>(null);
  const [isFetchingBibleVerse, setIsFetchingBibleVerse] = useState(false);

  // Resources modal state
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [isResourcesModalClosing, setIsResourcesModalClosing] = useState(false);
  const [resources, setResources] = useState<ResourcesResponse | null>(null);
  const [isFetchingResources, setIsFetchingResources] = useState(false);
  const [resourcesError, setResourcesError] = useState("");

  // Create a date-based parameter to change images daily
  const getDateBasedParam = (date: string, salt: string = "") => {
    const dateHash = date
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `${dateHash}${salt}`;
  };

  // Get unique parameters based on current date
  const hymnParam = getDateBasedParam(params.date, "hymn");
  const resourceParam = getDateBasedParam(params.date, "resource");

  // Lyrics for "When I Survey the Wondrous Cross"
  const hymnLyrics = [
    {
      verse: 1,
      lines: [
        "When I survey the wondrous cross",
        "On which the Prince of glory died,",
        "My richest gain I count but loss,",
        "And pour contempt on all my pride.",
      ],
    },
    {
      verse: 2,
      lines: [
        "Forbid it, Lord, that I should boast,",
        "Save in the death of Christ my God!",
        "All the vain things that charm me most,",
        "I sacrifice them to His blood.",
      ],
    },
    {
      verse: 3,
      lines: [
        "See from His head, His hands, His feet,",
        "Sorrow and love flow mingled down!",
        "Did e'er such love and sorrow meet,",
        "Or thorns compose so rich a crown?",
      ],
    },
    {
      verse: 4,
      lines: [
        "Were the whole realm of nature mine,",
        "That were a present far too small;",
        "Love so amazing, so divine,",
        "Demands my soul, my life, my all.",
      ],
    },
  ];

  // Update useEffect to better handle errors
  useEffect(() => {
    console.log('ReflectionPage: Data fetch effect running, user:', !!user, 'loading:', loading, 'isLoading:', isLoading);
    
    // Reset state when date changes
    setDevotionData(null);
    setBibleVerse(null);
    setResources(null);
    setIsLoading(true);
    fetchAttemptCountRef.current = 0;
    
    // Safety check to prevent infinite fetching
    fetchAttemptCountRef.current += 1;
    if (fetchAttemptCountRef.current > 3) {
      console.warn('ReflectionPage: Too many fetch attempts, forcing stop');
      setIsLoading(false);
      if (!devotionData) {
        setDevotionData({ notFound: true, error: "Too many fetch attempts" } as PartialDevotion);
      }
      return;
    }
    
    const fetchData = async () => {
    try {
      setIsLoading(true);
        
        // More detailed logging for debugging
        console.log('Reflection page: Starting fetch for date:', params.date);

        // Validate the date is in correct format
        let dateObj;
        try {
          dateObj = parseISO(params.date);
          console.log('Reflection page: Parsed date:', dateObj.toISOString());
        } catch (error) {
          console.error('Reflection page: Error parsing date:', error);
          dateObj = new Date(); // Fallback to today
        }
        
        if (isNaN(dateObj.getTime())) {
          console.error('Reflection page: Invalid date format:', params.date);
          const today = new Date();
          const formattedToday = format(today, 'yyyy-MM-dd');
          console.log('Reflection page: Redirecting to valid date:', formattedToday);
          router.replace(`/devotion/${formattedToday}/reflection`);
          return;
        }
        
        // Handle future dates - allow view but show appropriate message
        const isFutureDate = isFuture(dateObj);
        console.log('Reflection page: Date is future date?', isFutureDate);
        
        // For dates that are too far in the future (more than 3 months), redirect to today
        const threeMonthsLater = addDays(new Date(), 90);
        if (dateObj > threeMonthsLater) {
          console.log('Reflection page: Date is too far in the future, beyond:', threeMonthsLater.toISOString());
          const today = new Date();
          const formattedToday = format(today, 'yyyy-MM-dd');
          console.log('Reflection page: Redirecting to today:', formattedToday);
          router.replace(`/devotion/${formattedToday}/reflection`);
          return;
        }

        // Fetch hymn data - Use default hymn if there are issues
        const monthStr = format(currentDate, 'MMMM').toLowerCase();
        console.log('Reflection page: Getting hymn for month:', monthStr);
        
        // Set default hymn first as a fallback
        setHymn({
          title: "When I Survey the Wondrous Cross",
          author: "Isaac Watts",
          lyrics: hymnLyrics.flatMap((verse, verseIndex) => 
            verse.lines.map((line, lineIndex) => ({
              lineNumber: verseIndex * verse.lines.length + lineIndex + 1,
              text: line
            }))
          )
        });
        
        // Try to fetch hymn from Firestore
        try {
          const db = getFirebaseDb();
          
          if (db) {
            console.log('Reflection page: Got Firestore instance, fetching hymn');
            
            // Use a more resilient approach for getting document
            try {
              const hymnRef = doc(db, 'hymns', monthStr);
              const hymnSnap = await getDoc(hymnRef);
              
              // Check if document exists by directly checking data
              const data = hymnSnap.data();
              if (data) {
                console.log('Reflection page: Found hymn data for month:', monthStr);
                setHymn(data as Hymn);
              } else {
                console.log('Reflection page: No hymn found for month:', monthStr);
                // We've already set the default hymn above
              }
            } catch (docError) {
              console.error('Error fetching hymn doc:', docError);
              // We'll keep the default hymn set above
            }
          } else {
            console.warn('Reflection page: No Firestore instance available, using default hymn');
          }
        } catch (firestoreError) {
          console.error('Reflection page: Firestore error fetching hymn:', firestoreError);
          // Keep using the default hymn set above
        }

        // Fetch devotion data
        try {
          console.log('Reflection page: Fetching devotion for date:', params.date);
          let retryCount = 0;
          const MAX_RETRIES = 2;
          let lastError = null;
          
          // Retry loop for fetching devotion data
          while (retryCount <= MAX_RETRIES) {
            try {
              console.log(`Reflection page: Attempt ${retryCount + 1} to fetch devotion`);
              const devotion = await getDevotionByDate(params.date);
              console.log('Reflection page: Devotion fetch result:', 
                devotion ? (devotion.notFound ? 'Not found' : 'Found') : 'Null');
              
              // Set the devotion data
              if (devotion) {
                setDevotionData(devotion);
                
                // If there's an error message in the devotion, show it but don't stop execution
                if ('error' in devotion && devotion.error) {
                  console.warn('Devotion error:', devotion.error);
                  toast.error(devotion.error);
                } else if (!devotion.notFound) {
                  // Cache successful devotion data for offline use
                  try {
                    const cachedDataKey = `devotion_${params.date}`;
                    localStorage.setItem(cachedDataKey, JSON.stringify(devotion));
                    console.log('Reflection page: Cached devotion data for future use');
                  } catch (cacheError) {
                    console.warn('Reflection page: Failed to cache devotion data', cacheError);
                  }
                }
                
                // Success - break out of retry loop
                break;
              } else {
                // Empty response - try again
                throw new Error('Empty devotion response');
              }
            } catch (fetchError) {
              console.error(`Reflection page: Fetch error (attempt ${retryCount + 1})`, fetchError);
              lastError = fetchError;
              
              // Check if this is a network error that we should retry
              const isNetworkError = 
                fetchError instanceof Error && 
                (fetchError.message.includes('network') || 
                 fetchError.message.includes('fetch') || 
                 fetchError.message.includes('timeout'));
                 
              if (isNetworkError && retryCount < MAX_RETRIES) {
                // Wait longer between retries (exponential backoff)
                const delay = 1000 * Math.pow(2, retryCount);
                console.log(`Reflection page: Retrying after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
                retryCount++;
                continue; // Try again
              }
              
              // Either reached max retries or it's not a retryable error
              throw fetchError; // Re-throw to be caught by the outer try/catch
            }
          }
        } catch (error) {
          console.error('Reflection page: Error fetching devotion:', error);
          
          // Try to use cached data if available
          try {
            const cachedDataKey = `devotion_${params.date}`;
            const cachedData = localStorage.getItem(cachedDataKey);
            if (cachedData) {
              console.log('Reflection page: Using cached devotion data');
              const devotion = JSON.parse(cachedData);
              setDevotionData(devotion);
              toast.success('Using cached devotion data');
            } else {
              // No cached data, set a "not found" devotion to show appropriate UI
              setDevotionData({ 
                notFound: true, 
                error: 'Failed to load devotion', 
                bibleText: '',
                date: params.date,
                title: 'Could not load devotion'
              } as PartialDevotion);
              
              // Show toast only for auth errors, to avoid error spam
              if (error instanceof Error && error.message.includes('sign in')) {
                toast.error('Please sign in to view devotions');
                router.push('/auth/login?from=' + encodeURIComponent(`/devotion/${params.date}/reflection`));
              } else {
                toast.error('Failed to load devotion');
              }
            }
          } catch (cacheError) {
            console.error('Reflection page: Error using cached data:', cacheError);
            setDevotionData({ notFound: true } as PartialDevotion);
            toast.error('Failed to load devotion');
          }
        }
    } catch (error) {
        console.error('Error in fetchData:', error);
        // Ensure devotionData is set even on error to prevent infinite loading
        if (!devotionData) {
          setDevotionData({ notFound: true } as PartialDevotion);
        }
        toast.error('Failed to load data');
      } finally {
        console.log('ReflectionPage: Setting isLoading to false');
        setIsLoading(false);
    }
  };

    // Only fetch if we have a user or we're in a public path
    if (user !== null && !loading) {
      console.log('ReflectionPage: Calling fetchData()');
      fetchData();
    } else if (!loading && user === null) {
      console.log('ReflectionPage: No user and not loading, redirecting to login');
      setIsLoading(false); // Make sure to set loading to false
      router.push('/auth/login?from=' + encodeURIComponent(`/devotion/${params.date}/reflection`));
    }
  }, [params.date, user, router, loading]);

  // Load background images for modals from Unsplash with error handling
  useEffect(() => {
    const loadImages = async () => {
      try {
        // Create cache keys for the images
        const hymnCacheKey = `hymnImage_${params.date}`;
        const resourcesCacheKey = `resourcesImage_${params.date}`;

        // Try to get cached images first
        let cachedHymnImage = null;
        let cachedResourcesImage = null;

        try {
          cachedHymnImage = sessionStorage.getItem(hymnCacheKey);
          cachedResourcesImage = sessionStorage.getItem(resourcesCacheKey);
        } catch (error) {
          console.warn("Unable to access sessionStorage", error);
        }

        // Load hymn image
        if (cachedHymnImage) {
          setHymnImage(cachedHymnImage);
        } else {
          try {
          const hymn = await getDailyDevotionImage(
            params.date,
            "landscape,mountains,sunrise,peaceful"
          );
          if (hymn) {
              setHymnImage(hymn);
            try {
              sessionStorage.setItem(hymnCacheKey, hymn);
            } catch (error) {
                console.warn("Unable to store hymn image in sessionStorage", error);
            }
            }
          } catch (error) {
            console.error("Error loading hymn image:", error);
            // Keep default image on error
          }
        }

        // Load resources image
        if (cachedResourcesImage) {
          setResourcesImage(cachedResourcesImage);
        } else {
          try {
          const resources = await getDailyDevotionImage(
            params.date,
            "landscape,forest,lake,sunset"
          );
          if (resources) {
              setResourcesImage(resources);
            try {
              sessionStorage.setItem(resourcesCacheKey, resources);
            } catch (error) {
                console.warn("Unable to store resources image in sessionStorage", error);
            }
            }
          } catch (error) {
            console.error("Error loading resources image:", error);
            // Keep default image on error
          }
        }
      } catch (error) {
        console.error("Error in loadImages:", error);
        // Keep default images if there's an error
      }
    };

    loadImages();
  }, [params.date]);

  // Update handleDateChange to use client-side navigation first, fallback to hard reload
  const handleDateChange = async (newDate: Date) => {
    // Don't do anything if we're already loading
    if (isLoading) {
      return;
    }

    const formattedDate = format(newDate, "yyyy-MM-dd");

    // Don't reload if it's the same date
    if (formattedDate === params.date) {
      return;
    }

    try {
      console.log(`Navigating to date: ${formattedDate}`);
      // Update local state immediately for smoother UI
      setCurrentDate(newDate);
      setIsLoading(true); // Set loading immediately to prevent multiple clicks
      
      // Reset states for the new date to avoid showing stale data
      setDevotionData(null);
      setBibleVerse(null);
      setResources(null);
      setAiResponse("");
      
      // Clear error states
      setAiError("");
      setResourcesError("");
      
      // Close any open modals
      if (showHymnModal) closeHymnModal();
      if (showScriptureModal) closeScriptureModal();
      if (showResourcesModal) closeResourcesModal();
      if (showCalendar) setShowCalendar(false);
      
      // Try first to use cached data if it exists
      try {
        const cachedDataKey = `devotion_${formattedDate}`;
        const cachedData = localStorage.getItem(cachedDataKey);
        
        if (cachedData) {
          console.log(`Using cached data for date: ${formattedDate}`);
          // Use client-side navigation instead of hard reload
          router.push(`/devotion/${formattedDate}/reflection`);
          return;
        }
      } catch (cacheError) {
        console.warn("Error checking cache:", cacheError);
      }
      
      // No cached data, use a hard navigation instead of client-side to ensure a full remount
      window.location.href = `/devotion/${formattedDate}/reflection`;
    } catch (error) {
      console.error("Error changing date:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsLoading(false); // Ensure loading state is reset on error
    }
  };

  // Add new effect to reset Firestore if connection errors are detected
  useEffect(() => {
    // Check console errors for Firestore connection issues
    const originalConsoleError = console.error;
    
    console.error = function(...args) {
      // Call the original console.error first
      originalConsoleError.apply(console, args);
      
      // Check if the error is related to Firestore connection
      const errorMessage = args.join(' ');
      if (
        (typeof errorMessage === 'string' && 
        (errorMessage.includes('Firestore') || 
         errorMessage.includes('firebase') || 
         errorMessage.includes('SERVER_ERROR')))
      ) {
        console.log('Detected Firestore error, refreshing connection');
        // Attempt to refresh the page after a brief delay if still on the page
        if (document && window) {
          setTimeout(() => {
            if (document.visibilityState === 'visible') {
              window.location.reload();
            }
          }, 2000);
        }
      }
    };
    
    // Restore original console.error on cleanup
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Disable next button if current date is today
  const isNextDisabled = isToday(currentDate) || isFuture(currentDate);

  // Get all questions from all sections
  const getAllQuestions = () => {
    if (!devotionData?.reflectionSections?.length) {
      console.log("No reflection sections found");
      return [];
    }

    return devotionData.reflectionSections.reduce((acc: string[], section) => {
      return acc.concat(section.questions || []);
    }, []);
  };

  // Get the first two questions from all sections
  const getFirstTwoQuestions = () => {
    const allQuestions = getAllQuestions();
    console.log("All questions:", allQuestions);
    return allQuestions.slice(0, 2);
  };

  // Adapt the showNoDevotionContent to handle PartialDevotion
  const showNoDevotionContent = !devotionData || 
    (devotionData && 'notFound' in devotionData && devotionData.notFound);
  const reflectionQuestions = showNoDevotionContent ? [] : getFirstTwoQuestions();

  // Function to handle AI reflection generation
  const handleReflectionGeneration = async () => {
    if (!aiQuestion.trim() || !devotionData?.bibleText) return;

    setIsAiLoading(true);
    setAiError("");

    try {
      console.log(
        "[DEBUG] Generating reflection for question:",
        aiQuestion.trim(),
        "and verse:",
        devotionData.bibleText
      );

      const response = await fetch("/api/reflection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verse: devotionData.bibleText,
          question: aiQuestion.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Server error" }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("[DEBUG] Received reflection:", data.reflection);
      
      if (!data.reflection) {
        throw new Error("Received empty reflection from API");
      }
      
      setAiResponse(data.reflection);

      // Get existing reflections from localStorage
      const storageKey = getReflectionStorageKey(params.date);
      console.log("[DEBUG] Storage key for saving:", storageKey);
      let existingReflections = [];
      try {
        const existingData = localStorage.getItem(storageKey);
        console.log("[DEBUG] Existing data in localStorage:", existingData);

        if (existingData) {
          const parsed = JSON.parse(existingData);
          console.log("[DEBUG] Parsed existing data:", parsed);
          // Handle both array format and old single-item format
          existingReflections = Array.isArray(parsed) ? parsed : [parsed];
          console.log(
            "[DEBUG] Existing reflections after formatting:",
            existingReflections
          );
        }
      } catch (error) {
        console.error("[DEBUG] Error parsing stored reflections:", error);
      }

      // Create the new reflection
      const newReflection = {
        question: aiQuestion.trim(),
        reflection: data.reflection,
        timestamp: new Date().toISOString(),
      };

      console.log("[DEBUG] New reflection to add:", newReflection);

      // Add new reflection to the array, avoiding duplicates
      const isDuplicate = existingReflections.some(
        (item) => item.question === newReflection.question
      );

      console.log("[DEBUG] Is duplicate question:", isDuplicate);

      if (!isDuplicate) {
        existingReflections.push(newReflection);
        console.log("[DEBUG] Updated reflections array:", existingReflections);

        // Store updated array back to localStorage
        const jsonToStore = JSON.stringify(existingReflections);
        console.log("[DEBUG] Storing to localStorage:", jsonToStore);
        
        try {
        localStorage.setItem(storageKey, jsonToStore);
          console.log("[DEBUG] Successfully saved to localStorage");
        } catch (error) {
          console.error("[DEBUG] Error saving to localStorage:", error);
        }
      }
    } catch (error) {
      console.error("Error generating reflection:", error);
      setAiError(error instanceof Error ? error.message : "Failed to generate reflection");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle key press in reflection input
  const handleReflectionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleReflectionGeneration();
    }
  };

  // Function to handle modal closing with animation
  const closeHymnModal = () => {
    setIsHymnModalClosing(true);
    setTimeout(() => {
      setShowHymnModal(false);
      setIsHymnModalClosing(false);
    }, 300); // Match animation duration
  };

  // Function to handle scripture modal closing with animation
  const closeScriptureModal = () => {
    setIsScriptureModalClosing(true);
    setTimeout(() => {
      setShowScriptureModal(false);
      setIsScriptureModalClosing(false);
    }, 300); // Match animation duration
  };

  // Function to handle resources modal closing with animation
  const closeResourcesModal = () => {
    setIsResourcesModalClosing(true);
    setTimeout(() => {
      setShowResourcesModal(false);
      setIsResourcesModalClosing(false);
    }, 300); // Match animation duration
  };

  // Function to fetch Bible verse
  const fetchBibleVerse = async (reference: string) => {
    if (!reference) return null;

    setIsFetchingBibleVerse(true);
    try {
      // Try ESV API first
      const esvApiKey = process.env.NEXT_PUBLIC_ESV_BIBLE_API_KEY;
      
      if (esvApiKey) {
        try {
          const esvResponse = await fetch(
            `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(reference)}&include-passage-references=true&include-verse-numbers=true&include-footnotes=false`,
            {
              headers: {
                'Authorization': `Token ${esvApiKey}`
              }
            }
          );
          
          if (esvResponse.ok) {
            const esvData = await esvResponse.json();
            
            if (esvData.passages && esvData.passages.length > 0) {
              // Process ESV data into our standard format
              const text = esvData.passages[0];
              const verseRegex = /\[(\d+)\](.*?)(?=\[\d+\]|$)/g;
              const verses = [];
              let match;
              
              while ((match = verseRegex.exec(text)) !== null) {
                verses.push({
                  verse: parseInt(match[1]),
                  text: match[2].trim(),
                });
              }
              
              return {
                text: text,
                reference: esvData.passage_meta[0]?.canonical || reference,
                verses: verses.length > 0 ? verses : [{verse: 1, text}],
              };
            }
          }
        } catch (esvError) {
          console.error("Error with ESV API:", esvError);
          // Fall back to Bible API
        }
      }
      
      // Fallback to Bible API
      const response = await fetch(
        `https://bible-api.com/${encodeURIComponent(reference)}?verse_numbers=true`
      );

      if (!response.ok) {
        throw new Error(`Bible API error: ${response.statusText}`);
      }

      const data = await response.json();

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
      toast.error("Failed to load Bible verses");
      return null;
    } finally {
      setIsFetchingBibleVerse(false);
    }
  };

  // Function to fetch resources
  const fetchResources = async (
    reference: string
  ): Promise<ResourcesResponse | null> => {
    if (!reference) return null;

    setIsFetchingResources(true);
    setResourcesError("");

    try {
      console.log("Fetching resources for reference:", reference);
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passage: reference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch resources");
      }

      console.log("Resources data:", data);
      return data as ResourcesResponse;
    } catch (error) {
      console.error("Error fetching resources:", error);
      setResourcesError(
        error instanceof Error
          ? error.message
          : "Failed to load resources. Please try again."
      );
      return null;
    } finally {
      setIsFetchingResources(false);
    }
  };

  // Handle opening the scripture modal
  const handleOpenScriptureModal = async () => {
    if (devotionData?.bibleText && !bibleVerse) {
      const verse = await fetchBibleVerse(devotionData.bibleText);
      if (verse) {
        setBibleVerse(verse);
      }
    }
    setShowScriptureModal(true);
  };

  // Handle opening the resources modal
  const handleOpenResourcesModal = () => {
    // Show the modal immediately
    setShowResourcesModal(true);

    // Then fetch the resources if we don't have them already
    if (devotionData?.bibleText && !resources && !isFetchingResources) {
      fetchResources(devotionData.bibleText).then((resourcesData) => {
        if (resourcesData) {
          setResources(resourcesData);
        }
      });
    }
  };

  // Handle opening the hymn modal
  const handleOpenHymnModal = () => {
    setShowHymnModal(true);
  };

  // Handle clicks outside the calendar to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showCalendar &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        dateButtonRef.current &&
        !dateButtonRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  // Add a function to check if user is admin
  const isAdmin = () => {
    return user?.email?.endsWith('@selahreflect.com') || 
           user?.email === 'fredy12pe@gmail.com';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <p className="text-xl mb-4">Please sign in to view devotions</p>
          <Link href={`/auth/login?from=${encodeURIComponent(`/devotion/${params.date}/reflection`)}`} className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black/90 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Loading devotion...</p>
        </div>
      </div>
    );
  }

  // Check if we're viewing a future date - add a special message
  const isFutureDate = isFuture(currentDate);

  return (
    <ClientOnly>
      <div key={`reflection-${params.date}`} className="min-h-screen bg-black text-white relative pb-20 font-outfit">
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
              <p className="mt-4">Loading devotion...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Admin Tools Link */}
            {isAdmin() && (
              <div className="absolute top-2 right-4 z-50">
                <Link 
                  href="/debug/cache-tools" 
                  className="text-xs text-white/30 hover:text-white/80"
                >
                  Cache Tools
                </Link>
              </div>
            )}
            
            {/* Date Navigation */}
            <div className="pt-6 pb-4 px-6 flex items-center justify-center">
              <div className="relative w-full max-w-xs">
                <button
                  onClick={() => handleDateChange(subDays(currentDate, 1))}
                  className="p-3 rounded-full hover:bg-zinc-800 absolute left-0 top-1/2 -translate-y-1/2"
                  aria-label="Previous day"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>

                <button
                  ref={dateButtonRef}
                  onClick={toggleCalendar}
                  className="w-full text-center py-3 px-4 bg-zinc-800 rounded-full text-lg font-medium"
                >
                  {format(currentDate, "EEEE, MMMM d")}
                </button>

                <button
                  onClick={() => handleDateChange(addDays(currentDate, 1))}
                  disabled={isNextDisabled}
                  className={`p-3 rounded-full absolute right-0 top-1/2 -translate-y-1/2 ${
                    isNextDisabled
                      ? "text-white/30 cursor-not-allowed"
                      : "hover:bg-zinc-800"
                  }`}
                  aria-label="Next day"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="px-6 pb-16 space-y-6">
              {showCalendar && (
                <CalendarWrapper>
                  <DatePicker 
                    initialDate={currentDate} 
                    onDateSelect={handleDateChange} 
                  />
                </CalendarWrapper>
              )}
              
              {/* Hymn of the Month */}
              <div 
                className="rounded-xl overflow-hidden relative cursor-pointer"
                onClick={handleOpenHymnModal}
              >
                <div className="relative h-48">
                  <Image
                    src={hymnImage}
                    alt="Hymn background"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <p className="text-lg font-medium text-white/80 mb-1">Hymn of the Month:</p>
                    <h2 className="text-4xl font-bold">{hymn?.title}</h2>
                  </div>
                </div>
              </div>

              {/* If we have future date, show it clearly */}
              {isFuture(currentDate) && (
                <div className="bg-zinc-900 rounded-xl p-6 mt-4 text-center">
                  <h2 className="text-xl font-semibold mb-2">Future Date</h2>
                  <p className="text-white/80">
                    This devotion is not yet available. Content will be released on {format(currentDate, "MMMM d, yyyy")}.
                  </p>
                </div>
              )}
              
              {/* Display devotion content if we have it */}
              {!isFuture(currentDate) && devotionData && !('notFound' in devotionData) ? (
                <>
                  {/* Scripture Reference */}
                  <div>
                    <p className="text-white/70 text-lg mb-2">Today's Scripture</p>
                    <div className="bg-zinc-900 p-6 rounded-xl">
                      <h2 className="text-3xl font-semibold text-center">{devotionData.bibleText}</h2>
                      <div className="flex justify-center mt-3">
                        <button
                          onClick={handleOpenScriptureModal}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Read
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Reflection Questions */}
                  <div>
                    <p className="text-white/70 text-lg mb-2">Reflection Questions</p>
                    <div className="bg-zinc-900 p-6 rounded-xl">
                      {devotionData?.reflectionSections && devotionData.reflectionSections.length > 0 && devotionData.reflectionSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-6">
                          {section.passage && (
                            <div className="mb-4 p-4 bg-zinc-800 rounded-lg">
                              <h3 className="text-lg font-medium text-white/90 mb-1">Passage:</h3>
                              <p className="text-white/80">{section.passage}</p>
                            </div>
                          )}
                          
                          <ol className="list-decimal ml-5 space-y-4">
                            {section.questions?.map((q: string, idx: number) => (
                              <li key={idx} className="text-xl pl-2">
                                {q}
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                      
                      {/* Fallback for no sections or simple question list */}
                      {(!devotionData?.reflectionSections || devotionData.reflectionSections.length === 0) && reflectionQuestions.length > 0 && (
                        <ol className="list-decimal ml-5 space-y-6">
                          {reflectionQuestions.slice(0, 2).map((q: string, idx: number) => (
                            <li key={idx} className="text-xl pl-2">
                              {q}
                            </li>
                          ))}
                        </ol>
                      )}
                      
                      <div className="mt-8 flex justify-start">
                        <button
                          className="px-6 py-3 bg-white/10 rounded-full hover:bg-white/20 flex items-center space-x-2"
                        >
                          <span className="font-medium">Journal Entry</span>
                          <ChevronRightIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Reflection */}
                  <div>
                    <p className="text-white/70 text-lg mb-2">Reflect with AI</p>
                    <div className="bg-zinc-900 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={aiQuestion}
                          onChange={(e) => setAiQuestion(e.target.value)}
                          onKeyPress={handleReflectionKeyPress}
                          placeholder="Ask questions about today's text..."
                          className="flex-1 bg-black/30 border-none outline-none rounded-full px-4 py-3 text-white placeholder-white/50"
                        />
                        <button
                          onClick={handleReflectionGeneration}
                          disabled={isAiLoading || !aiQuestion.trim()}
                          className={`p-3 rounded-full ${
                            isAiLoading || !aiQuestion.trim()
                              ? "bg-white/10 cursor-not-allowed"
                              : "bg-white/20 hover:bg-white/30"
                          }`}
                        >
                          <ArrowRightIcon className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {aiResponse && (
                        <div className="mt-4 p-4 bg-white/5 rounded-xl">
                          <p className="text-white/90 whitespace-pre-line">{aiResponse}</p>
                        </div>
                      )}
                      
                      {aiError && (
                        <div className="mt-4 p-4 bg-red-900/20 rounded-xl">
                          <p className="text-red-400">{aiError}</p>
                        </div>
                      )}
                      
                      {isAiLoading && (
                        <div className="mt-4 flex justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Resources */}
                  <div 
                    className="rounded-xl overflow-hidden relative cursor-pointer"
                    onClick={handleOpenResourcesModal}
                  >
                    <div className="relative h-48">
                      <Image
                        src={resourcesImage}
                        alt="Resources background"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
                      <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <h2 className="text-2xl font-bold mb-1">Resources for today's text</h2>
                        <p className="text-white/80">Bible Commentaries, Videos, and Podcasts</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                !isFuture(currentDate) && showNoDevotionContent && (
                  <div className="text-center pt-10">
                    <h2 className="text-2xl font-medium mb-8">"No devotion is available for today.</h2>
                    
                    <p className="text-xl text-white/80 mb-6">
                      New devotions are posted Monday through Friday
                    </p>
                    
                    <p className="text-xl text-white/80 mb-6">
                      check back soon!"
                    </p>
                  </div>
                )
              )}
            </div>
          </>
        )}
        
        {/* Modals (outside of loading check) */}
        {/* Hymn Modal */}
        {showHymnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
              className={`fixed inset-0 bg-black/50 ${isHymnModalClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={closeHymnModal}
            />
            <div className={`relative w-full max-w-lg mx-4 bg-zinc-900 rounded-lg shadow-xl ${isHymnModalClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
              <div className="relative h-48">
                <Image
                  src={hymnImage}
                  alt="Hymn background"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <p className="text-sm font-medium text-white/80 mb-1">Hymn of the Month</p>
                  <h2 className="text-2xl font-semibold">{hymn?.title}</h2>
              </div>
              </div>
              <div className="p-6 space-y-6">
                {hymnLyrics.map((verse, index) => (
                  <div key={index} className="space-y-2">
                    <p className="text-sm font-medium text-white/60">Verse {verse.verse}</p>
                    {verse.lines.map((line, lineIndex) => (
                      <p key={lineIndex} className="text-lg">{line}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scripture Modal */}
        {showScriptureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
              className={`fixed inset-0 bg-black/50 ${isScriptureModalClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={closeScriptureModal}
            />
            <div className={`relative w-full max-w-lg mx-4 bg-zinc-900 rounded-lg shadow-xl ${isScriptureModalClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
              <div className="p-6">
                <h2 className="text-sm font-medium text-white/80 mb-1">Today's Scripture</h2>
                <p className="text-xl font-semibold mb-6">{devotionData?.bibleText}</p>
                
                {isFetchingBibleVerse ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : bibleVerse ? (
                  <div className="space-y-4">
                    {bibleVerse.verses.map((verse) => (
                      <div key={verse.verse} className="flex">
                        <span className="text-white/40 mr-4">{verse.verse}</span>
                        <p>{verse.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60">Failed to load Bible verses</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resources Modal */}
        {showResourcesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
              className={`fixed inset-0 bg-black/50 ${isResourcesModalClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={closeResourcesModal}
            />
            <div className={`relative w-full max-w-lg mx-4 bg-zinc-900 rounded-lg shadow-xl ${isResourcesModalClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
              <div className="relative h-48">
                <Image
                  src={resourcesImage}
                  alt="Resources background"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <h2 className="text-2xl font-semibold mb-1">Resources</h2>
                  <p className="text-white/80">For {devotionData?.bibleText}</p>
                </div>
              </div>

              <div className="p-6">
              {isFetchingResources ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : resourcesError ? (
                  <p className="text-red-400">{resourcesError}</p>
                ) : resources ? (
                <div className="space-y-8">
                    {/* Commentaries */}
                    {resources.commentaries && resources.commentaries.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Bible Commentaries</h3>
                        <div className="space-y-4">
                          {resources.commentaries.map((item, index) => (
                            <a
                              key={index}
                              href={isValidUrl(item.url) ? item.url : getFallbackUrl(item.type, item.title)}
                                target="_blank"
                                rel="noopener noreferrer"
                              className="block bg-black/30 rounded-xl p-4 hover:bg-black/50 transition-colors"
                            >
                              <h4 className="font-medium mb-1">{item.title}</h4>
                              {item.author && (
                                <p className="text-sm text-white/60 mb-2">by {item.author}</p>
                              )}
                              <p className="text-sm text-white/80">{item.description}</p>
                              </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos */}
                  {resources.videos && resources.videos.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Videos</h3>
                      <div className="space-y-4">
                        {resources.videos.map((item, index) => (
                            <a
                            key={index}
                              href={isValidUrl(item.url) ? item.url : getFallbackUrl(item.type, item.title)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block bg-black/30 rounded-xl p-4 hover:bg-black/50 transition-colors"
                            >
                              <h4 className="font-medium mb-2">{item.title}</h4>
                              <p className="text-sm text-white/80">{item.description}</p>
                            </a>
                        ))}
                      </div>
                    </div>
                  )}

                    {/* Podcasts */}
                  {resources.podcasts && resources.podcasts.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Podcasts</h3>
                      <div className="space-y-4">
                        {resources.podcasts.map((item, index) => (
                            <a
                            key={index}
                              href={isValidUrl(item.url) ? item.url : getFallbackUrl(item.type, item.title)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block bg-black/30 rounded-xl p-4 hover:bg-black/50 transition-colors"
                            >
                              <h4 className="font-medium mb-2">{item.title}</h4>
                              <p className="text-sm text-white/80">{item.description}</p>
                            </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                ) : (
                  <p className="text-white/60">No resources available</p>
              )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientOnly>
  );
}
