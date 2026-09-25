import {
  CONSONANTS,
  INDEPENDENT_VOWELS,
  KILLERS,
  VOWEL_SIGNS,
  codePoints,
} from './characters';
import { analyzePhonetic } from './syllabify';
import type {
  Convention,
  GlyphToken,
  PhraseAnalysis,
  Syllable,
  SyllableRendering,
  TransliterationResult,
} from './types';

function consonantGlyph(sound: string): string {
  const glyph = CONSONANTS[sound as keyof typeof CONSONANTS];
  if (!glyph) throw new Error(`No Baybayin consonant mapping exists for “${sound}”.`);
  return glyph;
}

function token(
  syllable: Syllable,
  source: string,
  unicode: string,
  role: GlyphToken['role'],
  explanation: string,
): GlyphToken {
  return {
    syllableIndex: syllable.index,
    source,
    unicode,
    codePoints: codePoints(unicode),
    role,
    explanation,
  };
}

function renderSyllable(syllable: Syllable, convention: Convention): SyllableRendering {
  const tokens: GlyphToken[] = [];
  const modern = convention !== 'traditional';
  const killer = modern ? KILLERS[convention] : '';

  if (syllable.onset.length === 0) {
    const unicode = INDEPENDENT_VOWELS[syllable.nucleus];
    tokens.push(
      token(
        syllable,
        syllable.nucleus,
        unicode,
        'independent-vowel',
        `The pantig begins with “${syllable.nucleus}”, so it uses an independent vowel character.`,
      ),
    );
  } else {
    const precedingOnsets = syllable.onset.slice(0, -1);
    const vowelOnset = syllable.onset.at(-1)!;

    for (const sound of precedingOnsets) {
      const unicode = modern ? consonantGlyph(sound) + killer : consonantGlyph(sound);
      tokens.push(
        token(
          syllable,
          sound,
          unicode,
          'cluster',
          modern
            ? `“${sound}” begins a consonant cluster, so the mark removes its built-in “a” sound.`
            : `Traditional-style writing keeps the built-in “a” sound on clustered “${sound}”.`,
        ),
      );
    }

    const unicode = consonantGlyph(vowelOnset) + VOWEL_SIGNS[syllable.nucleus];
    tokens.push(
      token(
        syllable,
        `${vowelOnset}${syllable.nucleus}`,
        unicode,
        'onset',
        syllable.nucleus === 'a'
          ? `“${vowelOnset}” keeps its built-in “a” sound.`
          : `“${vowelOnset}” takes the shared ${syllable.nucleus === 'e' || syllable.nucleus === 'i' ? 'e/i' : 'o/u'} vowel mark.`,
      ),
    );
  }

  if (modern) {
    for (const sound of syllable.coda) {
      const unicode = consonantGlyph(sound) + killer;
      tokens.push(
        token(
          syllable,
          sound,
          unicode,
          'coda',
          `Final “${sound}” uses the ${convention === 'pamudpod' ? 'pamudpod' : 'virama'} to remove its built-in “a” sound.`,
        ),
      );
    }
  }

  const unicode = tokens.map((item) => item.unicode).join('');
  const explanation =
    convention === 'traditional' && syllable.coda.length
      ? `${syllable.source}: final ${syllable.coda.join('')} is omitted in this traditional-style comparison.`
      : tokens.map((item) => item.explanation).join(' ');

  return { syllable, unicode, tokens, explanation };
}

export function renderAnalysis(
  analysis: PhraseAnalysis,
  convention: Convention = 'pamudpod',
): TransliterationResult {
  const renderingBySyllable = new Map<number, SyllableRendering>();
  for (const syllable of analysis.syllables) {
    renderingBySyllable.set(syllable.index, renderSyllable(syllable, convention));
  }

  const unicode = analysis.parts
    .map((part) => {
      if (part.kind === 'separator') return part.source;
      return part.syllables.map((syllable) => renderingBySyllable.get(syllable.index)!.unicode).join('');
    })
    .join('');

  const renderings = analysis.syllables.map((syllable) => renderingBySyllable.get(syllable.index)!);
  const warnings: string[] = [];
  if (analysis.adaptations.length) {
    warnings.push('Some sounds were changed to ones Pantig can write. Check the bigkas before using this result.');
  }
  if (convention === 'traditional') {
    warnings.push('Traditional-style writing can omit final consonants and make clusters ambiguous.');
  }

  return {
    convention,
    input: analysis.input,
    normalized: analysis.normalized,
    unicode,
    analysis,
    renderings,
    tokens: renderings.flatMap((rendering) => rendering.tokens),
    warnings,
  };
}

export function transliterate(
  phonetic: string,
  convention: Convention = 'pamudpod',
): TransliterationResult {
  return renderAnalysis(analyzePhonetic(phonetic), convention);
}
