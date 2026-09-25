import { describe, expect, it } from 'vitest';

import { splitBaybayinClusters } from '../../src/presentation';

describe('Baybayin presentation', () => {
  it('keeps vowel and killer marks attached to their base glyphs', () => {
    expect(splitBaybayinClusters('ᜀᜈ᜕ᜇᜒ')).toEqual(['ᜀ', 'ᜈ᜕', 'ᜇᜒ']);
  });

  it('preserves spaces as vertical layout gaps', () => {
    expect(splitBaybayinClusters('ᜀ ᜃ')).toEqual(['ᜀ', ' ', 'ᜃ']);
  });
});
