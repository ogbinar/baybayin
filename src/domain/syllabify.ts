import { SUPPORTED_CONSONANTS, VOWELS } from './characters';
import { adaptToFilipino } from './normalize';
import type { PhraseAnalysis, PhrasePart, Syllable, WordAnalysis } from './types';

const ALLOWED_ONSET_CLUSTERS = new Set([
  'kw',
  'gw',
  'kr',
  'gr',
  'pr',
  'br',
  'tr',
  'dr',
  'kl',
  'gl',
  'pl',
  'bl',
  'sw',
  'tw',
  'dy',
  'ty',
  'sy',
  'ny',
]);

function tokenizeWord(word: string): string[] {
  const tokens: string[] = [];
  let index = 0;
  while (index < word.length) {
    if (word.slice(index, index + 2) === 'ng') {
      tokens.push('ng');
      index += 2;
      continue;
    }
    tokens.push(word[index]);
    index += 1;
  }
  return tokens;
}

function onsetSuffixLength(cluster: string[]): number {
  if (cluster.length === 0) return 0;
  if (cluster.length === 1) return 1;
  const finalPair = cluster.slice(-2).join('');
  return ALLOWED_ONSET_CLUSTERS.has(finalPair) ? 2 : 1;
}

function syllabifyWord(
  word: string,
  wordIndex: number,
  initialSyllableIndex: number,
): Syllable[] {
  const tokens = tokenizeWord(word);
  for (const token of tokens) {
    if (!VOWELS.has(token) && !SUPPORTED_CONSONANTS.has(token)) {
      throw new Error(`The sound “${token}” is not supported yet. Edit the phonetic spelling.`);
    }
  }

  const vowelPositions = tokens
    .map((token, index) => (VOWELS.has(token) ? index : -1))
    .filter((index) => index >= 0);

  if (vowelPositions.length === 0) {
    throw new Error(`“${word}” needs at least one written vowel in its phonetic form.`);
  }

  const syllables: Syllable[] = [];
  let pendingOnset = tokens.slice(0, vowelPositions[0]);

  vowelPositions.forEach((vowelPosition, vowelOrder) => {
    const nextVowelPosition = vowelPositions[vowelOrder + 1];
    const between = tokens.slice(vowelPosition + 1, nextVowelPosition ?? tokens.length);
    let coda: string[];
    let nextOnset: string[];

    if (nextVowelPosition === undefined) {
      coda = between;
      nextOnset = [];
    } else {
      const suffixLength = onsetSuffixLength(between);
      coda = between.slice(0, between.length - suffixLength);
      nextOnset = suffixLength ? between.slice(-suffixLength) : [];
    }

    const nucleus = tokens[vowelPosition] as Syllable['nucleus'];
    const source = [...pendingOnset, nucleus, ...coda].join('');
    syllables.push({
      index: initialSyllableIndex + syllables.length,
      wordIndex,
      source,
      onset: pendingOnset,
      nucleus,
      coda,
    });
    pendingOnset = nextOnset;
  });

  return syllables;
}

export function analyzePhonetic(input: string): PhraseAnalysis {
  const adapted = adaptToFilipino(input);
  const segments = adapted.value.split(/([ '\-]+)/).filter(Boolean);
  const parts: PhrasePart[] = [];
  const allSyllables: Syllable[] = [];
  let wordIndex = 0;

  for (const segment of segments) {
    if (/^[ '\-]+$/.test(segment)) {
      parts.push({ kind: 'separator', source: segment });
      continue;
    }

    const syllables = syllabifyWord(segment, wordIndex, allSyllables.length);
    const word: WordAnalysis = {
      kind: 'word',
      wordIndex,
      source: segment,
      syllables,
    };
    parts.push(word);
    allSyllables.push(...syllables);
    wordIndex += 1;
  }

  if (allSyllables.length === 0) {
    throw new Error('Enter a phonetic spelling with at least one vowel.');
  }

  return {
    input,
    normalized: adapted.value,
    adaptations: adapted.adaptations,
    parts,
    syllables: allSyllables,
  };
}

