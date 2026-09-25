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
      notes: ['Uses “sy” as a Baybayin-compatible approximation of the “sh” sound.'],
    },
    {
      display: 'Mikel',
      phonetic: 'mikel',
      label: '“MI-kel” alternative',
      confidence: 'medium',
      recommended: false,
      notes: ['Choose this only when the middle consonant is pronounced as a hard “k”.'],
    },
  ],
  angelica: [
    {
      display: 'Andiyelika',
      phonetic: 'andiyelika',
      label: 'Sound-faithful Filipino form',
      confidence: 'high',
      recommended: true,
      notes: ['Expands the English “j” sound into explicit Filipino syllables.'],
    },
    {
      display: 'Anghelika',
      phonetic: 'anghelika',
      label: 'Localized alternative',
      confidence: 'medium',
      recommended: false,
      notes: ['Uses an “ang-he” opening and therefore represents a different pronunciation.'],
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
    label: changed ? 'Filipino sound approximation' : 'As written',
    source: 'rule',
    confidence: changed ? 'medium' : 'high',
    recommended: true,
    notes: changed
      ? ['Check this suggestion and edit it if it does not match how you say your name.']
      : ['The spelling already uses sounds supported by the current engine.'],
    adaptations: adapted.adaptations,
  };

  return { validation, candidates: [candidate] };
}
