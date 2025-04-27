interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
}

interface BiblePassage {
  reference: string;
  content: string;
  translation: string;
}

interface BibleBook {
  id: string;
  name: string;
  nameLong: string;
  chapters: Array<{
    id: string;
    number: string;
    reference: string;
  }>;
}

interface BibleChapter {
  id: string;
  reference: string;
  content: string;
  verses: Array<{
    id: string;
    reference: string;
  }>;
}

const API_KEY = process.env.NEXT_PUBLIC_BIBLE_API_KEY;
const BASE_URL = 'https://api.scripture.api.bible/v1';

// Common translations and their IDs
export const TRANSLATIONS = {
  ESV: '9879dbb7cfe39e4d-01', // English Standard Version
  KJV: 'de4e12af7f28f599-02', // King James Version
  NIV: '78a9f6124f344018-01', // New International Version
  NLT: '65eec8e0b60e656b-01', // New Living Translation
  NASB: '8052bc3a4c3d5349-01', // New American Standard Bible
  CSB: '06125adad2d5898a-01', // Christian Standard Bible
} as const;

// Default to ESV translation
const DEFAULT_BIBLE_ID = TRANSLATIONS.ESV;

// Get list of available translations
export async function getBibleTranslations(): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/bibles`, {
      headers: {
        'api-key': API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Bible translations');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching Bible translations:', error);
    throw error;
  }
}

// Get list of books for a specific translation
export async function getBooks(bibleId: string = DEFAULT_BIBLE_ID): Promise<BibleBook[]> {
  try {
    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/books`, {
      headers: {
        'api-key': API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch books');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
}

// Get a specific chapter
export async function getChapter(chapterId: string, bibleId: string = DEFAULT_BIBLE_ID): Promise<BibleChapter> {
  try {
    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/chapters/${chapterId}`, {
      headers: {
        'api-key': API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chapter');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching chapter:', error);
    throw error;
  }
}

// Get a specific verse
export async function getVerse(reference: string, bibleId: string = DEFAULT_BIBLE_ID): Promise<BibleVerse> {
  try {
    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/verses/${reference}`, {
      headers: {
        'api-key': API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch verse');
    }

    const data = await response.json();
    return {
      reference: data.data.reference,
      text: data.data.content,
      translation: data.data.bibleId,
    };
  } catch (error) {
    console.error('Error fetching verse:', error);
    throw error;
  }
}

// Get a passage (multiple verses)
export async function getPassage(reference: string, bibleId: string = DEFAULT_BIBLE_ID): Promise<BiblePassage> {
  try {
    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/passages/${reference}`, {
      headers: {
        'api-key': API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch passage');
    }

    const data = await response.json();
    return {
      reference: data.data.reference,
      content: data.data.content,
      translation: data.data.bibleId,
    };
  } catch (error) {
    console.error('Error fetching passage:', error);
    throw error;
  }
}

// Search the Bible
export async function searchBible(query: string, bibleId: string = DEFAULT_BIBLE_ID): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'api-key': API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search Bible');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error searching Bible:', error);
    throw error;
  }
}

// Available translations in bible-api.com
export const AVAILABLE_TRANSLATIONS = {
  kjv: 'King James Version',
  web: 'World English Bible',
  clementine: 'Clementine Latin Vulgate',
  almeida: 'João Ferreira de Almeida',
  rccv: 'Romanian Corrected Cornilescu Version'
}; 