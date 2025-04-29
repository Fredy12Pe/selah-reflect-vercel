/**
 * Script to update the passage field in reflectionSections for all devotions
 * This will create unique passages for each reflection section instead of duplicating the same value
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Load dates from file (optional)
async function loadDates() {
  try {
    const data = await fs.promises.readFile('dates.txt', 'utf8');
    return data.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error reading dates file:', error);
    return [];
  }
}

// Alternative: Get dates from API
async function fetchDates() {
  try {
    const response = await fetch(`${API_BASE_URL}/devotions/fix-data-bulk`);
    const data = await response.json();
    return data.devotions.map(devotion => devotion.date);
  } catch (error) {
    console.error('Error fetching dates from API:', error);
    return [];
  }
}

// Get a single devotion by date
async function fetchDevotion(date) {
  try {
    const response = await fetch(`${API_BASE_URL}/devotions/${date}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching devotion for ${date}:`, error);
    return null;
  }
}

// Split a Bible reference into segments
function splitBibleReference(reference) {
  if (!reference) return [];
  
  // Handle multiple verses
  const basicParts = reference.split(/[,;]/);
  
  // If there's only one part, create segments
  if (basicParts.length === 1) {
    // Check for verse ranges like "John 3:1-16"
    const match = reference.match(/^(.*?)\s*(\d+):(\d+)-(\d+)$/);
    if (match) {
      const [_, book, chapter, startVerse, endVerse] = match;
      const segments = [];
      
      // Create segments of 5 verses each
      let start = parseInt(startVerse);
      while (start <= parseInt(endVerse)) {
        const end = Math.min(start + 4, parseInt(endVerse));
        segments.push(`${book} ${chapter}:${start}-${end}`);
        start = end + 1;
      }
      
      return segments.length > 0 ? segments : [reference];
    }
  }
  
  return basicParts.length > 0 ? basicParts : [reference];
}

// Update a single devotion with better passage references
async function updateDevotion(date) {
  try {
    const devotion = await fetchDevotion(date);
    if (!devotion || !devotion.bibleText || !devotion.reflectionSections) {
      console.log(`No data available for ${date}`);
      return;
    }
    
    // Generate unique passages based on the main Bible text
    const bibleText = devotion.bibleText;
    const segments = splitBibleReference(bibleText);
    
    // Create updated sections with unique passages
    const updatedSections = devotion.reflectionSections.map((section, index) => {
      // If we have segments, use them in order, otherwise default to the main text
      let passage = segments[index % segments.length] || bibleText;
      
      // If index > segments length, add a section indicator
      if (segments.length > 0 && index >= segments.length) {
        passage += ` (Part ${Math.floor(index / segments.length) + 1})`;
      }
      
      return {
        ...section,
        passage
      };
    });
    
    // Send the update to the API
    const response = await fetch(`${API_BASE_URL}/devotions/fix-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date,
        reflectionSections: updatedSections
      })
    });
    
    const result = await response.json();
    console.log(`Updated ${date}: ${result.message || JSON.stringify(result)}`);
    
    return result;
  } catch (error) {
    console.error(`Error updating devotion for ${date}:`, error);
    return null;
  }
}

// Process all dates
async function updateAllDevotions() {
  try {
    // Get dates from file or API
    let dates = await loadDates();
    if (!dates || dates.length === 0) {
      console.log('No dates found in file, fetching from API...');
      dates = await fetchDates();
    }
    
    if (!dates || dates.length === 0) {
      console.error('No dates available to process');
      return;
    }
    
    console.log(`Found ${dates.length} dates to process`);
    
    // Process 5 at a time to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < dates.length; i += batchSize) {
      const batch = dates.slice(i, i + batchSize);
      const promises = batch.map(date => updateDevotion(date));
      
      await Promise.all(promises);
      console.log(`Processed batch ${i/batchSize + 1}/${Math.ceil(dates.length/batchSize)}`);
      
      // Add a small delay between batches
      if (i + batchSize < dates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('Finished updating all devotions');
  } catch (error) {
    console.error('Error updating devotions:', error);
  }
}

// Run the update
updateAllDevotions()
  .then(() => {
    console.log('Update script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Update script failed:', error);
    process.exit(1);
  }); 