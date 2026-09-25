import { describe, expect, it } from 'vitest';

import goldenCases from '../../data/golden-cases.json';
import { transliterate } from '../../src/domain';

describe('technical golden corpus', () => {
  it('contains the frozen minimum of 30 representative cases', () => {
    expect(goldenCases).toHaveLength(30);
  });

  for (const fixture of goldenCases) {
    it(`renders ${fixture.id}`, () => {
      const result = transliterate(fixture.phonetic, 'pamudpod');
      expect(result.analysis.syllables.map((syllable) => syllable.source)).toEqual(
        fixture.syllables,
      );
      expect(result.unicode).toBe(fixture.expectedPamudpod);
    });
  }
});
