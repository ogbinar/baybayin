import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { adaptToFilipino, transliterate } from '../../src/domain';

const supportedWord = fc
  .array(fc.constantFrom('a', 'e', 'i', 'o', 'u', 'k', 'g', 't', 'd', 'n', 'p', 'b', 'm', 'y', 'r', 'l', 'w', 's', 'h'), {
    minLength: 1,
    maxLength: 24,
  })
  .filter((letters) => letters.some((letter) => 'aeiou'.includes(letter)))
  .map((letters) => letters.join(''));

describe('engine properties', () => {
  it('normalization is idempotent', () => {
    fc.assert(
      fc.property(supportedWord, (word) => {
        const once = adaptToFilipino(word).value;
        const twice = adaptToFilipino(once).value;
        expect(twice).toBe(once);
      }),
    );
  });

  it('traditional mode never emits a killer', () => {
    fc.assert(
      fc.property(supportedWord, (word) => {
        expect(transliterate(word, 'traditional').unicode).not.toMatch(/[᜔᜕]/u);
      }),
    );
  });

  it('modern conventions differ only by killer character', () => {
    fc.assert(
      fc.property(supportedWord, (word) => {
        const pamudpod = transliterate(word, 'pamudpod').unicode;
        const virama = transliterate(word, 'virama').unicode;
        expect(pamudpod.replaceAll('᜕', '᜔')).toBe(virama);
      }),
    );
  });

  it('produces deterministic byte-identical output', () => {
    fc.assert(
      fc.property(supportedWord, (word) => {
        expect(transliterate(word).unicode).toBe(transliterate(word).unicode);
      }),
    );
  });
});
