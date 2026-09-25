export type Convention = 'pamudpod' | 'virama' | 'traditional';

export type CandidateSource = 'curated' | 'rule' | 'user';

export type Confidence = 'high' | 'medium' | 'low';

export type Adaptation = {
  ruleId: string;
  before: string;
  after: string;
  explanation: string;
};

export type PronunciationCandidate = {
  id: string;
  display: string;
  phonetic: string;
  label: string;
  source: CandidateSource;
  confidence: Confidence;
  recommended: boolean;
  notes: string[];
  adaptations: Adaptation[];
};

export type Syllable = {
  index: number;
  wordIndex: number;
  source: string;
  onset: string[];
  nucleus: 'a' | 'e' | 'i' | 'o' | 'u';
  coda: string[];
};

export type WordAnalysis = {
  kind: 'word';
  wordIndex: number;
  source: string;
  syllables: Syllable[];
};

export type SeparatorAnalysis = {
  kind: 'separator';
  source: string;
};

export type PhrasePart = WordAnalysis | SeparatorAnalysis;

export type PhraseAnalysis = {
  input: string;
  normalized: string;
  adaptations: Adaptation[];
  parts: PhrasePart[];
  syllables: Syllable[];
};

export type GlyphToken = {
  syllableIndex: number;
  source: string;
  unicode: string;
  codePoints: string[];
  role: 'independent-vowel' | 'onset' | 'cluster' | 'coda';
  explanation: string;
};

export type SyllableRendering = {
  syllable: Syllable;
  unicode: string;
  tokens: GlyphToken[];
  explanation: string;
};

export type TransliterationResult = {
  convention: Convention;
  input: string;
  normalized: string;
  unicode: string;
  analysis: PhraseAnalysis;
  renderings: SyllableRendering[];
  tokens: GlyphToken[];
  warnings: string[];
};

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

