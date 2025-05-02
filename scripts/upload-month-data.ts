/**
 * Script to upload monthly devotions and hymn data to Firestore from a JSON file
 * 
 * USAGE:
 * npm run upload-month-data -- --filePath "./path/to/month-data.json"
 * 
 * PARAMETERS:
 * --filePath  Path to the JSON file containing month data
 * 
 * JSON FORMAT:
 * The JSON file should have the following structure:
 * {
 *   "YYYY-MM": {
 *     "month": "January 2023",
 *     "hymn": {
 *       "title": "Hymn Title",
 *       "lyrics": ["Line 1", "Line 2", "..."],
 *       "author": "Author Name"
 *     },
 *     "devotions": [
 *       {
 *         "date": "YYYY-MM-DD",
 *         "bibleText": "Scripture Reference",
 *         "reflectionSections": [
 *           {
 *             "passage": "Optional passage text",
 *             "questions": ["Question 1", "Question 2", "..."]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 * 
 * EXAMPLE:
 * npm run upload-month-data -- --filePath "./data/january-2023.json"
 */

import { initAdmin } from '../lib/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import * as fs from 'fs';
import { MonthData, Hymn } from '../lib/types/devotion';

// Initialize Firebase
initAdmin();
const db = getFirestore();

// Schema for command validation
const ArgsSchema = z.object({
  filePath: z.string().min(1, 'File path is required'),
});

// Parse command line arguments
async function parseArgs() {
  const args = process.argv.slice(2);
  const parsedArgs: Record<string, string> = {};
  
  for (let i = 0; i < args.length; i += 2) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1];
      parsedArgs[key] = value;
    }
  }
  
  try {
    return ArgsSchema.parse(parsedArgs);
  } catch (error) {
    console.error('Invalid arguments:', error);
    console.log('\nUsage: npm run upload-month-data -- --filePath "./path/to/month-data.json"');
    process.exit(1);
  }
}

// Normalize month key format
function normalizeMonthKey(month: string): string {
  // If it's already in YYYY-MM format, return as is
  if (/^\d{4}-\d{2}$/.test(month)) {
    return month;
  }
  
  try {
    // Try to parse month strings like "January 2023"
    const parts = month.split(' ');
    if (parts.length === 2) {
      const monthName = parts[0];
      const year = parts[1];
      
      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
      const normalizedMonth = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;
      
      return `${year}-${normalizedMonth}`;
    }
  } catch (error) {
    console.error(`Error normalizing month key "${month}":`, error);
  }
  
  throw new Error(`Invalid month format: ${month}. Expected "YYYY-MM" or "Month YYYY" format.`);
}

// Process and upload month data
async function uploadMonthData() {
  const args = await parseArgs();
  
  try {
    // Read the file
    const fileContent = fs.readFileSync(args.filePath, 'utf8');
    const data: { [month: string]: MonthData } = JSON.parse(fileContent);
    
    for (const [month, monthData] of Object.entries(data)) {
      console.log(`Processing data for month: ${month}`);
      
      const normalizedMonthKey = normalizeMonthKey(month);
      
      // Process hymn data
      if (monthData.hymn) {
        try {
          console.log(`Processing hymn: ${monthData.hymn.title}`);
          
          // Extract the month name from the month data or parse it from the key
          let monthName = '';
          if (monthData.month && typeof monthData.month === 'string') {
            // Try to extract just the month name (e.g., "January" from "January 2023")
            const parts = monthData.month.split(' ');
            if (parts.length > 0) {
              monthName = parts[0]; // Take the first part which should be the month name
            }
          }
          
          // If no month name was found, try to derive it from the normalized key
          if (!monthName) {
            // Extract the month from YYYY-MM format
            const date = new Date(normalizedMonthKey + '-01');
            monthName = date.toLocaleString('default', { month: 'long' });
          }
          
          console.log(`Using month name "${monthName}" for hymn document ID`);
          
          // Create hymn document with proper structure
          const hymnData: Hymn = {
            title: monthData.hymn.title,
            lyrics: monthData.hymn.lyrics.map((line, index) => ({
              lineNumber: index + 1,
              text: line,
            })),
            author: monthData.hymn.author || 'Unknown',
            monthId: normalizedMonthKey,
            month: monthData.month || month,
            updatedAt: new Date().toISOString(),
            updatedBy: 'script',
          };
          
          // Save hymn directly to hymns collection using month name as ID
          const hymnRef = db.collection('hymns').doc(monthName);
          await hymnRef.set(hymnData);
          
          console.log(`Successfully saved hymn for ${monthName}`);
        } catch (error) {
          console.error(`Error saving hymn for ${normalizedMonthKey}:`, error);
        }
      }
      
      // Process devotions data
      if (monthData.devotions && monthData.devotions.length > 0) {
        console.log(`Processing ${monthData.devotions.length} devotions`);
        
        for (const devotion of monthData.devotions) {
          try {
            const date = devotion.date;
            
            // Skip invalid dates
            if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              console.warn(`Skipping invalid date format: ${date}`);
              continue;
            }
            
            console.log(`Processing devotion for date: ${date}`);
            
            // Create devotion document
            const devotionDoc = {
              bibleText: devotion.bibleText,
              reflectionSections: devotion.reflectionSections || [],
              monthId: normalizedMonthKey,
              month: monthData.month || month,
              updatedAt: new Date().toISOString(),
              updatedBy: 'script',
            };
            
            // Save devotion
            const devotionRef = db.collection('devotions').doc(date);
            await devotionRef.set(devotionDoc, { merge: true });
            
            console.log(`Successfully saved devotion for ${date}`);
          } catch (error) {
            console.error(`Error saving devotion for date ${devotion.date}:`, error);
          }
        }
      }
    }
    
    console.log('Upload completed successfully!');
  } catch (error) {
    console.error('Error uploading month data:', error);
    process.exit(1);
  }
}

// Run the script
uploadMonthData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 