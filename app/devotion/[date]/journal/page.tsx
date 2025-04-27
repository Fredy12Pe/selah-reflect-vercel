"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/context/AuthContext";
import { getDevotionByDate } from "@/lib/services/devotionService";
import {
  safeDoc,
  safeCollection,
  safeSetDoc,
  safeGetDoc,
  safeUpdateDoc,
  safeGetDocs,
} from "@/lib/utils/firebase-helpers";
import { toast } from "react-hot-toast";
import { Devotion, ReflectionSection } from "@/lib/types/devotion";

// Add generateStaticParams in a separate file to make it compatible with static export
// This file should be placed in the same directory
// This is necessary because we can't use "use client" and export generateStaticParams in the same file

interface JournalEntry {
  [sectionId: string]: {
    [questionId: string]: string;
  };
}

interface AIReflection {
  question: string;
  answer: string;
  timestamp: string;
}

interface BibleVerse {
  text: string;
  reference: string;
  verses: {
    verse: number;
    text: string;
  }[];
}

// Function to get the localStorage key for a date
const getReflectionStorageKey = (dateString: string) => {
  return `aiReflection_${dateString}`;
};

export default function JournalPage({ params }: { params: { date: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [entries, setEntries] = useState<JournalEntry>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Scripture modal state
  const [showScriptureModal, setShowScriptureModal] = useState(false);
  const [isScriptureModalClosing, setIsScriptureModalClosing] = useState(false);
  const [bibleVerse, setBibleVerse] = useState<BibleVerse | null>(null);
  const [isFetchingBibleVerse, setIsFetchingBibleVerse] = useState(false);

  // AI Reflection states
  const [aiReflections, setAiReflections] = useState<AIReflection[]>([]);
  const [expandedReflection, setExpandedReflection] = useState<number | null>(
    null
  );
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [isAiDropdownOpen, setIsAiDropdownOpen] = useState(false);

  const currentDate = parseISO(params.date);
  const formattedDate = format(currentDate, "EEEE, MMMM d, yyyy");

  // Load devotion and existing journal entries
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Load devotion data
        const devotionData = await getDevotionByDate(params.date);
        if (!devotionData) {
          toast.error("Could not find devotion for this date");
          router.push(`/devotion/${params.date}/reflection`);
          return;
        }
        setDevotion(devotionData);

        // Load existing journal entries
        const journalRef = safeDoc(user.uid, "journalEntries", params.date);
        const journalSnap = await safeGetDoc(journalRef);

        if (journalSnap.exists()) {
          const data = journalSnap.data();
          setEntries(data.entries || {});

          // Load AI reflections if they exist
          if (data.aiReflections) {
            setAiReflections(data.aiReflections);
          }
        } else {
          // Initialize empty entries for all questions
          const initialEntries: JournalEntry = {};
          devotionData.reflectionSections.forEach((section, sectionIndex) => {
            initialEntries[sectionIndex.toString()] = {};
            section.questions.forEach((_, questionIndex) => {
              initialEntries[sectionIndex.toString()][
                questionIndex.toString()
              ] = "";
            });
          });
          setEntries(initialEntries);
        }

        // Check for and import AI reflections from localStorage
        const reflectionState = localStorage.getItem(
          getReflectionStorageKey(params.date)
        );
        console.log(
          "[DEBUG-JOURNAL] Getting localStorage for key:",
          getReflectionStorageKey(params.date)
        );
        console.log(
          "[DEBUG-JOURNAL] Raw data from localStorage:",
          reflectionState
        );

        if (reflectionState) {
          try {
            const parsedData = JSON.parse(reflectionState);
            console.log("[DEBUG-JOURNAL] Parsed data:", parsedData);

            // Handle both array format and old single-item format
            const reflectionsToImport = Array.isArray(parsedData)
              ? parsedData
              : [parsedData];
            console.log(
              "[DEBUG-JOURNAL] Reflections to import:",
              reflectionsToImport
            );

            if (reflectionsToImport.length > 0) {
              let hasNewReflections = false;
              let newReflections = [...aiReflections]; // Start with existing reflections
              console.log(
                "[DEBUG-JOURNAL] Starting with existing reflections:",
                newReflections
              );

              // Process each reflection
              reflectionsToImport.forEach((data) => {
                console.log(
                  "[DEBUG-JOURNAL] Processing reflection item:",
                  data
                );

                if (data.question && data.reflection) {
                  // Check if we already have this reflection
                  const alreadyExists =
                    newReflections.some((r) => r.question === data.question) ||
                    (journalSnap.exists() &&
                      journalSnap
                        .data()
                        .aiReflections?.some(
                          (r: AIReflection) => r.question === data.question
                        ));

                  console.log(
                    "[DEBUG-JOURNAL] Already exists check:",
                    alreadyExists
                  );

                  if (!alreadyExists) {
                    const newReflection: AIReflection = {
                      question: data.question,
                      answer: data.reflection,
                      timestamp: data.timestamp || new Date().toISOString(),
                    };

                    console.log(
                      "[DEBUG-JOURNAL] Adding new reflection:",
                      newReflection
                    );
                    newReflections.push(newReflection);
                    hasNewReflections = true;
                  }
                }
              });

              console.log(
                "[DEBUG-JOURNAL] Has new reflections:",
                hasNewReflections
              );
              console.log(
                "[DEBUG-JOURNAL] Final reflections array:",
                newReflections
              );

              if (hasNewReflections) {
                setAiReflections(newReflections);
                setHasChanges(true);
                toast.success("AI reflections imported");
              }

              // Clear from localStorage after importing
              console.log(
                "[DEBUG-JOURNAL] Keeping data in localStorage for reflection page"
              );
            }
          } catch (error) {
            console.error(
              "[DEBUG-JOURNAL] Error parsing stored AI reflection:",
              error
            );
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load journal data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, params.date, router]);

  // Update an entry for a specific question
  const updateEntry = (
    sectionIndex: number,
    questionIndex: number,
    value: string
  ) => {
    setEntries((prev) => {
      const newEntries = { ...prev };
      if (!newEntries[sectionIndex.toString()]) {
        newEntries[sectionIndex.toString()] = {};
      }
      newEntries[sectionIndex.toString()][questionIndex.toString()] = value;
      return newEntries;
    });
    setHasChanges(true);
  };

  // Add an AI reflection
  const addAiReflection = () => {
    if (!aiQuestion.trim() || !aiAnswer.trim()) return;

    const newReflection: AIReflection = {
      question: aiQuestion.trim(),
      answer: aiAnswer.trim(),
      timestamp: new Date().toISOString(),
    };

    setAiReflections((prev) => [...prev, newReflection]);
    setAiQuestion("");
    setAiAnswer("");
    setHasChanges(true);
  };

  // Toggle AI reflection expansion
  const toggleReflection = (index: number) => {
    setExpandedReflection(expandedReflection === index ? null : index);
  };

  // Delete an AI reflection
  const deleteReflection = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the accordion toggle

    try {
      // Create a new array without the reflection to delete
      const updatedReflections = aiReflections.filter((_, i) => i !== index);

      // Update the state
      setAiReflections(updatedReflections);

      // Mark as having changes that need to be saved
      setHasChanges(true);

      // Show success message
      toast.success("Reflection deleted");
    } catch (error) {
      console.error("[DEBUG-JOURNAL] Error deleting reflection:", error);
      toast.error("Failed to delete reflection");
    }
  };

  // Save all entries to Firebase
  const saveEntries = async () => {
    if (!user) {
      toast.error("You must be signed in to save");
      return;
    }

    setIsSaving(true);
    try {
      const journalRef = safeDoc(user.uid, "journalEntries", params.date);

      await safeSetDoc(
        journalRef,
        {
          entries,
          aiReflections,
          date: params.date,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      toast.success("Journal entries saved");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving journal entries:", error);
      toast.error("Failed to save journal entries");
    } finally {
      setIsSaving(false);
    }
  };

  // Function to fetch a Bible verse
  const fetchBibleVerse = async (
    reference: string
  ): Promise<BibleVerse | null> => {
    if (!reference) return null;

    setIsFetchingBibleVerse(true);

    try {
      const response = await fetch(
        `https://bible-api.com/${encodeURIComponent(
          reference
        )}?verse_numbers=true`
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
      return null;
    } finally {
      setIsFetchingBibleVerse(false);
    }
  };

  // Handle opening the scripture modal
  const handleOpenScriptureModal = async () => {
    if (devotion?.bibleText && !bibleVerse) {
      const verse = await fetchBibleVerse(devotion.bibleText);
      if (verse) {
        setBibleVerse(verse);
      }
    }
    setShowScriptureModal(true);
  };

  // Function to handle scripture modal closing with animation
  const closeScriptureModal = () => {
    setIsScriptureModalClosing(true);
    setTimeout(() => {
      setShowScriptureModal(false);
      setIsScriptureModalClosing(false);
    }, 300); // Match animation duration
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!devotion) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <p className="text-xl mb-4">Devotion not found</p>
        <Link
          href="/devotion"
          className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
        >
          Go Back
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="relative px-4 py-6 border-b border-white/10">
        <div className="max-w-3xl mx-auto">
          <Link
            href={`/devotion/${params.date}/reflection`}
            className="inline-flex items-center text-white/70 hover:text-white mb-2"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Reflection
          </Link>
          <h1 className="text-3xl font-bold">Journal</h1>
          <p className="text-white/70">{formattedDate}</p>
        </div>
      </div>

      {/* Journal Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Today's Scripture</h2>
          <div
            className="p-4 bg-zinc-900/60 rounded-xl mb-4 cursor-pointer hover:bg-zinc-800/60 transition-colors"
            onClick={handleOpenScriptureModal}
          >
            <p className="text-lg">{devotion.bibleText}</p>
          </div>
        </div>

        {/* Reflection Sections */}
        <div className="space-y-12">
          {devotion.reflectionSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">{section.passage}</h2>
                <div className="w-20 h-1 bg-white/30 mt-2"></div>
              </div>

              {section.questions.map((question, questionIndex) => (
                <div key={questionIndex} className="space-y-3">
                  <h3 className="text-lg font-medium text-white/90">
                    {questionIndex + 1}. {question}
                  </h3>
                  <textarea
                    value={
                      entries[sectionIndex.toString()]?.[
                        questionIndex.toString()
                      ] || ""
                    }
                    onChange={(e) =>
                      updateEntry(sectionIndex, questionIndex, e.target.value)
                    }
                    className="w-full p-4 bg-zinc-800/60 rounded-xl text-white placeholder-white/40 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Write your thoughts here..."
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* AI Reflections Section */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">AI Reflections</h2>
            <button
              onClick={() => setIsAiDropdownOpen(!isAiDropdownOpen)}
              className="p-2 rounded-full bg-zinc-800/60 hover:bg-zinc-700/60 transition-colors"
            >
              {isAiDropdownOpen ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {isAiDropdownOpen && (
            <div className="space-y-4 mb-6">
              {/* AI Reflections Accordion */}
              {aiReflections.length > 0 ? (
                <div className="space-y-3">
                  {aiReflections.map((reflection, index) => (
                    <div
                      key={index}
                      className="bg-zinc-900/60 rounded-xl overflow-hidden"
                    >
                      <div
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-zinc-800/60 transition-colors"
                        onClick={() => toggleReflection(index)}
                      >
                        <h3 className="text-lg font-medium text-white/90 truncate pr-4">
                          {reflection.question}
                        </h3>
                        <div className="flex items-center">
                          <button
                            onClick={(e) => deleteReflection(index, e)}
                            className="mr-2 p-1 text-white/60 hover:text-white/90 transition-colors"
                            aria-label="Delete reflection"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
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
                          {expandedReflection === index ? (
                            <ChevronUpIcon className="w-5 h-5 flex-shrink-0" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 flex-shrink-0" />
                          )}
                        </div>
                      </div>

                      {expandedReflection === index && (
                        <div className="p-4 pt-0 border-t border-zinc-800">
                          <p className="text-white/80 whitespace-pre-wrap">
                            {reflection.answer}
                          </p>
                          <p className="text-xs text-white/40 mt-2">
                            {new Date(reflection.timestamp).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-zinc-900/40 rounded-xl">
                  <p className="text-white/60">No AI reflections yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="fixed bottom-6 right-6 z-10">
          <button
            onClick={saveEntries}
            disabled={isSaving || !hasChanges}
            className={`px-6 py-3 rounded-full font-medium flex items-center shadow-lg ${
              hasChanges ? "bg-white text-black" : "bg-zinc-700 text-zinc-400"
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                {hasChanges ? "Save Journal" : "Saved"}
                {hasChanges && <ArrowRightIcon className="w-5 h-5 ml-2" />}
              </>
            )}
          </button>
        </div>
      </div>

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
                {bibleVerse?.reference || devotion?.bibleText || "Scripture"}
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

            <div className="mt-2">
              {isFetchingBibleVerse ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : bibleVerse ? (
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
                <p className="text-lg leading-relaxed text-white/90">
                  {devotion.scriptureText || "Scripture text not available."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
