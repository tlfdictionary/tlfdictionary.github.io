
export interface Meaning {
  partOfSpeech: string;
  definition: string;
  example?: string;
}

export interface JargonTerm {
  id: string;
  term: string;
  pronunciation?: string;
  meanings: Meaning[];
  category: string;
  tags: string[];
  createdAt: number;
  isAiGenerated?: boolean;
}

export interface DictionaryData {
  terms: JargonTerm[];
  categories: string[];
}
