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

export interface Meta {
  hymns: { [month: string]: Hymn };
}

export interface DevotionInput {
  date: string;
  bibleText: string;
  reflectionSections: ReflectionSection[];
} 