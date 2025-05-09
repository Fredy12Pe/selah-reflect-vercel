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

import { useState, useEffect, useRef, createRef, useCallback } from "react";
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
  ArrowLeftIcon,
  CalendarIcon,
  XMarkIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { getDevotionByDate } from "@/lib/services/devotionService";
import { Devotion } from "@/lib/types/devotion";
import { toast } from "react-hot-toast";
import { getDailyDevotionImage } from "@/lib/services/unsplashService";
import DynamicBackground from "@/app/components/DynamicBackground";
import ReliableBackground from "@/app/components/ReliableBackground";
import BackgroundCard from "@/app/components/BackgroundCard";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/firebase";
import dynamic from 'next/dynamic';
import { safeDoc, safeGetDocWithFallback } from "@/lib/utils/firebase-helpers";
import BackgroundImage from "@/app/components/BackgroundImage";

// CSS animations
const modalAnimations = `
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  
  @keyframes slideDown {
    from { transform: translateY(0); }
    to { transform: translateY(100%); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  .animate-slide-up {
    animation: slideUp 0.3s ease-out forwards;
  }
  
  .animate-slide-down {
    animation: slideDown 0.3s ease-out forwards;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  .animate-fade-out {
    animation: fadeOut 0.3s ease-out forwards;
  }
`;

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

