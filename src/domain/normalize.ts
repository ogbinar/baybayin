import type { Adaptation, ValidationResult } from './types';

const MAX_NAME_LENGTH = 80;

type ReplacementRule = {
  id: string;
  pattern: RegExp;
  replacement: string;
  explanation: string;
};

const REPLACEMENT_RULES: ReplacementRule[] = [
  {
    id: 'qu-to-kw',
    pattern: /qu/g,
    replacement: 'kw',
    explanation: '“qu” was written as the sound “kw”.',
  },
  {
    id: 'ph-to-p',
    pattern: /ph/g,
    replacement: 'p',
    explanation: '“ph” was matched to the supported “p” sound.',
  },
  {
    id: 'ch-to-ts',
    pattern: /ch/g,
    replacement: 'ts',
    explanation: '“ch” was matched to the sound “ts”.',
  },
  {
    id: 'sh-to-siy',
    pattern: /sh/g,
    replacement: 'siy',
    explanation: '“sh” was matched to the supported sequence “siy”.',
  },
  {
    id: 'soft-g-to-diy',
    pattern: /g(?=[eiy])/g,
    replacement: 'diy',
    explanation: 'Soft “g” was matched to the supported sequence “diy”.',
  },
  {
    id: 'j-to-diy',
    pattern: /j/g,
    replacement: 'diy',
    explanation: '“j” was matched to the supported sequence “diy”.',
  },
  {
    id: 'soft-c-to-s',
    pattern: /c(?=[eiy])/g,
    replacement: 's',
    explanation: 'Soft “c” was matched to the sound “s”.',
  },
  {
    id: 'hard-c-to-k',
    pattern: /c/g,
    replacement: 'k',
    explanation: 'Hard “c” was matched to the sound “k”.',
  },
  {
    id: 'f-to-p',
    pattern: /f/g,
    replacement: 'p',
    explanation: '“f” was matched to the closest supported sound, “p”.',
  },
  {
    id: 'v-to-b',
    pattern: /v/g,
    replacement: 'b',
    explanation: '“v” was matched to the closest supported sound, “b”.',
  },
  {
    id: 'z-to-s',
    pattern: /z/g,
    replacement: 's',
    explanation: '“z” was matched to the closest supported sound, “s”.',
  },
  {
    id: 'x-to-ks',
    pattern: /x/g,
    replacement: 'ks',
    explanation: '“x” was written as the sound sequence “ks”.',
  },
  {
    id: 'q-to-k',
    pattern: /q/g,
    replacement: 'k',
    explanation: '“q” was matched to the sound “k”.',
  },
];

export function validateNameInput(input: string): ValidationResult {
  const value = input.trim();
  if (!value) {
    return { ok: false, message: 'Enter a name to begin.' };
  }
  if (value.length > MAX_NAME_LENGTH) {
    return { ok: false, message: `Keep the name under ${MAX_NAME_LENGTH} characters.` };
  }
  if (!/^[\p{Script=Latin}\p{M} '\-’]+$/u.test(value)) {
    return {
      ok: false,
      message: 'Use Latin letters, spaces, hyphens, or apostrophes for this version.',
    };
  }
  return { ok: true, value };
}

export function adaptToFilipino(input: string): {
  value: string;
  adaptations: Adaptation[];
} {
  const adaptations: Adaptation[] = [];
  let value = input.trim().toLocaleLowerCase('en');

  const apostropheNormalized = value.replace(/[’]/g, "'");
  if (apostropheNormalized !== value) {
    adaptations.push({
      ruleId: 'normalize-apostrophe',
      before: value,
      after: apostropheNormalized,
      explanation: 'The apostrophe style was simplified before writing the name.',
    });
    value = apostropheNormalized;
  }

  const enyeNormalized = value.replace(/ñ/g, 'ny');
  if (enyeNormalized !== value) {
    adaptations.push({
      ruleId: 'enye-to-ny',
      before: value,
      after: enyeNormalized,
      explanation: '“ñ” was written as the supported sequence “ny”.',
    });
    value = enyeNormalized;
  }

  const accentsNormalized = value.normalize('NFD').replace(/\p{M}+/gu, '').normalize('NFC');
  if (accentsNormalized !== value) {
    adaptations.push({
      ruleId: 'normalize-diacritics',
      before: value,
      after: accentsNormalized,
      explanation: 'Accent marks were removed before matching the sounds.',
    });
    value = accentsNormalized;
  }

  for (const rule of REPLACEMENT_RULES) {
    const next = value.replace(rule.pattern, rule.replacement);
    if (next !== value) {
      adaptations.push({
        ruleId: rule.id,
        before: value,
        after: next,
        explanation: rule.explanation,
      });
      value = next;
    }
  }

  value = value.replace(/\s+/g, ' ');
  return { value, adaptations };
}

export function titleCaseName(value: string): string {
  return value.replace(/(^|[ '\-])([a-z])/g, (_, separator: string, letter: string) =>
    `${separator}${letter.toUpperCase()}`,
  );
}
