"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/lib/context/AuthContext";
import { ClockIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

// Interface for stored reflection
interface StoredReflection {
  question: string;
  reflection: string;
  timestamp: string;
}

// Interface for reflection entry with date
interface DatedReflection extends StoredReflection {
  date: string;
  formattedDate: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [reflections, setReflections] = useState<DatedReflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<{[key: number]: boolean}>({});
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Function to toggle expansion of a reflection
  const toggleExpand = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Load all reflections from localStorage
  const loadAllReflections = () => {
    if (typeof window === "undefined") return;

    try {
      const allReflections: DatedReflection[] = [];
      
      // Iterate through all localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Check if this is a reflection item
        if (key && key.startsWith("aiReflection_")) {
          try {
            // Extract date from key (format: aiReflection_YYYY-MM-DD)
            const date = key.replace("aiReflection_", "");
            
            // Get and parse the reflection data
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              
              // Handle both array format and old single-item format
              const reflectionArray = Array.isArray(parsed) ? parsed : [parsed];
              
              // Add each reflection with its date
              reflectionArray.forEach((item: StoredReflection) => {
                try {
                  const formattedDate = format(parseISO(date), "MMMM d, yyyy");
                  allReflections.push({
                    ...item,
                    date,
                    formattedDate
                  });
                } catch (error) {
                  console.error("Error formatting date:", error);
                }
              });
            }
          } catch (error) {
            console.error("Error processing reflection item:", error);
          }
        }
      }
      
      // Sort reflections by timestamp (newest first)
      allReflections.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setReflections(allReflections);
      
      // Set the current date to the most recent reflection date if available
      if (allReflections.length > 0) {
        setCurrentDate(allReflections[0].date);
      }
    } catch (error) {
      console.error("Error loading reflections:", error);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (!loading && user) {
      setIsLoading(true);
      loadAllReflections();
      setIsLoading(false);
    } else if (!loading && !user) {
      router.push("/auth/login?from=/history");
    }
  }, [user, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your AI Reflection History</h1>
          <p className="text-white/70">
            All your past AI-generated reflections
          </p>
        </div>
        
        {/* Navigation */}
        <div className="mb-8">
          <Link 
            href={`/devotion/${currentDate}/journal`}
            className="text-white/70 hover:text-white flex items-center space-x-1"
          >
            <span>← Back to Journal</span>
          </Link>
        </div>
        
        {/* Content */}
        <div className="space-y-6">
          {reflections.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <p>You haven't created any AI reflections yet.</p>
            </div>
          ) : (
            reflections.map((reflection, index) => (
              <div key={index} className="bg-[#0F1211] p-6 rounded-2xl">
                <button 
                  className="w-full text-left"
                  onClick={() => toggleExpand(index)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-medium">{reflection.question}</h3>
                    <div className="flex items-center">
                      <div className="text-white/50 text-sm flex items-center mr-3">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        <span>{reflection.formattedDate}</span>
                      </div>
                      {expandedItems[index] ? (
                        <ChevronUpIcon className="w-5 h-5 text-white/70" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-white/70" />
                      )}
                    </div>
                  </div>
                  <p className="text-white/80">
                    {expandedItems[index] ? reflection.reflection : `${reflection.reflection.substring(0, 250)}${reflection.reflection.length > 250 ? '...' : ''}`}
                  </p>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 