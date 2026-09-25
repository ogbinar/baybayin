export type TextFlow = 'horizontal' | 'vertical';
export type ImageBackground = 'transparent' | 'paper' | 'forest' | 'terracotta';
export type ColorTheme = 'light' | 'dark';

export const TEXT_FLOWS: Array<{ id: TextFlow; label: string; detail: string }> = [
  { id: 'horizontal', label: 'Horizontal', detail: 'Left to right' },
  { id: 'vertical', label: 'Stacked', detail: 'Design layout' },
];

export const IMAGE_BACKGROUNDS: Array<{
  id: ImageBackground;
  label: string;
  color: string;
  ink: string;
}> = [
  { id: 'transparent', label: 'Transparent', color: 'transparent', ink: '#102c29' },
  { id: 'paper', label: 'Paper', color: '#f1eadc', ink: '#173d38' },
  { id: 'forest', label: 'Forest', color: '#173d38', ink: '#fff8ef' },
  { id: 'terracotta', label: 'Terracotta', color: '#b96346', ink: '#fff8ef' },
];

/** Keeps Baybayin vowel/killer marks attached to their preceding base glyph. */
export function splitBaybayinClusters(value: string): string[] {
  const clusters: string[] = [];
  for (const character of Array.from(value)) {
    if (/\p{Mark}/u.test(character) && clusters.length > 0) {
      clusters[clusters.length - 1] += character;
    } else {
      clusters.push(character);
    }
  }
  return clusters;
}
