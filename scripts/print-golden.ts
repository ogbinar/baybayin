import { transliterate } from '../src/domain';

const cases = [
  ['angelica-primary', 'Angelica', 'andiyelika'],
  ['angelica-alternative', 'Angelica', 'anghelika'],
  ['ana', 'Ana', 'ana'],
  ['maria', 'Maria', 'maria'],
  ['juan', 'Juan', 'diyuan'],
  ['jose', 'Jose', 'diyose'],
  ['pedro', 'Pedro', 'pedro'],
  ['rosa', 'Rosa', 'rosa'],
  ['liza', 'Liza', 'lisa'],
  ['ramon', 'Ramon', 'ramon'],
  ['mark', 'Mark', 'mark'],
  ['anne', 'Anne', 'an'],
  ['carlo', 'Carlo', 'karlo'],
  ['kristine', 'Kristine', 'kristin'],
  ['michelle', 'Michelle', 'misel'],
  ['charles', 'Charles', 'tsarls'],
  ['francisco', 'Francisco', 'pransisko'],
  ['xavier', 'Xavier', 'sabier'],
  ['beatriz', 'Beatriz', 'beatris'],
  ['sofia', 'Sofia', 'sopiya'],
  ['gabriel', 'Gabriel', 'gabriyel'],
  ['raphael', 'Raphael', 'rapayel'],
  ['nicole', 'Nicole', 'nikol'],
  ['patricia', 'Patricia', 'patrisya'],
  ['kathryn', 'Kathryn', 'katrin'],
  ['joshua', 'Joshua', 'diyosuwa'],
  ['victor', 'Victor', 'biktor'],
  ['zoe', 'Zoe', 'soyi'],
  ['gwyneth', 'Gwyneth', 'gwinet'],
  ['chloe', 'Chloe', 'kloyi'],
] as const;

const output = cases.map(([id, name, phonetic]) => {
  const result = transliterate(phonetic, 'pamudpod');
  return {
    id,
    name,
    phonetic,
    syllables: result.analysis.syllables.map((syllable) => syllable.source),
    expectedPamudpod: result.unicode,
    expectedCodePoints: result.tokens.flatMap((token) => token.codePoints),
    reviewStatus: 'technical-fixture',
  };
});

console.log(JSON.stringify(output, null, 2));
