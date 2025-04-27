const BIBLE_API_BASE_URL = 'https://bible-api.com';

export async function getVerse(reference: string) {
  try {
    const response = await fetch(`${BIBLE_API_BASE_URL}/${encodeURIComponent(reference)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch verse');
    }
    const data = await response.json();
    return {
      reference: data.reference,
      text: data.text,
      verses: data.verses,
    };
  } catch (error) {
    console.error('Error fetching verse:', error);
    throw error;
  }
}

export function getTodaysVerse() {
  // This is a placeholder - you'll need to implement your own verse selection logic
  // You could store verses in Firestore or have a predefined list
  return 'Luke 23:26-34';
} 