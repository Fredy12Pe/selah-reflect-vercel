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

import { useState, useEffect, useRef } from "react";
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
import DatePicker from "@/app/components/DatePicker";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { getDevotionByDate } from "@/lib/services/devotionService";
import { Devotion } from "@/lib/types/devotion";
import { toast } from "react-hot-toast";
import { getDailyDevotionImage } from "@/lib/services/unsplashService";
import DynamicBackground from "@/app/components/DynamicBackground";
import BackgroundCard from "@/app/components/BackgroundCard";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/firebase";

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

interface Hymn {
  title: string;
  lyrics: Array<{ lineNumber: number; text: string }>;
  author?: string;
}

export default function ReflectionPage({
  params,
}: {
  params: { date: string };
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [devotionData, setDevotionData] = useState<Devotion | null>(null);
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hymnImage, setHymnImage] = useState<string>("/hymn-bg.jpg");
  const [showCalendar, setShowCalendar] = useState(false);
  const currentDate = parseISO(params.date);
  const today = new Date();
  const calendarRef = useRef<HTMLDivElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  // Image states
  const [resourcesImage, setResourcesImage] = useState("/resources-bg.jpg");

  // AI reflection states
  const [question, setQuestion] = useState("");
  const [aiReflection, setAiReflection] = useState("");
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Validate the date is in correct format
        const dateObj = parseISO(params.date);
        if (isNaN(dateObj.getTime())) {
          const today = new Date();
          const formattedToday = format(today, 'yyyy-MM-dd');
          console.log('Invalid date format, redirecting to:', formattedToday);
          router.replace(`/devotion/${formattedToday}/reflection`);
          return;
        }

        // Fetch hymn data
        const monthStr = format(currentDate, 'MMMM').toLowerCase();
        const db = getFirebaseDb();
        if (db) {
          const hymnRef = doc(db, 'hymns', monthStr);
          const hymnSnap = await getDoc(hymnRef);
          if (hymnSnap.exists()) {
            setHymn(hymnSnap.data() as Hymn);
          }
        }

        // Fetch devotion data
        const devotion = await getDevotionByDate(params.date);
        // Even if devotion is null or has notFound flag, we still set it
        // This allows us to show appropriate UI for missing devotions
        setDevotionData(devotion);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [params.date, user, currentDate, router]);

  // Load background images for modals from Unsplash
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

        // If we have cached images, use them
        if (cachedHymnImage) {
          setHymnImage(cachedHymnImage);
        } else {
          // Get image for hymn modal
          const hymn = await getDailyDevotionImage(
            params.date,
            "landscape,mountains,sunrise,peaceful"
          );
          if (hymn) {
            try {
              sessionStorage.setItem(hymnCacheKey, hymn);
            } catch (error) {
              console.warn("Unable to store in sessionStorage", error);
            }
            setHymnImage(hymn);
          }
        }

        if (cachedResourcesImage) {
          setResourcesImage(cachedResourcesImage);
        } else {
          // Get image for resources modal
          const resources = await getDailyDevotionImage(
            params.date,
            "landscape,forest,lake,sunset"
          );
          if (resources) {
            try {
              sessionStorage.setItem(resourcesCacheKey, resources);
            } catch (error) {
              console.warn("Unable to store in sessionStorage", error);
            }
            setResourcesImage(resources);
          }
        }
      } catch (error) {
        console.error("Error loading background images:", error);
        // Keep default images if there's an error
      }
    };

    loadImages();
  }, [params.date]);

  // Update handleDateChange to allow future dates
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
      router.push(`/devotion/${formattedDate}/reflection`);
    } catch (error) {
      console.error("Error changing date:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

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

  // Show appropriate content even when no devotion is found
  const showNoDevotionContent = !devotionData || devotionData.notFound;
  const reflectionQuestions = showNoDevotionContent ? [] : getFirstTwoQuestions();

  // Function to handle AI reflection generation
  const handleReflectionGeneration = async () => {
    if (!question.trim() || !devotionData?.bibleText) return;

    setIsAiLoading(true);
    setAiError("");

    try {
      console.log(
        "[DEBUG] Generating reflection for question:",
        question.trim()
      );

      const response = await fetch("/api/reflection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verse: devotionData.bibleText,
          question: question.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate reflection");
      }

      console.log("[DEBUG] Received reflection:", data.reflection);
      setAiReflection(data.reflection);

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
        question: question.trim(),
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
        localStorage.setItem(storageKey, jsonToStore);

        // Verify the storage worked
        const verifyStored = localStorage.getItem(storageKey);
        console.log(
          "[DEBUG] Verification - data in localStorage after save:",
          verifyStored
        );

        // Update the state with all reflections (for internal tracking only)
        console.log("[DEBUG] Updating state with all reflections");
      }
    } catch (error) {
      console.error("[DEBUG] Error generating AI reflection:", error);
      setAiError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsAiLoading(false);
      // Clear question input but keep the answer displayed
      setQuestion("");
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
          verse: reference,
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

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please sign in to view devotions</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black/90 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/90">
      <div className="container mx-auto px-4 py-12 text-white">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleDateChange(subDays(currentDate, 1))}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            
            <div className="relative">
              <button
                ref={dateButtonRef}
                onClick={toggleCalendar}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <CalendarIcon className="w-5 h-5" />
                <span>{format(currentDate, "MMMM d, yyyy")}</span>
              </button>
              
              {showCalendar && (
                <div
                  ref={calendarRef}
                  className="absolute top-full mt-2 z-50 bg-black/95 p-4 rounded-lg shadow-xl border border-white/10"
                >
                  <DatePicker
                    initialDate={currentDate}
                    onDateSelect={(date: Date | null) => {
                      if (date) {
                        handleDateChange(date);
                        setShowCalendar(false);
                      }
                    }}
                    isOpen={showCalendar}
                    onClose={() => setShowCalendar(false)}
                  />
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleDateChange(addDays(currentDate, 1))}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Hymn of the Month Section */}
          {hymn && (
            <div
              className="relative overflow-hidden rounded-xl cursor-pointer group"
              onClick={() => setShowHymnModal(true)}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90 z-10" />
              <Image
                src={hymnImage}
                alt="Hymn background"
                width={1200}
                height={400}
                className="object-cover w-full h-48"
              />
              <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                <h2 className="text-2xl font-semibold mb-2">
                  Hymn of the Month
                </h2>
                <p className="text-lg text-white/90">{hymn.title}</p>
              </div>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-30" />
            </div>
          )}

          {/* Main Content */}
          {showNoDevotionContent ? (
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 space-y-4">
              <h2 className="text-2xl font-semibold">No Devotion Available</h2>
              <p className="text-lg text-white/90">
                There is no devotion available for this date yet. You can still:
              </p>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li>Read and meditate on the hymn of the month above</li>
                <li>Navigate to a different date using the calendar</li>
                <li>Come back later when content is available</li>
              </ul>
            </div>
          ) : (
            <>
              {/* Reflection Questions */}
              {reflectionQuestions.length > 0 && (
                <div className="space-y-6">
                  {reflectionQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="bg-black/30 backdrop-blur-sm rounded-xl p-6"
                    >
                      <p className="text-lg mb-4">{question}</p>
                      <textarea
                        className="w-full bg-black/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
                        rows={4}
                        placeholder="Write your reflection here..."
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* ... existing modals code ... */}
    </div>
  );
}