// Function to convert hymn lyrics from Firebase format to verses format for display
const convertHymnLyricsToVerses = (hymnData: Hymn | null): Array<{verse: number, lines: string[]}> => {
  console.log('Converting hymn lyrics to verses format, hymn data:', hymnData);
  
  if (!hymnData || !hymnData.lyrics || hymnData.lyrics.length === 0) {
    console.log('No hymn data or lyrics to convert');
    return [];
  }

  // Group lyrics by verse (assuming 4 lines per verse)
  const linesPerVerse = 4;
  const verses = [];
  
  // Sort lyrics by lineNumber to ensure correct order
  const sortedLyrics = [...hymnData.lyrics].sort((a, b) => a.lineNumber - b.lineNumber);
  console.log('Sorted lyrics:', sortedLyrics);
  
  // Group into verses of 4 lines each
  for (let i = 0; i < sortedLyrics.length; i += linesPerVerse) {
    const verseLines = sortedLyrics.slice(i, i + linesPerVerse).map(line => line.text);
    verses.push({
      verse: Math.floor(i / linesPerVerse) + 1,
      lines: verseLines
    });
  }
  
  console.log('Converted verses:', verses);
  return verses;
};

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
  const { user, loading, isAnonymous, logout } = useAuth();
  console.log('ReflectionPage: Auth state:', { userExists: !!user, loading });
  
  const [devotionData, setDevotionData] = useState<Devotion | PartialDevotion | null>(null);
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hymnImage, setHymnImage] = useState<string>("/images/hymn-bg.jpg");
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Add a key based on the date to force re-mount on date change
  const componentKey = params.date;
  
  // Create calendar ref INSIDE the component
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Add reload protection
  const fetchAttemptCountRef = useRef(0);
  
  // Additional animation class for calendar
  const [isCalendarClosing, setIsCalendarClosing] = useState(false);
  
  // Updated function to close calendar with animation
  const closeCalendar = () => {
    setIsCalendarClosing(true);
    setTimeout(() => {
      setShowCalendar(false);
      setIsCalendarClosing(false);
    }, 300); // Match animation duration
  };

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
  const [resourcesImage, setResourcesImage] = useState("/images/resources-bg.jpg");

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
        const monthStr = format(currentDate, 'MMMM');
        console.log('Reflection page: Getting hymn for month:', monthStr);
        
        // Set default hymn first as a fallback
        setHymn(null);
        console.log('Reflection page: Initial hymn set to null');
        
        // Try to fetch hymn using the devotionService
        try {
          // Import the getHymnByMonth function
          const { getHymnByMonth } = await import('@/lib/services/devotionService');
          
          // Use the current month for hymn lookup
          // The old month offset code is removed since we now have correct hymn data for each month
          console.log('Reflection page: Fetching hymn for month:', monthStr);
          const hymnData = await getHymnByMonth(monthStr);
          
          if (hymnData) {
            console.log('Reflection page: Found hymn data for month:', monthStr, 'Hymn title:', hymnData.title);
            console.log('Reflection page: Hymn lyrics sample:', hymnData.lyrics.slice(0, 2));
            setHymn(hymnData);
            console.log('Reflection page: Hymn state set with new data');
          } else {
            console.log('Reflection page: No hymn found for month:', monthStr);
            // We've already set hymn to null above
          }
        } catch (hymnError) {
          console.error('Reflection page: Error fetching hymn:', hymnError);
          // Keep using null hymn set above
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
        // Default local fallback images
        const defaultHymnImage = "/images/hymn-bg.jpg"; 
        const defaultResourcesImage = "/images/resources-bg.jpg";

        // Initialize with default images to ensure we always have something
        setHymnImage(defaultHymnImage);
        setResourcesImage(defaultResourcesImage);

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

  // Disable next button if current date is too far in the future
  const oneWeekFromNow = addDays(new Date(), 7);
  const isNextDisabled = isFuture(currentDate) && currentDate > oneWeekFromNow;

  // Function to check if a date is a weekend
  const isWeekend = (date: Date): boolean => {
    return ['Saturday', 'Sunday'].includes(format(date, 'EEEE'));
  };

  // Function to check if a date is a weekday and within the preview window
  const isPreviewableWeekday = (date: Date): boolean => {
    const isWeekday = !isWeekend(date);
    return isFuture(date) && date <= oneWeekFromNow && isWeekday;
  };

  // Function to determine if we should show placeholder content for preview dates
  const showPlaceholderContent = isPreviewableWeekday(currentDate);

  // Adapt the showNoDevotionContent to handle preview dates
  // Weekend dates should always show "No devotion available" message
  const showNoDevotionContent = ((!devotionData || 
    (devotionData && 'notFound' in devotionData && devotionData.notFound)) && 
    !isPreviewableWeekday(currentDate)) || 
    isWeekend(currentDate);

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

  // Reflection questions for the current date
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

    // First check if we already have the verse in state
    if (bibleVerse && bibleVerse.reference === reference) {
      return bibleVerse;
    }

    setIsFetchingBibleVerse(true);
    try {
      let retryCount = 0;
      const maxRetries = 1; // Only retry once for Bible text

      while (retryCount <= maxRetries) {
        try {
          // Import utility for getting cached verses
          const { getVerse, getCachedVerse } = await import('@/lib/bibleApi');
          
          // Try to get from cache first
          try {
            // Check if we have this verse in localStorage
            const cachedESV = getCachedVerse(reference, 'esv');
            if (cachedESV) {
              console.log('Found Bible verse in cache:', reference);
              return cachedESV;
            }
            
            const cachedBibleApi = getCachedVerse(reference, 'bible-api');
            if (cachedBibleApi) {
              console.log('Found Bible verse in cache (bible-api):', reference);
              return cachedBibleApi;
            }
          } catch (cacheError) {
            console.warn('Cache retrieval error:', cacheError);
            // Continue to fetch from API
          }
          
          console.log('Fetching Bible verse from API:', reference);
          const verse = await getVerse(reference);
          return verse;
        } catch (error) {
          console.error(`Error fetching Bible verse (attempt ${retryCount + 1}):`, error);
          
          // Check if we have at least a simple reference to show
          if (retryCount === maxRetries) {
            console.log('Creating fallback Bible verse after failed attempts');
            // Create a simple verse object as fallback after retries are exhausted
            const fallbackVerse = {
              text: reference,
              reference: reference,
              verses: [{ verse: 1, text: "Could not load verse text. Please check your connection and try again." }]
            };
            
            // Try to save even this fallback to cache with a short expiration
            try {
              const { cacheVerse } = await import('@/lib/bibleApi');
              cacheVerse(reference, 'fallback', fallbackVerse);
            } catch (e) {}
            
            return fallbackVerse;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          retryCount++;
        }
      }
      
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
    console.log('Opening hymn modal with hymn data:', hymn);
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
    if (showCalendar) {
      closeCalendar();
    } else {
      setShowCalendar(true);
    }
  };

  // Add a function to check if user is admin
  const isAdmin = () => {
    return user?.email?.endsWith('@selahreflect.com') || 
           user?.email === 'fredy12pe@gmail.com';
  };

  // Add refs for the modal touch handling
  const hymnModalRef = useRef<HTMLDivElement>(null);
  const scriptureModalRef = useRef<HTMLDivElement>(null);
  const resourcesModalRef = useRef<HTMLDivElement>(null);
  
  // Add touch state tracking variables
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  
  // Pull-to-close handler for modals
  const handleTouchStart = (e: React.TouchEvent) => {
    // Store initial touch position
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent, closeModal: () => void) => {
    if (touchStartY === null) return;
    
    // Determine which modal ref to use based on which modal is currently shown
    let currentModalRef = null;
    if (showHymnModal) currentModalRef = hymnModalRef;
    else if (showScriptureModal) currentModalRef = scriptureModalRef;
    else if (showResourcesModal) currentModalRef = resourcesModalRef;
    
    // Get modal element
    const modalElement = currentModalRef?.current;
    if (!modalElement) return;
    
    // Prevent default to avoid scrolling when dragging from the top area (header)
    const headerHeight = 60; // Approximate header height
    const touchY = e.touches[0].clientY;
    const rect = modalElement.getBoundingClientRect();
    const touchWithinHeader = rect && (touchY - rect.top < headerHeight);
    
    if (touchWithinHeader) {
      e.preventDefault();
    }
    
    const deltaY = touchY - touchStartY;
    
    // Only consider downward movement (positive deltaY)
    if (deltaY > 0) {
      // Apply transform to give visual feedback while dragging
      modalElement.style.transform = `translateY(${deltaY * 0.5}px)`;
      modalElement.style.transition = 'none';
      
      // Close only when dragged more than 200px (much higher threshold)
      if (deltaY > 200) {
        setTouchStartY(null);
        closeModal();
      }
    }
  };
  
  const handleTouchEnd = () => {
    // Reset any applied transform with smooth animation
    const resetTransform = (ref: React.RefObject<HTMLDivElement>) => {
      if (ref.current) {
        ref.current.style.transform = 'translateY(0)';
        ref.current.style.transition = 'transform 0.3s ease-out';
      }
    };
    
    // Reset transform on all modal refs
    resetTransform(hymnModalRef);
    resetTransform(scriptureModalRef);
    resetTransform(resourcesModalRef);
    
    setTouchStartY(null);
  };

  // Define CalendarWrapper inside the component
  const CalendarWrapper = ({ children }: { children: React.ReactNode }) => (
    <div
      ref={calendarRef}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 
        ${isCalendarClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeCalendar();
        }
      }}
    >
      <div className={`w-full max-w-xs bg-zinc-900 p-4 rounded-xl shadow-xl border border-zinc-800 mx-4
        ${isCalendarClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white">Select Date</h2>
          <button 
            onClick={closeCalendar}
            className="p-1 rounded-full bg-black/30 hover:bg-black/50"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  // Add an authentication prompt component for anonymous users
  const AuthPrompt = ({ feature }: { feature: string }) => {
    const handleSignIn = () => {
      // Ensure anonymous users are logged out before redirecting to login
      if (isAnonymous && user) {
        logout().then(() => {
          // After logout, redirect to login page
          router.push(`/auth/login?from=${encodeURIComponent(`/devotion/${params.date}`)}`);
        }).catch(error => {
          console.error("Error signing out anonymous user:", error);
          // If logout fails, still try to redirect
          router.push(`/auth/login?from=${encodeURIComponent(`/devotion/${params.date}`)}`);
        });
      } else {
        // Regular redirect if not anonymous
        router.push(`/auth/login?from=${encodeURIComponent(`/devotion/${params.date}`)}`);
      }
    };
    
    return (
      <div className="bg-[#0F1211] p-6 rounded-2xl text-center">
        <p className="text-lg mb-4">Sign in to use {feature}</p>
        <button 
          onClick={handleSignIn}
          className="px-6 py-2 bg-white rounded-full hover:bg-white/90 inline-flex items-center text-black font-medium"
        >
          <span>Sign In</span>
          <ChevronRightIcon className="w-5 h-5 ml-2" />
        </button>
      </div>
    );
  };

  // Function to handle auth gating for features
  const isFeatureAccessible = useCallback((featureName: string) => {
    // If the user is fully authenticated, all features are accessible
    if (user && !isAnonymous) return true;
    
    // If anonymous, only basic features are accessible
    if (user && isAnonymous) {
      // Basic features that anonymous users can access
      const anonymousFeatures = ['hymn', 'scripture', 'questions'];
      return anonymousFeatures.includes(featureName.toLowerCase());
    }
    
    // No user at all
    return false;
  }, [user, isAnonymous]);

  // Update the handleLogout function to redirect to the main devotion page
  const handleLogout = async () => {
    try {
      // Get the current date from the URL before logging out
      const currentDateString = params.date;
      await logout();
      
      // Redirect to login page with the main devotion page in the "from" parameter
      router.push(`/auth/login?from=${encodeURIComponent(`/devotion/${currentDateString}`)}`);
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out');
    }
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
      <style dangerouslySetInnerHTML={{ __html: modalAnimations }} />
      <div key={`reflection-${params.date}`} className="min-h-screen bg-black text-white relative pb-8 font-outfit">
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
              <p className="mt-4">Loading devotion...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Admin Tools Link */}
            {isAdmin() && (
              <div className="absolute top-2 right-4 z-50 flex space-x-4">
                <Link 
                  href="/debug/cache-tools" 
                  className="text-xs text-white/30 hover:text-white/80"
                >
                  Cache Tools
                </Link>
                <Link 
                  href="/history" 
                  className="text-xs text-white/30 hover:text-white/80"
                >
                  History
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
            className={`p-3 rounded-full absolute right-0 top-1/2 -translate-y-1/2 group ${
              isNextDisabled
                ? "text-white/30 cursor-not-allowed"
                : "hover:bg-zinc-800"
            }`}
            aria-label="Next day"
          >
            <ChevronRightIcon className="w-6 h-6" />
            {!isNextDisabled && isFuture(addDays(currentDate, 1)) && (
              <span className="absolute hidden group-hover:block right-0 top-full mt-2 bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                Preview up to 7 days ahead
              </span>
            )}
          </button>
      </div>
          </div>

            {/* Main Content */}
            <div className="px-6 pb-6 space-y-4">
              {showCalendar && (
                <CalendarWrapper>
                  <DatePicker 
                    initialDate={currentDate} 
                    onDateSelect={handleDateChange}
                    className="text-white"
                    inline={true}
                  />
                </CalendarWrapper>
              )}
              
            {/* Hymn of the Month */}
              <div 
                className="rounded-xl overflow-hidden relative cursor-pointer"
                onClick={handleOpenHymnModal}
              >
                <div className="relative h-40">
                  <Image
                    src={hymnImage}
                    alt="Hymn background"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <p className="text-lg font-medium text-white/80 mb-1">Hymn of the Month:</p>
                    <h2 className="text-3xl font-medium">{hymn?.title || "Hymn of the Month"}</h2>
                    <p className="text-white/50 text-sm mt-1">Tap to view full hymn</p>
                  </div>
                </div>
              </div>

              {/* If we have future date, show it clearly */}
              {isFuture(currentDate) && (
                <div className="bg-zinc-900 rounded-xl p-6 text-center mb-6">
                  <div className="flex items-center justify-center mb-3">
                    <span className="text-2xl mr-2">📆</span>
                    <h2 className="text-xl font-semibold">Future Date</h2>
                  </div>
                  <p className="text-white/80">
                    {currentDate <= oneWeekFromNow ? 
                      "You're viewing content for a future date." :
                      `This devotion is not yet available. Content will be released on ${format(currentDate, "MMMM d, yyyy")}.`
                    }
                  </p>
                </div>
              )}
              
              {/* Display devotion content if we have it */}
              {devotionData && !('notFound' in devotionData) ? (
                <>
                  {/* Scripture Reference */}
                  <div>
                    <p className="text-white/70 text-lg mb-2">Today's Scripture</p>
                    <div
                      className="bg-[#0F1211] p-6 rounded-2xl cursor-pointer relative min-h-[100px] flex flex-col justify-center"
                      onClick={handleOpenScriptureModal}
                    >
                      <h2 className="text-2xl font-medium">{devotionData.bibleText}</h2>
                      <p className="text-white/50 text-sm mt-2">Tap to view full scripture</p>
                    </div>
                  </div>

                  {/* Reflection Questions */}
                  <div>
                    <p className="text-white/70 text-lg mb-2">Reflection Questions</p>
                    <div className="bg-[#0F1211] p-6 rounded-2xl">
                      <ol className="list-decimal ml-5 space-y-6">
                        {getAllQuestions().slice(0, 2).map((q: string, idx: number) => (
                          <li key={idx} className="text-lg pl-2">
                            {q}
                          </li>
                        ))}
                      </ol>
                      
                      {/* Only show Journal Entry button on weekdays */}
                      {!isWeekend(currentDate) && (
                        <div className="mt-10 flex justify-start">
                          <Link
                            href={`/devotion/${params.date}/journal`}
                            className="px-6 py-2 bg-white rounded-full hover:bg-white/90 flex items-center space-x-2 text-black"
                          >
                            <span className="font-medium">Journal Entry</span>
                            <ChevronRightIcon className="w-5 h-5 ml-2" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Reflection */}
                  <div className="mt-6 mb-2">
                    <p className="text-white/70 text-lg mb-2">Reflect with AI</p>
                    
                    {isFeatureAccessible('ai') ? (
                      <>
                        <div className="flex items-center gap-4">
                <input
                  type="text"
                            value={aiQuestion}
                            onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyPress={handleReflectionKeyPress}
                            placeholder="Ask questions about today's text..."
                            className="flex-1 bg-[#0F1211] border-none outline-none rounded-2xl px-6 py-5 text-white placeholder-white/50"
                />
                <button
                  onClick={handleReflectionGeneration}
                            disabled={isAiLoading || !aiQuestion.trim()}
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                              isAiLoading || !aiQuestion.trim()
                                ? "bg-[#0F1211] cursor-not-allowed"
                                : "bg-white hover:bg-white/90"
                            }`}
                          >
                            <ArrowRightIcon className={`w-7 h-7 ${isAiLoading || !aiQuestion.trim() ? "text-white" : "text-black"}`} />
                </button>
              </div>
                        
                        {aiResponse && (
                          <div className="mt-6 p-4 bg-[#0F1211] rounded-xl">
                            <p className="text-white/90 whitespace-pre-line">{aiResponse}</p>
                            <div className="mt-4 pt-3 border-t border-white/10 flex items-center">
                              <Link href="/history" className="text-white/60 text-sm hover:text-white/80 flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1.5" />
                                Your AI reflection has been saved to history
                                <ChevronRightIcon className="w-4 h-4 ml-1" />
                              </Link>
                            </div>
                          </div>
                        )}

              {aiError && (
                          <div className="mt-6 p-4 bg-red-900/20 rounded-xl">
                            <p className="text-red-400">{aiError}</p>
                </div>
              )}

                        {isAiLoading && (
                          <div className="mt-6 flex justify-center">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
                        )}
                      </>
                    ) : (
                      <AuthPrompt feature="AI Reflection" />
              )}
            </div>

            {/* Resources */}
                  <div className="mt-4">
                    <p className="text-white/70 text-lg mb-2">Resources</p>
                    
                    {isFeatureAccessible('resources') ? (
                      <div 
                        className="rounded-xl overflow-hidden relative cursor-pointer"
                        onClick={handleOpenResourcesModal}
                      >
                        <div className="relative h-40">
                          <Image
                            src={resourcesImage}
                            alt="Resources background"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
                          <div className="absolute inset-0 p-6 flex flex-col justify-end">
                            <h2 className="text-2xl font-medium mb-1">Resources for today's text</h2>
                            <p className="text-white/80">Bible Commentaries, Videos, and Podcasts</p>
                            <p className="text-white/50 text-sm mt-1">Tap to explore resources</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <AuthPrompt feature="Resources" />
                    )}
            </div>
          </>
              ) : showPlaceholderContent ? (
                <>
                  {/* Placeholder content for future preview dates */}
                  <div>
                    <p className="text-white/70 text-lg mb-2">Scripture</p>
                    <div className="bg-[#0F1211] p-6 rounded-2xl relative min-h-[100px] flex flex-col justify-center">
                      <div className="mb-4">
                        <div className="bg-zinc-800/50 animate-pulse h-8 rounded mb-3 w-3/4"></div>
                        <div className="bg-zinc-800/50 animate-pulse h-6 rounded w-1/2"></div>
                      </div>
                      <p className="text-white/50 text-sm mt-2">Content preview for {format(currentDate, "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  
                  {/* Questions Placeholder */}
                  <div className="mt-6">
                    <p className="text-white/70 text-lg mb-2">Reflection Questions</p>
                    <div className="bg-[#0F1211] p-6 rounded-2xl">
                      <div className="space-y-6">
                        <div className="bg-zinc-800/50 animate-pulse h-16 rounded"></div>
                        <div className="bg-zinc-800/50 animate-pulse h-16 rounded"></div>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <p className="text-white/50 mb-4">This preview shows what content will look like on {format(currentDate, "EEEE, MMMM d")}</p>
                        <div className="mt-3 px-6 py-2 bg-zinc-800/50 animate-pulse rounded-full w-32 h-10 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center pt-10">
                  <div className="inline-block bg-zinc-900 rounded-xl p-8 max-w-lg mx-auto">
                    <div className="text-5xl mb-6">📖</div>
                    <h2 className="text-2xl font-medium mb-4">No devotion is available for today</h2>
                    
                    <p className="text-lg text-white/80 mb-4">
                      New devotions are posted Monday through Friday
                    </p>
                    
                    <p className="text-lg text-white/80 mb-6">
                      Check back soon!
                    </p>
                    
                    {/* Only show Journal button on weekdays */}
                    {!isWeekend(currentDate) && (
                      <div className="mt-8">
                        <Link
                          href="/journal"
                          className="px-6 py-3 bg-white rounded-full hover:bg-white/90 inline-flex items-center text-black font-medium"
                        >
                          <span>Go to Journal</span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
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
            <div 
              ref={hymnModalRef}
              onTouchStart={handleTouchStart}
              onTouchMove={(e) => handleTouchMove(e, closeHymnModal)}
              onTouchEnd={handleTouchEnd}
              className={`relative w-full h-4/5 max-h-[85vh] bg-zinc-900 rounded-t-2xl shadow-xl overflow-hidden flex flex-col mt-auto
                ${isHymnModalClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
            >
              <div className="relative h-36 flex-shrink-0">
                <Image
                  src={hymnImage}
                  alt="Hymn background"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <p className="text-sm font-medium text-white/80 mb-1">Hymn of the Month</p>
                  <h2 className="text-xl font-medium">{hymn?.title || "Hymn of the Month"}</h2>
                  {hymn?.author && <p className="text-sm text-white/60 mt-1">by {hymn.author}</p>}
                </div>
              <button
                onClick={closeHymnModal}
                  className="absolute top-4 right-4 p-1 rounded-full bg-black/30 hover:bg-black/50"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>
              <div className="p-6 space-y-6 overflow-y-auto flex-grow">
                {hymn && hymn.lyrics && hymn.lyrics.length > 0 ? (
                  convertHymnLyricsToVerses(hymn).map((verse, index) => (
                    <div key={index} className="space-y-2">
                      <p className="text-sm font-medium text-white/60">Verse {verse.verse}</p>
                      {verse.lines.map((line, lineIndex) => (
                        <p key={lineIndex} className="text-lg">{line}</p>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="space-y-4">
                    <p className="text-white/80 text-center">The hymn for this month will appear here.</p>
                    <p className="text-white/60 text-center">Please check back later or view a different month.</p>
                  </div>
                )}
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
            <div 
              ref={scriptureModalRef}
              onTouchStart={handleTouchStart}
              onTouchMove={(e) => handleTouchMove(e, closeScriptureModal)}
              onTouchEnd={handleTouchEnd}
              className={`relative w-full h-4/5 max-h-[85vh] bg-zinc-900 rounded-t-2xl shadow-xl overflow-hidden flex flex-col mt-auto
                ${isScriptureModalClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
            >
              <div className="p-6 flex-shrink-0 border-b border-zinc-800 relative">
                <h2 className="text-sm font-medium text-white/80 mb-1">Today's Scripture</h2>
                <p className="text-xl font-semibold pr-6">{devotionData?.bibleText}</p>
              <button
                onClick={closeScriptureModal}
                  className="absolute top-4 right-4 p-1 rounded-full bg-black/30 hover:bg-black/50"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>

              <div className="overflow-y-auto flex-grow p-6">
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
            <div 
              ref={resourcesModalRef}
              onTouchStart={handleTouchStart}
              onTouchMove={(e) => handleTouchMove(e, closeResourcesModal)}
              onTouchEnd={handleTouchEnd}
              className={`relative w-full h-4/5 max-h-[85vh] bg-zinc-900 rounded-t-2xl shadow-xl overflow-hidden flex flex-col mt-auto
                ${isResourcesModalClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
            >
              <div className="relative h-36 flex-shrink-0">
                <Image
                  src={resourcesImage}
                  alt="Resources background"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <h2 className="text-xl font-medium mb-1">Resources</h2>
                  <p className="text-white/80">For {devotionData?.bibleText}</p>
                </div>
              <button
                onClick={closeResourcesModal}
                  className="absolute top-4 right-4 p-1 rounded-full bg-black/30 hover:bg-black/50"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>

              <div className="p-6 overflow-y-auto flex-grow">
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
      
      {/* Logout button - only show for fully authenticated users */}
      {user && !isAnonymous && (
        <div className="pb-8 pt-2 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white/80 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
            Log Out
          </button>
        </div>
      )}
    </ClientOnly>
  );
}
