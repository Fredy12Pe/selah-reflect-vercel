/**
 * Script to update a hymn for a specific month in the Firestore database
 * 
 * USAGE:
 * npm run update-hymn -- --month YYYY-MM --title "Hymn Title" --author "Author Name" --lyricsPath "./path/to/lyrics.txt"
 * 
 * PARAMETERS:
 * --month     Month in YYYY-MM format (e.g. 2023-01 for January 2023)
 * --title     Title of the hymn
 * --author    (Optional) Author of the hymn
 * --lyricsPath Path to a text file containing the hymn lyrics, one line per line
 * 
 * EXAMPLE:
 * npm run update-hymn -- --month 2023-12 --title "Joy to the World" --author "Isaac Watts" --lyricsPath "./hymns/joy-to-the-world.txt"
 * 
 * NOTE:
 * The lyrics file should contain one line of text per line in the file.
 * Each line will be treated as a separate line in the hymn.
 */

import { initAdmin } from '../lib/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';
import { Hymn } from '../lib/types/devotion';
import { z } from 'zod';

// Initialize Firebase
initAdmin();
const db = getFirestore();

// Define a schema for command line arguments validation
const ArgsSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  title: z.string().min(1, 'Title is required'),
  author: z.string().optional(),
  lyricsPath: z.string().min(1, 'Lyrics file path is required'),
});

// Parse and validate arguments
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
    console.log('\nUsage: npm run update-hymn -- --month YYYY-MM --title "Hymn Title" --author "Author Name" --lyricsPath "./path/to/lyrics.txt"');
    process.exit(1);
  }
}

// Read lyrics from file
async function readLyrics(path: string): Promise<string[]> {
  const fs = require('fs');
  try {
    const content = fs.readFileSync(path, 'utf8');
    return content.split('\n').filter((line: string) => line.trim() !== '');
  } catch (error) {
    console.error(`Error reading lyrics file: ${error}`);
    process.exit(1);
  }
}

// Update hymn in the database
async function updateHymn() {
  const args = await parseArgs();
  const lyrics = await readLyrics(args.lyricsPath);
  
  // Get the month name from the YYYY-MM format
  const monthName = new Date(args.month + '-01').toLocaleString('default', { month: 'long' });
  console.log(`Storing hymn for month: ${monthName}`);
  
  const hymnData: Hymn = {
    title: args.title,
    author: args.author || 'Unknown',
    lyrics: lyrics.map((text, index) => ({
      lineNumber: index + 1,
      text,
    })),
    monthId: args.month,
    month: new Date(args.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }),
    updatedAt: new Date().toISOString(),
    updatedBy: 'script',
  };

  try {
    // Store directly in 'hymns' collection using month name as document ID
    const hymnRef = db.collection('hymns').doc(monthName);
    await hymnRef.set(hymnData);
    
    console.log(`Successfully updated hymn "${args.title}" for ${monthName} (${args.month})`);
  } catch (error) {
    console.error('Error updating hymn:', error);
    process.exit(1);
  }
}

// Run the script
updateHymn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 