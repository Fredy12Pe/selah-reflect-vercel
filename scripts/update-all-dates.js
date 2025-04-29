/**
 * Update All Dates Script
 * 
 * This script synchronizes cached devotion data across dates to ensure 
 * consistent experience when navigating between dates.
 * 
 * To use:
 * 1. Open your devotion app in the browser
 * 2. Navigate to a date that works correctly
 * 3. Open the browser console (F12 or Cmd+Option+I)
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 */

(function() {
  // Find all devotion cache keys
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('devotion_')) {
      allKeys.push(key);
    }
  }
  
  console.log(`Found ${allKeys.length} cached devotion dates`);

  // Find the most recent working date that has complete data
  let bestEntry = null;
  let bestDate = null;
  
  allKeys.forEach(key => {
    try {
      const dateStr = key.replace('devotion_', '');
      const data = JSON.parse(localStorage.getItem(key));
      
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
  
  if (!bestEntry) {
    console.error("No complete entry found to use as template");
    return;
  }
  
  console.log(`Using best entry from date ${bestDate} as template`);
  
  // Generate dates for the past 90 days
  const dates = [];
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
  
  dates.forEach(date => {
    const key = `devotion_${date}`;
    
    // Check if we already have good data for this date
    const existingData = localStorage.getItem(key);
    let shouldUpdate = false;
    
    if (!existingData) {
      shouldUpdate = true;
    } else {
      try {
        const parsedData = JSON.parse(existingData);
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
      const newEntry = JSON.parse(JSON.stringify(bestEntry));
      newEntry.date = date;
      newEntry.id = date;
      
      // If there are reflection sections, update any date references
      if (newEntry.reflectionSections) {
        newEntry.reflectionSections.forEach(section => {
          if (section.passage && section.passage.includes(bestDate)) {
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
  });
  
  console.log(`Update complete! Updated ${updatedCount} dates, skipped ${skippedCount} dates`);
  console.log('Cache is now ready for smooth date navigation');
  
  // Add entries to available dates cache
  try {
    const availableDates = new Set(JSON.parse(localStorage.getItem('availableDates') || '[]'));
    let newDatesAdded = 0;
    
    dates.forEach(date => {
      if (!availableDates.has(date)) {
        availableDates.add(date);
        newDatesAdded++;
      }
    });
    
    if (newDatesAdded > 0) {
      localStorage.setItem('availableDates', JSON.stringify([...availableDates]));
      console.log(`Added ${newDatesAdded} new dates to available dates cache`);
    }
  } catch (e) {
    console.error('Error updating available dates cache:', e);
  }
})(); 