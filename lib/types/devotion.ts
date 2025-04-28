export interface ReflectionSection {
  questions: string[];
}

export interface Devotion {
  id: string;
  date: string;
  bibleText: string;
  reflectionSections: ReflectionSection[];
  monthId?: string;
  month?: string;
  updatedAt?: string;
  updatedBy?: string;
  notFound?: boolean;
  // Legacy fields for backward compatibility
  scriptureReference?: string;
  scriptureText?: string;
  title?: string;
  content?: string;
  prayer?: string;
  reflectionQuestions?: string[];
}

export interface Hymn {
  title: string;
  lyrics: Array<{ lineNumber: number; text: string }>;
  author?: string;
  monthId?: string;
  month?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface MonthData {
  month: string;
  hymn: {
    title: string;
    lyrics: string[];
    author?: string;
  };
  devotions: Array<{
    date: string;
    bibleText: string;
    reflectionSections: Array<{
      questions: string[];
    }>;
  }>;
}

export interface Meta {
  hymns: { [month: string]: Hymn };
}

export interface DevotionInput {
  date: string;
  bibleText: string;
  reflectionSections: ReflectionSection[];
}

export interface UploadData {
  [month: string]: MonthData;
} 