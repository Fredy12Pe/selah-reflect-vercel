'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface DevotionData {
  id?: string;
  date?: string;
  bibleText?: string;
  reflectionSections?: Array<{
    passage?: string;
    questions?: string[];
    [key: string]: any;
  }>;
  title?: string;
  notFound?: boolean;
  error?: string;
  [key: string]: any;
}

export default function UpdateCache() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<{
    updated: number;
    skipped: number;
    datesAdded: number;
  } | null>(null);

  const handleUpdateCache = async () => {
    setIsUpdating(true);
    setResult(null);
    
    try {
      console.log('Starting cache update process...');
      
      // Find all devotion cache keys
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('devotion_')) {
          allKeys.push(key);
        }
      }
      
      console.log(`Found ${allKeys.length} cached devotion dates`);

      // Find the most recent working date that has complete data
      let bestEntry: DevotionData | null = null;
      let bestDate: string | null = null;
      
      allKeys.forEach(key => {
        try {
          const dateStr = key.replace('devotion_', '');
          const data = JSON.parse(localStorage.getItem(key) || '') as DevotionData;
          
          // Check if this entry has complete data
          if (data && 
              data.reflectionSections && 
              data.reflectionSections.length > 0 && 
              !data.notFound && 
              !data.error) {
            
            // Compare with current best entry
            if (!bestDate || dateStr > bestDate) {
              bestEntry = data;
              bestDate = dateStr;
            }
          }
        } catch (e) {
          console.error(`Error processing ${key}:`, e);
        }
      });
      
      if (!bestEntry || !bestDate) {
        toast.error("No working dates found. Please visit a date with complete data first.");
        setIsUpdating(false);
        return;
      }
      
      console.log(`Using best entry from date ${bestDate} as template`);
      toast.success(`Using data from ${bestDate} as template`);
      
      // Generate dates for the past 90 days
      const dates: string[] = [];
      const today = new Date();
      
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
      }
      
      console.log(`Generated ${dates.length} dates to update`);
      
      // Update missing or broken entries
      let updatedCount = 0;
      let skippedCount = 0;
      
      // Process in batches to avoid blocking the UI
      const batchSize = 10;
      const totalBatches = Math.ceil(dates.length / batchSize);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min((batchIndex + 1) * batchSize, dates.length);
        const batch = dates.slice(batchStart, batchEnd);
        
        // Process this batch
        for (const date of batch) {
          const key = `devotion_${date}`;
          
          // Check if we already have good data for this date
          const existingData = localStorage.getItem(key);
          let shouldUpdate = false;
          
          if (!existingData) {
            shouldUpdate = true;
          } else {
            try {
              const parsedData = JSON.parse(existingData) as DevotionData;
              if (parsedData.notFound || 
                  parsedData.error || 
                  !parsedData.reflectionSections || 
                  parsedData.reflectionSections.length === 0) {
                shouldUpdate = true;
              }
            } catch (e) {
              shouldUpdate = true;
            }
          }
          
          if (shouldUpdate) {
            // Create a new entry based on the template, but with updated date
            const newEntry = JSON.parse(JSON.stringify(bestEntry)) as DevotionData;
            newEntry.date = date;
            newEntry.id = date;
            
            // If there are reflection sections, update any date references
            if (newEntry.reflectionSections) {
              newEntry.reflectionSections.forEach((section) => {
                if (section.passage && bestDate && section.passage.includes(bestDate)) {
                  section.passage = section.passage.replace(bestDate, date);
                }
              });
            }
            
            // Store updated entry
            localStorage.setItem(key, JSON.stringify(newEntry));
            updatedCount++;
          } else {
            skippedCount++;
          }
        }
        
        // Allow UI to update between batches
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      console.log(`Update complete! Updated ${updatedCount} dates, skipped ${skippedCount} dates`);
      
      // Add entries to available dates cache
      let newDatesAdded = 0;
      try {
        const availableDatesArray = JSON.parse(localStorage.getItem('availableDates') || '[]') as string[];
        const availableDates = new Set<string>(availableDatesArray);
        
        dates.forEach(date => {
          if (!availableDates.has(date)) {
            availableDates.add(date);
            newDatesAdded++;
          }
        });
        
        if (newDatesAdded > 0) {
          localStorage.setItem('availableDates', JSON.stringify(Array.from(availableDates)));
          console.log(`Added ${newDatesAdded} new dates to available dates cache`);
        }
      } catch (e) {
        console.error('Error updating available dates cache:', e);
      }
      
      // Show success
      setResult({
        updated: updatedCount,
        skipped: skippedCount,
        datesAdded: newDatesAdded
      });
      
      toast.success(`Updated ${updatedCount} dates successfully!`);
    } catch (error) {
      console.error('Error during cache update:', error);
      toast.error('Error updating cache');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 bg-zinc-900 rounded-xl">
      <h2 className="text-xl font-bold mb-4">Update Date Cache</h2>
      <p className="mb-4 text-white/70">
        Use this tool to synchronize data across all dates for smooth navigation.
      </p>
      
      <button
        onClick={handleUpdateCache}
        disabled={isUpdating}
        className={`px-4 py-2 rounded-lg ${
          isUpdating 
            ? "bg-zinc-700 text-white/50 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isUpdating ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white/90 rounded-full animate-spin mr-2"></span>
            Updating...
          </>
        ) : (
          "Update Cache"
        )}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-zinc-800 rounded-lg">
          <p className="text-white/90">Cache update complete!</p>
          <ul className="mt-2 space-y-1 text-white/70">
            <li>• Updated {result.updated} dates</li>
            <li>• Skipped {result.skipped} dates (already working)</li>
            <li>• Added {result.datesAdded} dates to available dates cache</li>
          </ul>
          <p className="mt-3 text-white/90">You can now navigate between dates smoothly.</p>
        </div>
      )}
    </div>
  );
} 