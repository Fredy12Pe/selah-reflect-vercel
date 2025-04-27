import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { getDevotionPDFUrl } from './firebase';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface DevotionContent {
  title: string;
  scripture: string;
  devotion: string;
  prayer: string;
  questions: string[];
}

export async function parsePDF(date: string): Promise<DevotionContent> {
  try {
    // Get the PDF URL from Firebase Storage
    const pdfUrl = await getDevotionPDFUrl(date);
    
    // Load the PDF file from URL
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    
    // Get the first page
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    // Extract text items
    const textItems = textContent.items as TextItem[];
    const text = textItems.map(item => item.str).join(' ');
    
    // Parse the content (this is a basic example - adjust based on your PDF structure)
    const sections = text.split(/(?=Title:|Scripture:|Devotion:|Prayer:|Questions:)/);
    
    const content: DevotionContent = {
      title: extractSection(sections, 'Title:'),
      scripture: extractSection(sections, 'Scripture:'),
      devotion: extractSection(sections, 'Devotion:'),
      prayer: extractSection(sections, 'Prayer:'),
      questions: extractQuestions(sections),
    };
    
    return content;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse devotion PDF');
  }
}

function extractSection(sections: string[], sectionName: string): string {
  const section = sections.find(s => s.trim().startsWith(sectionName));
  return section 
    ? section.replace(sectionName, '').trim()
    : '';
}

function extractQuestions(sections: string[]): string[] {
  const questionsSection = sections.find(s => s.trim().startsWith('Questions:'));
  if (!questionsSection) return [];
  
  return questionsSection
    .replace('Questions:', '')
    .split(/\d+\.|•/)
    .map(q => q.trim())
    .filter(q => q.length > 0);
} 