export interface ReflectionSection {
  passage: string;
  questions: string[];
}

export interface Devotion {
  id?: string;
  date: string;
  bibleText: string;
  reflectionSections: ReflectionSection[];
  title?: string; 
  scriptureReference?: string;
  scriptureText?: string;
  content?: string;
  prayer?: string;
  reflectionQuestions?: string[];
}

export interface DevotionInput extends Omit<Devotion, 'id'> {
  date: string;
  title: string;
  scriptureReference: string;
  scriptureText: string;
  content: string;
  prayer: string;
  reflectionQuestions: string[];
}

export interface Hymn {
  title: string;
  hymnTitle?: string;
  lyrics: string[] | string;
  author?: string;
  composer?: string;
  year?: number;
}

export interface Meta {
  lastUpdated: string;
  totalDevotions: number;
  currentHymn: Hymn;
  hymns?: { [month: string]: Hymn };
}

export interface DevotionData {
  meta: Meta;
  devotions: {
    [date: string]: Devotion;
  };
} 