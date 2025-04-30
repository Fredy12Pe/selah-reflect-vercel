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

interface PartialDevotion {
  id?: string;
  date?: string;
  bibleText?: string;
  reflectionSections?: ReflectionSection[];
  title?: string;
  notFound?: boolean;
  error?: string;
}

export default function JournalPage({ params }: { params: { date: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [devotionData, setDevotionData] = useState<PartialDevotion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [journalEntries, setJournalEntries] = useState<{ [key: string]: string }>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>({});
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error" | "">("");

  // Get all questions from all sections
  const getAllQuestionsAndSections = () => {
    if (!devotionData?.reflectionSections?.length) {
      console.log("No reflection sections found");
      return [];
    }

    return devotionData.reflectionSections;
  };

  // Format date for display
  const formattedDate = () => {
    try {
      const date = parseISO(params.date);
      return format(date, "EEEE, MMMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return params.date;
    }
  };

  // Load journal entries from localStorage
  const loadJournalEntries = () => {
    try {
      const key = `journal_${params.date}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setJournalEntries(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading journal entries:", error);
    }
  };

  // Save journal entries to localStorage
  const saveJournalEntries = () => {
    try {
      setSaveStatus("saving");
      const key = `journal_${params.date}`;
      localStorage.setItem(key, JSON.stringify(journalEntries));
      setSaveStatus("saved");
      
      // Reset save status after 2 seconds
      setTimeout(() => {
        setSaveStatus("");
      }, 2000);
    } catch (error) {
      console.error("Error saving journal entries:", error);
      setSaveStatus("error");
      toast.error("Failed to save journal entries");
    }
  };

  // Handle text area changes
  const handleTextChange = (questionId: string, value: string) => {
    setJournalEntries(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Toggle section expansion
  const toggleSection = (sectionIndex: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex]
    }));
  };

  // Fetch devotion data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const devotion = await getDevotionByDate(params.date);
        if (devotion) {
          setDevotionData(devotion);
          
          // Initialize expanded sections
          if (devotion.reflectionSections) {
            const initialExpandedState = devotion.reflectionSections.reduce((acc, _, index) => {
              acc[index] = true; // Start with all expanded
              return acc;
            }, {} as { [key: number]: boolean });
            setExpandedSections(initialExpandedState);
          }
        }
      } catch (error) {
        console.error("Error fetching devotion:", error);
        toast.error("Failed to load devotion data");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !loading) {
      fetchData();
      loadJournalEntries();
    }
  }, [params.date, user, loading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push(`/auth/login?from=${encodeURIComponent(`/devotion/${params.date}/journal`)}`);
    }
  }, [user, loading, router, params.date]);

  // Auto-save when entries change
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (Object.keys(journalEntries).length > 0) {
        saveJournalEntries();
      }
    }, 2000);
    
    return () => clearTimeout(autoSaveTimer);
  }, [journalEntries]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <p className="text-xl mb-4">Please sign in to view your journal</p>
          <Link href={`/auth/login?from=${encodeURIComponent(`/devotion/${params.date}/journal`)}`} className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const sections = getAllQuestionsAndSections();

  return (
    <div className="min-h-screen bg-black text-white pb-20 font-outfit">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href={`/devotion/${params.date}/reflection`}
            className="text-white/70 hover:text-white flex items-center"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            <span>Back to Reflection</span>
          </Link>
          
          <div className="text-sm">
            {saveStatus === "saving" && <span className="text-white/50">Saving...</span>}
            {saveStatus === "saved" && <span className="text-green-400">Saved</span>}
            {saveStatus === "error" && <span className="text-red-400">Error saving</span>}
          </div>
        </div>
        
        {/* Journal Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Journal</h1>
          <p className="text-white/70">{formattedDate()}</p>
          {devotionData?.bibleText && (
            <p className="text-white/90 mt-2 text-xl">{devotionData.bibleText}</p>
          )}
        </div>
        
        {/* No sections message */}
        {sections.length === 0 && (
          <div className="bg-[#0F1211] rounded-2xl p-8 text-center">
            <p className="text-white/70">No journal prompts available for this date.</p>
          </div>
        )}
        
        {/* Journal Sections */}
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6 bg-[#0F1211] rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection(sectionIndex)}
              className="w-full p-6 flex items-center justify-between text-left"
            >
              <h2 className="text-xl font-medium">Section {sectionIndex + 1}</h2>
              {expandedSections[sectionIndex] ? (
                <ChevronUpIcon className="w-5 h-5 text-white/70" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-white/70" />
              )}
            </button>
            
            {expandedSections[sectionIndex] && (
              <div className="px-6 pb-6">
                {/* Passage if available */}
                {section.passage && (
                  <div className="mb-6 p-4 bg-zinc-800 rounded-xl">
                    <h3 className="text-lg font-medium text-white/90 mb-2">Passage:</h3>
                    <p className="text-white/80">{section.passage}</p>
                  </div>
                )}
                
                {/* Questions and textareas */}
                {section.questions && section.questions.map((question, qIndex) => {
                  const questionId = `section_${sectionIndex}_q_${qIndex}`;
                  return (
                    <div key={questionId} className="mb-8">
                      <h3 className="text-lg font-medium mb-3">{question}</h3>
                      <textarea
                        value={journalEntries[questionId] || ""}
                        onChange={(e) => handleTextChange(questionId, e.target.value)}
                        className="w-full bg-black/30 text-white rounded-xl p-4 min-h-[120px] outline-none border border-white/10 focus:border-white/30"
                        placeholder="Write your reflection here..."
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        
        {/* Save Button */}
        <button
          onClick={saveJournalEntries}
          className="mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full font-medium"
        >
          Save Journal Entries
        </button>
      </div>
    </div>
  );
}
