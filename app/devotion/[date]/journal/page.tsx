"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  ChevronRightIcon,
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
import { getFirebaseDb } from "@/lib/firebase/firebase";

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

// CSS animations for the modal
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

export default function JournalPage({ params }: { params: { date: string } }) {
  const router = useRouter();
  const { user, loading, isAnonymous, logout } = useAuth();
  const [devotionData, setDevotionData] = useState<PartialDevotion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [journalEntries, setJournalEntries] = useState<{ [key: string]: string }>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>({});
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error" | "">("");

  // Bible verse modal state
  const [showScriptureModal, setShowScriptureModal] = useState(false);
  const [isScriptureModalClosing, setIsScriptureModalClosing] = useState(false);
  const [bibleVerse, setBibleVerse] = useState<BibleVerse | null>(null);
  const [isFetchingBibleVerse, setIsFetchingBibleVerse] = useState(false);

  // Add ref for modal and touch state
  const scriptureModalRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  
  // Pull-to-close handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Store initial touch position
    setTouchStartY(e.touches[0].clientY);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    
    // Prevent default to avoid scrolling when dragging from the top area (header)
    const headerHeight = 60; // Approximate header height
    const touchY = e.touches[0].clientY;
    const rect = scriptureModalRef.current?.getBoundingClientRect();
    const touchWithinHeader = rect && (touchY - rect.top < headerHeight);
    
    if (touchWithinHeader) {
      e.preventDefault();
    }
    
    const deltaY = touchY - touchStartY;
    
    // Only consider downward movement (positive deltaY)
    if (deltaY > 0) {
      // Apply transform to give visual feedback while dragging
      if (scriptureModalRef.current) {
        scriptureModalRef.current.style.transform = `translateY(${deltaY * 0.5}px)`;
        scriptureModalRef.current.style.transition = 'none';
      }
      
      // Close only when dragged more than 200px (much higher threshold)
      if (deltaY > 200) {
        setTouchStartY(null);
        closeScriptureModal();
      }
    }
  };
  
  const handleTouchEnd = () => {
    // Reset any applied transform with smooth animation
    if (scriptureModalRef.current) {
      scriptureModalRef.current.style.transform = 'translateY(0)';
      scriptureModalRef.current.style.transition = 'transform 0.3s ease-out';
    }
    setTouchStartY(null);
  };

  // Function to close scripture modal with animation
  const closeScriptureModal = () => {
    setIsScriptureModalClosing(true);
    setTimeout(() => {
      setShowScriptureModal(false);
      setIsScriptureModalClosing(false);
    }, 300); // Match animation duration
  };

  // Function to fetch Bible verse
  const fetchBibleVerse = async (reference: string) => {
    if (!reference) return null;

    setIsFetchingBibleVerse(true);
    try {
      // Try to extract the Bible reference using regex - looking for patterns like "John 3:16" or "Genesis 1:1-10"
      const referenceRegex = /([1-3]?\s*[A-Za-z]+)\s+(\d+:\d+(?:-\d+)?)/;
      const match = reference.match(referenceRegex);
      
      let cleanReference = reference;
      if (match && match.length >= 3) {
        // Use the extracted reference if found
        cleanReference = `${match[1]} ${match[2]}`;
      }
      
      // Import utility for getting cached verses
      const { getVerse, getCachedVerse } = await import('@/lib/bibleApi');
      
      // Try to get from cache first
      try {
        // Check if we have this verse in localStorage
        const cachedESV = getCachedVerse(cleanReference, 'esv');
        if (cachedESV) {
          console.log('Found Bible verse in cache:', cleanReference);
          return cachedESV;
        }
        
        const cachedBibleApi = getCachedVerse(cleanReference, 'bible-api');
        if (cachedBibleApi) {
          console.log('Found Bible verse in cache (bible-api):', cleanReference);
          return cachedBibleApi;
        }
      } catch (cacheError) {
        console.warn('Cache retrieval error:', cacheError);
        // Continue to fetch from API
      }
      
      console.log('Fetching Bible verse from API:', cleanReference);
      try {
        const verse = await getVerse(cleanReference);
        return verse;
      } catch (apiError) {
        console.error('Error fetching from API:', apiError);
        // Create a simple verse object as fallback
        const fallbackVerse = {
          text: reference,
          reference: "Scripture",
          verses: [{ verse: 1, text: reference }]
        };
        
        // Try to save even this fallback to cache
        try {
          const { cacheVerse } = await import('@/lib/bibleApi');
          cacheVerse(cleanReference, 'fallback', fallbackVerse);
        } catch (e) {}
        
        return fallbackVerse;
      }
    } catch (error) {
      console.error("Error fetching Bible verse:", error);
      // Create a simple verse object as fallback
      return {
        text: reference,
        reference: "Scripture",
        verses: [{ verse: 1, text: reference }]
      };
    } finally {
      setIsFetchingBibleVerse(false);
    }
  };

  // Handle opening the Scripture modal
  const handleOpenScriptureModal = async () => {
    if (!devotionData?.bibleText) return;
    
    setShowScriptureModal(true);
    
    // Start with a basic verse
    const simpleVerse = {
      text: devotionData.bibleText,
      reference: "Scripture",
      verses: [{ verse: 1, text: devotionData.bibleText }]
    };
    
    setBibleVerse(simpleVerse);
    
    // Then try to fetch the proper verses
    const verse = await fetchBibleVerse(devotionData.bibleText);
    if (verse) {
      setBibleVerse(verse);
    }
  };

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

  // Load journal entries from Firebase with localStorage fallback
  const loadJournalEntries = async () => {
    if (!user) return;
    
    try {
      // First try to load from Firebase
      const db = getFirebaseDb();
      if (db) {
        console.log('Loading journal entries from Firebase for date:', params.date);
        // Create a reference to the user's journal entry for this date
        const docRef = safeDoc('users', user.uid, 'journalEntries', params.date);
        const docSnap = await safeGetDoc(docRef);
        
        if (docSnap && docSnap.exists()) {
          console.log('Found journal entry in Firebase');
          const data = docSnap.data();
          if (data && data.entries) {
            setJournalEntries(data.entries);
            return; // Successfully loaded from Firebase, return early
          }
        } else {
          console.log('No journal entry found in Firebase, checking localStorage');
        }
      }
      
      // Fallback to localStorage if Firebase failed or entry doesn't exist
      const key = `journal_${params.date}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        console.log('Found journal entry in localStorage');
        const parsedEntries = JSON.parse(saved);
        setJournalEntries(parsedEntries);
        
        // If we have localStorage entries but not Firebase entries, sync to Firebase
        if (db && user) {
          console.log('Syncing localStorage entries to Firebase');
          const docRef = safeDoc('users', user.uid, 'journalEntries', params.date);
          await safeSetDoc(docRef, {
            entries: parsedEntries,
            date: params.date,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Error loading journal entries:", error);
    }
  };

  // Save journal entries to Firebase with localStorage fallback
  const saveJournalEntries = async (isManualSave = false) => {
    if (!user) return;
    
    try {
      setSaveStatus("saving");
      
      // Always save to localStorage as fallback
      const key = `journal_${params.date}`;
      localStorage.setItem(key, JSON.stringify(journalEntries));
      
      // Try to save to Firebase
      const db = getFirebaseDb();
      if (db) {
        console.log('Saving journal entries to Firebase for date:', params.date);
        const docRef = safeDoc('users', user.uid, 'journalEntries', params.date);
        await safeSetDoc(docRef, {
          entries: journalEntries,
          date: params.date,
          updatedAt: new Date().toISOString()
        });
      }
      
      setSaveStatus("saved");
      
      // Show success toast notification only for manual saves
      if (isManualSave) {
        toast.success("Journal entries saved");
      }
      
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
      // Call the async function from within the effect
      loadJournalEntries().catch(error => {
        console.error("Error in loadJournalEntries:", error);
      });
    }
  }, [params.date, user, loading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push(`/auth/login?from=${encodeURIComponent(`/devotion/${params.date}`)}`);
    }
  }, [user, loading, router, params.date]);

  // Auto-save when entries change
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (Object.keys(journalEntries).length > 0) {
        saveJournalEntries().catch(error => {
          console.error("Error in auto-save:", error);
        });
      }
    }, 2000);
    
    return () => clearTimeout(autoSaveTimer);
  }, [journalEntries]);

  // Sync all localStorage journal entries to Firebase
  const syncLocalStorageToFirebase = async () => {
    if (!user) return;
    
    try {
      console.log('Checking for localStorage entries to sync to Firebase');
      const db = getFirebaseDb();
      if (!db) return;
      
      // Look for all localStorage keys matching the journal pattern
      const journalKeyPrefix = 'journal_';
      const entriesMap: Record<string, any> = {};
      let syncCount = 0;
      
      // Find all keys in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(journalKeyPrefix)) {
          const date = key.substring(journalKeyPrefix.length);
          const savedEntry = localStorage.getItem(key);
          
          if (savedEntry) {
            try {
              const parsedEntry = JSON.parse(savedEntry);
              entriesMap[date] = parsedEntry;
              
              // Save to Firebase
              const docRef = safeDoc('users', user.uid, 'journalEntries', date);
              await safeSetDoc(docRef, {
                entries: parsedEntry,
                date: date,
                updatedAt: new Date().toISOString()
              });
              syncCount++;
            } catch (parseError) {
              console.error(`Error parsing localStorage entry for ${date}:`, parseError);
            }
          }
        }
      }
      
      console.log(`Synced ${syncCount} journal entries from localStorage to Firebase`);
      
      if (syncCount > 0) {
        toast.success(`Synced ${syncCount} journal entries to your account`);
      }
    } catch (error) {
      console.error('Error syncing localStorage to Firebase:', error);
    }
  };

  // When user first logs in, sync localStorage entries to Firebase
  useEffect(() => {
    if (user && !loading && !isLoading) {
      syncLocalStorageToFirebase().catch(error => {
        console.error("Error in syncLocalStorageToFirebase:", error);
      });
    }
  }, [user, loading]);

  // Auth prompt component for anonymous users
  const AuthPrompt = () => {
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
      <div className="bg-[#0F1211] rounded-2xl p-8 text-center">
        <p className="text-white/70 mb-4">Sign in to access your personal journal</p>
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    const handleSignIn = () => {
      router.push(`/auth/login?from=${encodeURIComponent(`/devotion/${params.date}`)}`);
    };
    
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <p className="text-xl mb-4">Please sign in to view your journal</p>
          <button 
            onClick={handleSignIn}
            className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (isAnonymous) {
    return (
      <div className="min-h-screen bg-black text-white pb-20 font-outfit">
        <style dangerouslySetInnerHTML={{ __html: modalAnimations }} />
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
            
            <div className="flex items-center space-x-6">
              <Link
                href="/history"
                className="text-white/70 hover:text-white"
                onClick={() => {
                  // Store current journal date in session storage
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("journal_originating_date", params.date);
                  }
                }}
              >
                View AI History
              </Link>
              <div className="text-sm">
                {saveStatus === "saving" && <span className="text-white/50">Saving...</span>}
                {saveStatus === "saved" && <span className="text-green-400">Saved</span>}
                {saveStatus === "error" && <span className="text-red-400">Error saving</span>}
              </div>
            </div>
          </div>
          
          {/* Journal Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Journal</h1>
            <p className="text-white/70">{formattedDate()}</p>
            {devotionData?.bibleText && (
              <div 
                className="bg-[#0F1211] p-4 rounded-2xl cursor-pointer mt-2"
                onClick={handleOpenScriptureModal}
              >
                <p className="text-white/90 text-xl">{devotionData.bibleText}</p>
                <p className="text-white/50 text-sm mt-1">Tap to view full scripture</p>
              </div>
            )}
          </div>
          
          <AuthPrompt />
        </div>
        
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
              onTouchMove={handleTouchMove}
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
      </div>
    );
  }

  const sections = getAllQuestionsAndSections();

  return (
    <div className="min-h-screen bg-black text-white pb-20 font-outfit">
      <style dangerouslySetInnerHTML={{ __html: modalAnimations }} />
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
          
          <div className="flex items-center space-x-6">
            <Link
              href="/history"
              className="text-white/70 hover:text-white"
              onClick={() => {
                // Store current journal date in session storage
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("journal_originating_date", params.date);
                }
              }}
            >
              View AI History
            </Link>
            <div className="text-sm">
              {saveStatus === "saving" && <span className="text-white/50">Saving...</span>}
              {saveStatus === "saved" && <span className="text-green-400">Saved</span>}
              {saveStatus === "error" && <span className="text-red-400">Error saving</span>}
            </div>
          </div>
        </div>

        {/* Journal Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Journal</h1>
          <p className="text-white/70">{formattedDate()}</p>
          {devotionData?.bibleText && (
            <div 
              className="bg-[#0F1211] p-4 rounded-2xl cursor-pointer mt-2"
              onClick={handleOpenScriptureModal}
            >
              <p className="text-white/90 text-xl">{devotionData.bibleText}</p>
              <p className="text-white/50 text-sm mt-1">Tap to view full scripture</p>
            </div>
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
          onClick={() => saveJournalEntries(true)}
          className="mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full font-medium"
        >
          Save Journal Entries
          </button>
      </div>

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
            onTouchMove={handleTouchMove}
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
    </div>
  );
}
