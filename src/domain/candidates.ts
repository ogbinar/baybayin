import { adaptToFilipino, titleCaseName, validateNameInput } from './normalize';
import type { PronunciationCandidate, ValidationResult } from './types';

type CuratedEntry = Omit<PronunciationCandidate, 'id' | 'source' | 'adaptations'>;

const CURATED_NAMES: Record<string, CuratedEntry[]> = {
  michel: [
    {
      display: 'Misyel',
      phonetic: 'misyel',
      label: '“mi-SYEL” pronunciation',
      confidence: 'medium',
      recommended: true,
      notes: ['Uses “sy” as the nearest supported sound for “sh”.'],
    },
    {
      display: 'Mikel',
      phonetic: 'mikel',
      label: '“MI-kel” alternative',
      confidence: 'medium',
      recommended: false,
      notes: ['Choose this if you pronounce the middle sound as a hard “k”.'],
    },
  ],
  angelica: [
    {
      display: 'Andiyelika',
      phonetic: 'andiyelika',
      label: '“an-di-ye-LI-ka” pronunciation',
      confidence: 'high',
      recommended: true,
      notes: ['Writes the “j” sound as the supported sequence “diy”.'],
    },
    {
      display: 'Anghelika',
      phonetic: 'anghelika',
      label: '“ang-he-LI-ka” alternative',
      confidence: 'medium',
      recommended: false,
      notes: ['Choose this only if your name begins with an “ang-he” sound.'],
    },
  ],
};

export function getPronunciationCandidates(input: string): {
  validation: ValidationResult;
  candidates: PronunciationCandidate[];
} {
  const validation = validateNameInput(input);
  if (!validation.ok) {
    return { validation, candidates: [] };
  }

  const key = validation.value.toLocaleLowerCase('en').normalize('NFD').replace(/\p{M}+/gu, '');
  const curated = CURATED_NAMES[key];
  if (curated) {
    return {
      validation,
      candidates: curated.map((candidate, index) => ({
        ...candidate,
        id: `curated-${key}-${index}`,
        source: 'curated' as const,
        adaptations: [],
      })),
    };
  }

  const adapted = adaptToFilipino(validation.value);
  const changed = adapted.value !== validation.value.toLocaleLowerCase('en');
  const candidate: PronunciationCandidate = {
    id: `rule-${adapted.value}`,
    display: titleCaseName(adapted.value),
    phonetic: adapted.value,
    label: changed ? 'Suggested sound match' : 'As written',
    source: 'rule',
    confidence: changed ? 'medium' : 'high',
    recommended: true,
    notes: changed
      ? ['Check this suggestion and edit it if it does not match how you say your name.']
      : ['This spelling already uses sounds Pantig can write directly.'],
    adaptations: adapted.adaptations,
  };

  return { validation, candidates: [candidate] };
}
