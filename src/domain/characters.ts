import type { Convention } from './types';

export const INDEPENDENT_VOWELS = {
  a: '\u1700',
  e: '\u1701',
  i: '\u1701',
  o: '\u1702',
  u: '\u1702',
} as const;

export const CONSONANTS = {
  k: '\u1703',
  g: '\u1704',
  ng: '\u1705',
  t: '\u1706',
  d: '\u1707',
  n: '\u1708',
  p: '\u1709',
  b: '\u170a',
  m: '\u170b',
  y: '\u170c',
  r: '\u170d',
  l: '\u170e',
  w: '\u170f',
  s: '\u1710',
  h: '\u1711',
} as const;

export const VOWEL_SIGNS = {
  a: '',
  e: '\u1712',
  i: '\u1712',
  o: '\u1713',
  u: '\u1713',
} as const;

export const KILLERS: Record<Exclude<Convention, 'traditional'>, string> = {
  virama: '\u1714',
  pamudpod: '\u1715',
};

export const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
export const SUPPORTED_CONSONANTS = new Set(Object.keys(CONSONANTS));

export function codePoints(value: string): string[] {
  return Array.from(value, (character) =>
    `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`,
  );
}

