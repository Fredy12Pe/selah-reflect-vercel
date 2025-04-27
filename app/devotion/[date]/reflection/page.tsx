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
} from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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

export default function ReflectionPage({
  params,
}: {
  params: { date: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [devotionData, setDevotionData] = useState<Devotion | null>(null);
  const currentDate = parseISO(params.date);
  const today = new Date();
  const calendarRef = useRef<HTMLDivElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  // Image states
  const [hymnImage, setHymnImage] = useState("/hymn-bg.jpg");
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

  // Function to check if a devotion exists and load it
  const checkAndLoadDevotion = async (date: string) => {
    if (!user) return false;
    setIsLoading(true);
    try {
      const devotion = await getDevotionByDate(date);
      console.log("Loaded devotion data:", devotion);
      if (devotion) {
        setDevotionData(devotion);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking devotion:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load devotion data on mount and when date changes
  useEffect(() => {
    console.log("Loading devotion for date:", params.date);
    checkAndLoadDevotion(params.date);

    // Reset AI reflection state when navigating to a different date
    setAiReflection("");
    setQuestion("");
    setAiError("");
  }, [params.date, user]);

  // Load background images for modals from Unsplash
  useEffect(() => {
    const loadImages = async () => {
      try {
        // Get image for hymn modal
        const hymn = await getDailyDevotionImage(
          params.date,
          "landscape,mountains,sunrise,peaceful"
        );
        if (hymn) setHymnImage(hymn);

        // Get image for resources modal
        const resources = await getDailyDevotionImage(
          params.date,
          "landscape,forest,lake,sunset"
        );
        if (resources) setResourcesImage(resources);
      } catch (error) {
        console.error("Error loading background images:", error);
        // Keep default images if there's an error
      }
    };

    loadImages();
  }, [params.date]);

  // Function to handle navigation
  const handleDateChange = async (newDate: Date) => {
    // Prevent navigation to future dates
    if (isFuture(newDate)) {
      toast.error("Cannot view future devotions");
      return;
    }

    setIsLoading(true);
    const formattedDate = format(newDate, "yyyy-MM-dd");

    // Check if devotion exists for the new date
    const exists = await checkAndLoadDevotion(formattedDate);
    if (!exists) {
      toast.error("No devotion available for this date");
      setIsLoading(false);
      return;
    }

    // Navigate to the new date
    router.push(`/devotion/${formattedDate}/reflection`);
  };

  // Disable next button if current date is today
  const isNextDisabled = isToday(currentDate) || isFuture(currentDate);

  // Get the first two questions from all sections
  const getFirstTwoQuestions = () => {
    if (!devotionData?.reflectionSections?.length) {
      console.log("No reflection sections found");
      return [];
    }

    const firstSection = devotionData.reflectionSections[0];
    console.log("First reflection section:", firstSection);
    return firstSection.questions.slice(0, 2);
  };

  // Get the current questions
  const currentQuestions = getFirstTwoQuestions();
  console.log("Current questions:", currentQuestions);

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

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Date Navigation */}
      <div className="relative flex items-center justify-center py-4">
        <button
          onClick={() => handleDateChange(subDays(currentDate, 1))}
          disabled={isLoading}
          className="absolute left-4 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800/50
            hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>

        <button
          ref={dateButtonRef}
          onClick={toggleCalendar}
          className="px-8 py-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 transition-all flex items-center gap-2"
        >
          <span className="text-lg">{format(currentDate, "EEEE, MMMM d")}</span>
          <CalendarIcon className="w-5 h-5" />
        </button>

        {showCalendar && (
          <div ref={calendarRef} className="absolute top-full mt-2 z-50">
            <DatePicker
              selected={currentDate}
              onChange={(date: Date | null) => {
                setShowCalendar(false);
                if (date) handleDateChange(date);
              }}
              maxDate={new Date()}
              inline
              calendarClassName="bg-zinc-800 border-zinc-700 text-white"
              dayClassName={(_date: Date) => "hover:bg-zinc-700 rounded-full"}
            />
          </div>
        )}

        <button
          onClick={() => handleDateChange(addDays(currentDate, 1))}
          disabled={isNextDisabled || isLoading}
          className="absolute right-4 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800/50
            hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Hymn of the Month */}
            <BackgroundCard
              date={params.date}
              query="landscape mountains sunrise peaceful"
              height="200px"
              className="w-full cursor-pointer rounded-3xl"
              onClick={() => setShowHymnModal(true)}
              imageType="hymn"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 to-black/80" />
              <div className="relative p-6 flex flex-col justify-end h-full">
                <p className="text-lg font-medium mb-2">Hymn of the Month:</p>
                <h2 className="text-3xl font-medium">
                  When I survey the Wondrous Cross
                </h2>
              </div>
            </BackgroundCard>

            {/* Today's Scripture */}
            <div>
              <h3 className="text-xl mb-3">Today's Scripture</h3>
              <div
                className="p-6 rounded-2xl bg-zinc-900/80 cursor-pointer hover:bg-zinc-800/80 transition-colors"
                onClick={handleOpenScriptureModal}
              >
                <p className="text-2xl font-medium">
                  {devotionData?.bibleText || "No scripture available"}
                </p>
              </div>
            </div>

            {/* Reflection Questions */}
            <div>
              <h3 className="text-xl mb-3">Reflection Questions</h3>
              <div className="p-6 rounded-2xl bg-zinc-900/80 space-y-8">
                <div className="space-y-6">
                  {currentQuestions.length > 0 ? (
                    currentQuestions.map((question, index) => (
                      <div key={index}>
                        <p className="text-lg">
                          {index + 1}. {question}
                        </p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div>
                        <p className="text-lg">1.</p>
                      </div>
                      <div>
                        <p className="text-lg">2.</p>
                      </div>
                    </>
                  )}
                </div>
                <Link
                  href={`/devotion/${params.date}/journal`}
                  className="inline-flex items-center px-6 py-3 bg-white text-black rounded-full font-medium"
                >
                  Journal Entry
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>

            {/* Reflect with AI */}
            <div>
              <h3 className="text-xl mb-3">Reflect with AI</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Ask questions about today's text..."
                  className="flex-1 px-6 py-4 rounded-2xl bg-zinc-900/80 text-white placeholder-gray-400"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleReflectionKeyPress}
                  disabled={isAiLoading}
                />
                <button
                  className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-700/80 transition-all disabled:opacity-50"
                  onClick={handleReflectionGeneration}
                  disabled={
                    isAiLoading || !question.trim() || !devotionData?.bibleText
                  }
                >
                  {isAiLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRightIcon className="w-6 h-6" />
                  )}
                </button>
              </div>

              {aiError && (
                <div className="text-red-400 mb-4 px-4 py-2 bg-red-900/30 rounded-lg">
                  {aiError}
                </div>
              )}

              {aiReflection && (
                <div className="p-6 rounded-2xl bg-zinc-900/80 mb-6">
                  <p className="text-lg whitespace-pre-wrap">{aiReflection}</p>
                </div>
              )}
            </div>

            {/* Resources */}
            <div onClick={handleOpenResourcesModal} className="cursor-pointer">
              <BackgroundCard
                date={params.date}
                query="landscape forest lake sunset"
                height="150px"
                className="rounded-2xl"
                imageType="resources"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-purple-900/70 to-black/80 hover:opacity-90 transition-opacity" />
                <div className="relative p-6">
                  <h3 className="text-2xl font-semibold mb-2">
                    Resources for today's text
                  </h3>
                  <p className="text-gray-300">
                    Bible Commentaries, Videos, and Podcasts
                  </p>
                </div>
              </BackgroundCard>
            </div>
          </>
        )}
      </div>

      {/* Hymn Modal */}
      {showHymnModal && (
        <div
          className={`fixed inset-0 z-50 flex items-end justify-center bg-black/80 ${
            isHymnModalClosing ? "animate-fadeout" : "animate-fadein"
          }`}
          onClick={closeHymnModal}
        >
          <div
            className={`w-full max-w-lg bg-zinc-900 rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto ${
              isHymnModalClosing ? "animate-slideout" : "animate-slidein"
            }`}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the modal content
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                When I Survey the Wondrous Cross
              </h2>
              <button
                onClick={closeHymnModal}
                className="p-2 text-white hover:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-gray-400 italic mb-6">By Isaac Watts, 1707</p>

            <div className="space-y-6">
              {hymnLyrics.map((verse) => (
                <div key={verse.verse} className="space-y-1.5">
                  <p className="text-gray-400 font-medium">
                    Verse {verse.verse}
                  </p>
                  {verse.lines.map((line, i) => (
                    <p key={i} className="text-white">
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-zinc-700 pt-4">
              <p className="text-gray-400 text-sm">
                This hymn reminds us of Christ's sacrifice and calls us to
                respond with total dedication. It's one of the most powerful and
                beloved hymns in Christian worship.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scripture Modal */}
      {showScriptureModal && (
        <div
          className={`fixed inset-0 z-50 flex items-end justify-center bg-black/80 ${
            isScriptureModalClosing ? "animate-fadeout" : "animate-fadein"
          }`}
          onClick={closeScriptureModal}
        >
          <div
            className={`w-full max-w-lg bg-zinc-900 rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto ${
              isScriptureModalClosing ? "animate-slideout" : "animate-slidein"
            }`}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the modal content
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {bibleVerse?.reference ||
                  devotionData?.bibleText ||
                  "Scripture"}
              </h2>
              <button
                onClick={closeScriptureModal}
                className="p-2 text-white hover:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {isFetchingBibleVerse ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : bibleVerse?.verses ? (
                <div className="space-y-4">
                  {bibleVerse.verses.map((verse) => (
                    <p
                      key={verse.verse}
                      className="text-lg leading-relaxed text-white/90"
                    >
                      <span className="text-white/50 text-sm align-super mr-2">
                        {verse.verse}
                      </span>
                      {verse.text}
                    </p>
                  ))}
                </div>
              ) : (
                <div>
                  {/* Fallback to display the raw text if no verse structure is available */}
                  {devotionData?.bibleText && (
                    <p className="text-lg leading-relaxed text-white/90">
                      {devotionData.bibleText}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resources Modal */}
      {showResourcesModal && (
        <div
          className={`fixed inset-0 z-50 flex items-end justify-center bg-black/80 ${
            isResourcesModalClosing ? "animate-fadeout" : "animate-fadein"
          }`}
          onClick={closeResourcesModal}
        >
          <div
            className={`w-full max-w-lg bg-zinc-900 rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto ${
              isResourcesModalClosing ? "animate-slideout" : "animate-slidein"
            }`}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the modal content
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Resources for {bibleVerse?.reference || devotionData?.bibleText}
              </h2>
              <button
                onClick={closeResourcesModal}
                className="p-2 text-white hover:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {isFetchingResources ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white/70 text-lg">
                  Finding resources for this passage...
                </p>
                <p className="text-white/50 text-sm mt-2">
                  This may take a few moments
                </p>
              </div>
            ) : resourcesError ? (
              <div className="text-red-400 mb-4 px-4 py-2 bg-red-900/30 rounded-lg">
                {resourcesError}
              </div>
            ) : !resources ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white/70 text-lg">
                  Finding resources for this passage...
                </p>
                <p className="text-white/50 text-sm mt-2">
                  This may take a few moments
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Commentaries Section */}
                {resources.commentaries &&
                  resources.commentaries.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-white/80 mb-3">
                        Online Commentaries
                      </h3>
                      <div className="space-y-4">
                        {resources.commentaries.map((item, index) => (
                          <div
                            key={index}
                            className="p-4 bg-zinc-800/50 rounded-xl"
                          >
                            <h4 className="font-bold text-white">
                              {item.title}
                            </h4>
                            {item.author && (
                              <p className="text-white/70 text-sm">
                                {item.author}
                              </p>
                            )}
                            <p className="text-white/80 mt-2">
                              {item.description}
                            </p>
                            <a
                              href={
                                isValidUrl(item.url)
                                  ? item.url
                                  : getFallbackUrl(
                                      item.type || "commentary",
                                      item.title
                                    )
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center"
                            >
                              Read Commentary
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 ml-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Videos Section */}
                {resources.videos && resources.videos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-white/80 mb-3">
                      Videos
                    </h3>
                    <div className="space-y-4">
                      {resources.videos.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 bg-zinc-800/50 rounded-xl"
                        >
                          <h4 className="font-bold text-white">{item.title}</h4>
                          {item.author && (
                            <p className="text-white/70 text-sm">
                              {item.author}
                            </p>
                          )}
                          <p className="text-white/80 mt-2">
                            {item.description}
                          </p>
                          <a
                            href={
                              isValidUrl(item.url)
                                ? item.url
                                : getFallbackUrl(
                                    item.type || "video",
                                    item.title
                                  )
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center"
                          >
                            Watch Video
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 ml-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Podcasts Section */}
                {resources.podcasts && resources.podcasts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-white/80 mb-3">
                      Podcasts
                    </h3>
                    <div className="space-y-4">
                      {resources.podcasts.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 bg-zinc-800/50 rounded-xl"
                        >
                          <h4 className="font-bold text-white">{item.title}</h4>
                          {item.author && (
                            <p className="text-white/70 text-sm">
                              {item.author}
                            </p>
                          )}
                          <p className="text-white/80 mt-2">
                            {item.description}
                          </p>
                          <a
                            href={
                              isValidUrl(item.url)
                                ? item.url
                                : getFallbackUrl(
                                    item.type || "podcast",
                                    item.title
                                  )
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center"
                          >
                            Listen to Podcast
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 ml-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Books Section */}
                {resources.books && resources.books.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-white/80 mb-3">
                      Books
                    </h3>
                    <div className="space-y-4">
                      {resources.books.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 bg-zinc-800/50 rounded-xl"
                        >
                          <h4 className="font-bold text-white">{item.title}</h4>
                          {item.author && (
                            <p className="text-white/70 text-sm">
                              {item.author}
                            </p>
                          )}
                          <p className="text-white/80 mt-2">
                            {item.description}
                          </p>
                          <a
                            href={
                              isValidUrl(item.url)
                                ? item.url
                                : getFallbackUrl(
                                    item.type || "book",
                                    item.title
                                  )
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center"
                          >
                            View Book
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 ml-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
