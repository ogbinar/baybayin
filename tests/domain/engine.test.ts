import { describe, expect, it } from 'vitest';

import {
  analyzePhonetic,
  getPronunciationCandidates,
  transliterate,
} from '../../src/domain';

describe('pronunciation candidates', () => {
  it('offers pronunciation-aware Michel interpretations', () => {
    const result = getPronunciationCandidates('Michel');
    expect(result.validation.ok).toBe(true);
    expect(result.candidates.map((candidate) => candidate.phonetic)).toEqual([
      'misyel',
      'mikel',
    ]);
    expect(result.candidates[0].recommended).toBe(true);
  });

  it('offers the two frozen Angelica interpretations', () => {
    const result = getPronunciationCandidates('Angelica');
    expect(result.validation.ok).toBe(true);
    expect(result.candidates.map((candidate) => candidate.phonetic)).toEqual([
      'andiyelika',
      'anghelika',
    ]);
    expect(result.candidates[0].recommended).toBe(true);
  });

  it('adapts unsupported imported sounds visibly', () => {
    const result = getPronunciationCandidates('Javier');
    expect(result.candidates[0].phonetic).toBe('diyabier');
    expect(result.candidates[0].adaptations.map((item) => item.ruleId)).toEqual([
      'j-to-diy',
      'v-to-b',
    ]);
  });
});

describe('syllabification', () => {
  it('splits the primary example by Filipino-oriented sound units', () => {
    const analysis = analyzePhonetic('andiyelika');
    expect(analysis.syllables.map((syllable) => syllable.source)).toEqual([
      'an',
      'di',
      'ye',
      'li',
      'ka',
    ]);
  });

  it('treats ng as a single consonant', () => {
    const analysis = analyzePhonetic('anghelika');
    expect(analysis.syllables.map((syllable) => syllable.source)).toEqual([
      'ang',
      'he',
      'li',
      'ka',
    ]);
    expect(analysis.syllables[0].coda).toEqual(['ng']);
  });

  it('preserves separators between name parts', () => {
    const result = transliterate("maria-clara", 'pamudpod');
    expect(result.unicode).toContain('-');
    expect(result.analysis.parts.filter((part) => part.kind === 'word')).toHaveLength(2);
  });
});

describe('Baybayin rendering', () => {
  it('renders Andiyelika with Tagalog pamudpod by default', () => {
    expect(transliterate('andiyelika').unicode).toBe('ᜀᜈ᜕ᜇᜒᜌᜒᜎᜒᜃ');
  });

  it('renders Anghelika as a distinct result', () => {
    expect(transliterate('anghelika').unicode).toBe('ᜀᜅ᜕ᜑᜒᜎᜒᜃ');
  });

  it('switches only the killer between modern conventions', () => {
    const pamudpod = transliterate('mark', 'pamudpod');
    const virama = transliterate('mark', 'virama');
    expect(pamudpod.unicode).toBe('ᜋᜍ᜕ᜃ᜕');
    expect(virama.unicode).toBe('ᜋᜍ᜔ᜃ᜔');
    expect(pamudpod.unicode.replaceAll('᜕', '᜔')).toBe(virama.unicode);
  });

  it('omits final consonants in traditional-style comparison', () => {
    const result = transliterate('andiyelika', 'traditional');
    expect(result.unicode).toBe('ᜀᜇᜒᜌᜒᜎᜒᜃ');
    expect(result.unicode).not.toMatch(/[᜔᜕]/u);
    expect(result.warnings.join(' ')).toMatch(/ambiguous/i);
  });

  it('shares signs for e/i and o/u as required by the script', () => {
    expect(transliterate('ke').unicode).toBe(transliterate('ki').unicode);
    expect(transliterate('ko').unicode).toBe(transliterate('ku').unicode);
  });
});
