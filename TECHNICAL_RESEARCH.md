# Technical Research: Baybayin Name Transliteration Site

**Date:** 2026-09-25  
**Status:** Initial implementation recommendation  
**Related:** [VISION.md](./VISION.md)

## Executive recommendation

Build the MVP as a **client-side React + TypeScript application using Vite**.
Implement the authoritative transliteration logic as a small, project-owned,
pure TypeScript library. Bundle a Unicode Baybayin font, produce ordinary
Unicode text for the live result, and use **Satori plus resvg-wasm** for
portable SVG and PNG exports.

Do not make an existing Baybayin package, a general NLP framework, or an LLM
the authority for the output. Existing packages are useful as prior art and
comparison fixtures, but none of the packages reviewed models the full product
problem:

```text
ambiguous written name
    → plausible pronunciations
    → user-confirmed Filipino phonetic form
    → syllable structure
    → documented Baybayin convention
    → explainable Unicode output
```

Python is a useful **research and optional backend path**, especially for
testing Tagalog/English grapheme-to-phoneme tools. It is not necessary for the
first public product. Adding a backend now would increase deployment and API
complexity without improving the deterministic core.

## Why TypeScript is the best first implementation

The MVP is fundamentally an interactive text transformation:

- users edit a short name and pronunciation;
- results should update immediately;
- the deterministic rule set is small enough to run in the browser;
- Unicode text can be copied without a server;
- SVG and PNG can be generated locally;
- no user data needs to leave the device;
- a static build is straightforward to deploy on Dokploy.

A browser-owned engine also makes privacy and responsiveness easy. The app can
remain usable if an optional pronunciation service is unavailable.

Python becomes justified when the product needs one of the following:

- origin-sensitive pronunciation ranking;
- a curated pronunciation database;
- server-side analytics or feedback;
- AI-assisted candidate generation;
- expert-review workflows;
- batch processing or a public API.

## Recommended stack

| Concern | Recommendation | Reason |
|---|---|---|
| Web application | React + TypeScript + Vite | Small interactive app, fast static build, no required server runtime |
| Styling | Plain CSS with design tokens; optionally CSS Modules | Avoid a component-system dependency before the visual language is established |
| Domain engine | Project-owned pure TypeScript package/module | Explainable, deterministic, testable, usable in browser and Node |
| Runtime schemas | Zod | Validate candidate, syllable, convention, and result objects at boundaries |
| Unicode handling | Native `String.normalize()` and `Intl.Segmenter` for grapheme inspection | Avoid splitting base letters from combining signs; do not mistake grapheme segmentation for syllabification |
| Baybayin font | Self-hosted Noto Sans Tagalog under OFL-1.1 | Unicode-based, redistributable web font with broad platform intent |
| SVG generation | Satori with the exact bundled font | Shapes text with HarfBuzz and normally converts glyphs to paths, producing portable SVG |
| PNG generation | `@resvg/resvg-wasm` | Converts generated SVG to PNG in the browser; supports custom fonts |
| Unit tests | Vitest | Uses the same Vite/TypeScript configuration as the application |
| Generative tests | fast-check | Exercises normalization and parser invariants across many generated inputs |
| Browser tests | Playwright | Checks Chromium, Firefox, and WebKit plus mobile viewports |
| Deployment | Multi-stage build; serve `dist/` from Nginx or Caddy | Simple static container suitable for Dokploy |

### Packages worth installing for the MVP

```text
react
react-dom
zod
satori
@resvg/resvg-wasm

dev:
typescript
vite
@vitejs/plugin-react
vitest
fast-check
@testing-library/react
@playwright/test
```

Not every package needs to be installed on day one. The smallest first slice is
React, TypeScript, Vite, Vitest, and the bundled font. Satori and resvg should
be added only when export work begins and should be lazy-loaded so they do not
inflate the initial page load.

## Existing Baybayin libraries reviewed

### `filipino-script-translator` — TypeScript/npm

**Assessment:** useful prior art, unsuitable as the authoritative engine.

The package is MIT-licensed, exposes functions such as `toBaybayin()`, and
supports Baybayin, Buhid, Hanunóo, and Tagbanwa. The npm release inspected was
`0.0.6`, last modified in September 2023.

Its implementation is a short sequence of regular-expression replacements.
That makes it compact, but it also means:

- it accepts an already-spelled Latin form rather than finding pronunciation;
- it produces no syllable or rule trace;
- it cannot represent competing candidates;
- it does not model confidence or user correction;
- it globally collapses `e → i` and `o → u` before rendering;
- it maps `r` through the `da` character in the inspected release;
- it uses U+1714 for killed consonants and exposes no convention choice;
- it has no typed intermediate representation suitable for explanations.

Recommendation: use its examples as comparison cases, not as a runtime
dependency. Reimplement the small amount of applicable behavior with explicit
rule IDs and project-owned tests.

Source: [isaacdarcilla/filipino-script-translator](https://github.com/isaacdarcilla/filipino-script-translator)

### `suyat-translator` — browser JavaScript

**Assessment:** valuable design/reference implementation, not a modern package
foundation.

This BSD-3-Clause project supports bulk and incremental conversion for four
Philippine scripts and documents how it creates base-plus-combining-character
sequences. It has no published releases or package distribution and uses an
older global-script API.

Recommendation: study its incremental editing behavior and Unicode examples.
Do not couple the new application to its global API.

Source: [isawika/suyat-translator](https://github.com/isawika/suyat-translator)

### `tagabaybay-js` — npm

**Assessment:** too small and stale to anchor the product.

The npm metadata inspected reports version `1.0.0`, ISC licensing, and a last
modification in May 2022. Its very small package size suggests another narrow
replacement utility rather than a pronunciation-aware engine.

Recommendation: optional regression comparison only.

### `BaybayinPy` — Python/PyPI

**Assessment:** do not use.

PyPI lists only an alpha `0.1` source release from July 2020, approximately
1.6 kB, with no project description and classifiers for Python versions as old
as 3.4–3.6. It is not evidence of a maintained Python Baybayin ecosystem.

Source: [BaybayinPy on PyPI](https://pypi.org/project/BaybayinPy/)

### `thedoggybrad/baybayin-translator`

**Assessment:** website reference only.

The project is GPL-3.0, builds on another translator, and explicitly says its
accuracy is not guaranteed and that it was not consulted with Baybayin
experts. Using its code would also introduce GPL obligations that are
unnecessary for this project.

Source: [thedoggybrad/baybayin-translator](https://github.com/thedoggybrad/baybayin-translator)

## Python pronunciation and phonology candidates

No reviewed tool solves multilingual proper-name pronunciation reliably.
These tools can supply candidate evidence, but the user must still confirm how
their name is pronounced.

### Epitran

Epitran is the most relevant Python research dependency. It supports
`tgl-Latn` for Tagalog, as well as Cebuano, Ilocano, English, Spanish, and many
other language/script pairs. It turns orthographic text into IPA using mapping,
preprocessing, and postprocessing rules.

Good uses:

- compare a Filipino phonetic spelling with an IPA representation;
- test Tagalog-oriented normalization assumptions;
- prototype origin-specific candidate paths;
- build offline evaluation data.

Limitations for this product:

- the user-entered name may not follow Tagalog orthography;
- selecting `tgl-Latn` already assumes the origin/pronunciation question;
- IPA output still needs a separate mapping into Filipino-friendly syllables;
- it adds Python and native/dependency complexity if placed in production.

Recommendation: use in an offline research notebook or future optional service,
not in the MVP request path.

Source: [dmort27/epitran](https://github.com/dmort27/epitran)

### `g2p-en` and CMU-style English pronunciation

`g2p-en` looks up known English words and predicts out-of-vocabulary
pronunciations. It can generate an English-pronunciation candidate for names
such as “Angelica,” but it cannot know whether the person uses an English,
Spanish, Filipino, or family-specific pronunciation.

Recommendation: possible future candidate generator labeled **English guess**;
never treat it as the final pronunciation.

Source: [Kyubyong/g2p](https://github.com/Kyubyong/g2p)

### Phonemizer/eSpeak NG

Phonemizer provides a Python interface over several phonemization backends,
most notably eSpeak NG. It is valuable for multilingual experiments, but its
quality and supported languages follow the selected backend. Tagalog does not
appear in the current eSpeak NG language list inspected for this research.

Recommendation: useful for origin-specific languages that eSpeak supports,
but not a Tagalog core.

Sources: [Phonemizer documentation](https://bootphon.github.io/phonemizer/),
[eSpeak NG language list](https://github.com/espeak-ng/espeak-ng/blob/master/docs/languages.md)

### NRC `g2p`

The NRC library is a rule-based, index-preserving Python G2P framework that
allows custom mappings and composed transductions. Its preservation of source
and output indices is philosophically aligned with this product's explainable
transformations.

Recommendation: evaluate only if the rule system outgrows a small TypeScript
engine or if an offline linguistic workbench is built. For the MVP, the custom
TypeScript intermediate representation can provide the required trace with far
less infrastructure.

Source: [NRC-ILT/g2p](https://github.com/NRC-ILT/g2p)

### calamanCy and general Tagalog NLP

calamanCy supplies spaCy pipelines for Tagalog tasks such as tokenization,
part-of-speech tagging, dependency parsing, and named-entity recognition. Those
tasks are useful for sentences but do not address single-name pronunciation or
Baybayin rendering.

Recommendation: no MVP role.

Source: [ljvmiranda921/calamanCy](https://github.com/ljvmiranda921/calamanCy)

## Unicode and font findings

Baybayin is encoded under the Unicode block named **Tagalog**, U+1700–U+171F.
Relevant modern characters include:

- U+1700–U+1702: independent vowels;
- U+1703–U+1711: consonant letters;
- U+1712: dependent `i/e` sign;
- U+1713: dependent `u/o` sign;
- U+1714: Tagalog sign virama;
- U+1715: Tagalog sign pamudpod;
- U+170D: modern `ra`;
- U+171F: archaic/Zambales `ra`.

Unicode states that the vowel signs cover `i/e` and `u/o`, and that virama and
pamudpod cancel the inherent `a`; they do not create conjunct consonants.
U+1715 is the Tagalog-specific pamudpod encoded in Unicode 14.0, replacing the
older misuse of the Hanunóo U+1734 character in Tagalog text.

Sources: [Unicode Tagalog names list](https://www.unicode.org/charts/nameslist/n_1700.html),
[Unicode Chapter 17](https://unicode.org/versions/Unicode17.0.0/core-spec/chapter-17/),
[Unicode Tagalog chart](https://www.unicode.org/charts/PDF/U1700.pdf)

### Font recommendation

Bundle **Noto Sans Tagalog** locally and retain its OFL-1.1 license text. Do not
depend on the operating system to supply Baybayin glyphs. System support varies,
and generated images need exactly the same glyph design as the live page.

Before freezing the font, test its exact version for:

- U+170D modern `ra`;
- U+1715 Tagalog pamudpod;
- placement of U+1712/U+1713/U+1714/U+1715 on every consonant;
- consistent shaping in Chromium, Firefox, WebKit, Satori, and resvg;
- exported SVG portability with no installed fonts;
- PNG output at 1×, 2×, and 3× density.

Noto fonts are distributed under the SIL Open Font License. A variable Noto
Sans Tagalog source also exists, but the project should freeze one reviewed
font binary rather than follow a moving upstream asset.

Sources: [Noto license and usage guidance](https://github.com/notofonts/noto-docs/blob/main/docs/website/use.md),
[Noto Sans Tagalog source](https://github.com/ctrlcctrlv/Noto-Sans-Tagalog)

## Proposed domain model

The most important architectural decision is to avoid transforming raw strings
directly into final glyph strings. Use typed intermediate objects.

```ts
type PronunciationCandidate = {
  id: string;
  display: string;          // "Andiyelika"
  normalized: string;       // canonical lowercase form
  source: "curated" | "rule" | "english-g2p" | "user";
  confidence: "high" | "medium" | "low";
  notes: string[];
};

type Syllable = {
  source: string;
  onset: string | null;
  nucleus: "a" | "e" | "i" | "o" | "u";
  coda: string[];
};

type Transformation = {
  ruleId: string;
  inputSpan: [number, number];
  input: string;
  output: string;
  explanation: string;
};

type BaybayinToken = {
  syllableIndex: number;
  baseCodePoint: string;
  vowelSignCodePoint?: string;
  killerCodePoint?: "U+1714" | "U+1715";
  unicode: string;
  ruleIds: string[];
};

type TransliterationResult = {
  candidate: PronunciationCandidate;
  syllables: Syllable[];
  convention: "traditional" | "virama" | "pamudpod";
  tokens: BaybayinToken[];
  unicode: string;
  warnings: string[];
};
```

This design makes explanations, alternative conventions, exports, and tests
derive from one source of truth.

## Engine stages

### 1. Input normalization

- apply Unicode NFC normalization;
- trim and collapse spaces;
- preserve the original display spelling;
- case-fold only the internal working form;
- reject or flag digits, emoji, punctuation, and unsupported scripts;
- recognize multi-character sounds before single letters (`ng`, `dy`, `ts`,
  `sy`, and later reviewed additions).

### 2. Pronunciation candidate generation

Use a layered source order:

1. curated name/pronunciation overrides;
2. explicit user phonetic spelling;
3. conservative, labeled orthographic rules;
4. optional origin-specific G2P suggestions;
5. optional AI suggestion, always requiring confirmation.

The generator should return multiple candidates, not silently select one.

### 3. Filipino phonetic normalization

Convert each confirmed candidate into the engine's intentionally small sound
inventory. Every substitution must create a `Transformation` record. Examples
such as `j → dy`, `f → p`, or `v → b` must be policy choices with visible
alternatives, not universal hidden replacements.

### 4. Syllabification

Write a small Filipino-oriented onset/nucleus/coda parser. Do not use
`Intl.Segmenter`, English hyphenation libraries, or CSS line-breaking as a
syllabifier. Names need explicit handling of vowel sequences, `ng`, consonant
clusters, and inserted-vowel alternatives.

### 5. Baybayin rendering

Render from structured syllables under a named convention:

- base letter with inherent `a`;
- U+1712 for `e/i`;
- U+1713 for `o/u`;
- no final-consonant mark under the traditional comparison;
- U+1714 or U+1715 under the selected modern convention;
- explicit handling of `r` policy and unsupported/borrowed sounds.

### 6. Explanation and export

The UI and exporter consume the same `TransliterationResult`. No exporter
should independently reconstruct spelling rules.

## Testing strategy

This is a rule product, so the test corpus is part of the product.

### Golden examples

Create a reviewed JSON corpus containing:

- original spelling;
- intended pronunciation/phonetic spelling;
- syllables;
- convention;
- exact code-point sequence;
- display output;
- transformation explanations;
- source/reviewer status.

Include Filipino names, common English- and Spanish-origin names, vowel-initial
names, `ng`, consonant clusters, final consonants, `r`, and imported sounds.

### Property tests

Use fast-check to establish invariants such as:

- normalization is idempotent;
- rendering never emits an unapproved code point;
- every combining sign follows a valid base consonant;
- each output token points to at least one input syllable;
- every non-identity substitution has an explanation;
- changing the killer convention changes only final-consonant tokens;
- traditional mode never emits U+1714 or U+1715;
- repeated rendering produces byte-identical Unicode.

### Cross-rendering tests

Playwright should capture a small glyph matrix in Chromium, Firefox, and
WebKit. Compare live HTML, downloaded SVG, and PNG for the same result. Font
and combining-mark behavior is more important here than ordinary layout.

Vitest is Vite-native, fast-check integrates with ordinary JavaScript test
runners, and Playwright covers Chromium, Firefox, and WebKit.

Sources: [Vitest](https://vitest.dev/guide/),
[fast-check](https://fast-check.dev/),
[Playwright browsers](https://playwright.dev/docs/browsers)

## Export recommendation

### Live page

Use ordinary Unicode text with the self-hosted font. This keeps results
selectable, searchable, copyable, and accessible.

### SVG

Use Satori with the frozen Noto Sans Tagalog font supplied as an ArrayBuffer.
Satori uses HarfBuzz for shaping and normally embeds glyph outlines as paths,
which removes the recipient's dependency on having the font installed.

Source: [Satori](https://github.com/vercel/satori)

### PNG

Pass the SVG to `@resvg/resvg-wasm` in the browser. It supports WebAssembly,
custom fonts, scaling, and PNG output.

Source: [resvg-js](https://github.com/thx/resvg-js)

### Why not start with `html-to-image`

DOM screenshot libraries are convenient but depend on browser-specific
`foreignObject`, canvas, and font-loading behavior. They are reasonable for a
rough share image, but a script product needs deterministic glyph output.
Generate the export from structured result data instead of taking a screenshot
of the UI.

## Web framework alternatives

### Next.js

Use when the project genuinely needs server rendering, authenticated accounts,
database-backed pronunciation curation, or server-generated social images.
For the current offline-capable MVP, it adds a server/runtime model without
solving the linguistic work.

**Decision:** defer.

### Astro

Good if the project grows into a large educational/content site with one small
interactive converter island. It is a credible future migration or starting
choice, but React + Vite is simpler while the application itself is the main
experience.

**Decision:** defer unless content/SEO becomes the primary surface.

### Svelte/SvelteKit

Technically suitable and compact, but it offers no special advantage for the
domain engine, Unicode shaping, or export path. React has the broader pool of
compatible rendering and testing examples.

**Decision:** acceptable alternative, not preferred.

### Streamlit, Gradio, or NiceGUI

Useful for a linguistic prototype, but not ideal for the intended polished,
responsive, client-private public experience. Their server dependence and UI
constraints work against this product.

**Decision:** use only for an internal research workbench, if needed.

### FastAPI

FastAPI is the preferred future backend because it works well with typed
Pydantic contracts and produces OpenAPI documentation. It should be added only
when the site has a real server-side responsibility.

Source: [FastAPI type/OpenAPI documentation](https://fastapi.tiangolo.com/python-types/)

## Proposed project structure

```text
/projects/baybayin/
├── VISION.md
├── TECHNICAL_RESEARCH.md
├── package.json
├── public/
│   └── fonts/
│       ├── NotoSansTagalog-Regular.ttf
│       └── OFL.txt
├── src/
│   ├── app/
│   ├── components/
│   ├── domain/
│   │   ├── types.ts
│   │   ├── normalize.ts
│   │   ├── candidates.ts
│   │   ├── syllabify.ts
│   │   ├── render.ts
│   │   ├── explain.ts
│   │   └── rules/
│   ├── export/
│   │   ├── svg.ts
│   │   └── png.ts
│   └── main.tsx
├── data/
│   ├── curated-names.json
│   └── golden-cases.json
├── tests/
│   ├── domain/
│   ├── properties/
│   └── browser/
├── Dockerfile
└── nginx.conf
```

If a Python research layer is later introduced, keep it separate:

```text
research/
├── pyproject.toml
├── notebooks-or-scripts/
└── evaluation-output/
```

Do not let experimental Python pronunciation code become an implicit
production dependency.

## Dokploy deployment shape

The recommended MVP deploys as one static container:

```text
Node build stage
    → vite build
    → copy dist/ into Nginx/Caddy image
    → internal HTTP service
    → Dokploy/Traefik routing
    → external HTTPS handled by the existing external layer
```

No database, API key, or public backend is required. Following the established
Dokploy pattern, the compose service should avoid unnecessary host `ports:`
bindings when internal routing is sufficient.

## Main risks and mitigations

| Risk | Mitigation |
|---|---|
| A technically valid output is linguistically inappropriate | Require pronunciation confirmation and expert-reviewed golden cases |
| A library silently imposes one convention | Own the renderer and name every convention explicitly |
| Combining marks render differently by platform | Self-host one font and test live/SVG/PNG matrices across three engines |
| Proper-name G2P guesses the wrong origin | Label origin-specific candidates and keep manual correction primary |
| AI invents a confident answer | Restrict AI to suggestions; deterministic engine and user choice remain authoritative |
| Export differs from screen | Generate both from one result object and freeze the exact font asset |
| Rules become opaque regex chains | Use structured syllables, rule IDs, traces, and property tests |
| Historical and modern practices are flattened | Separate conventions and have references/rules reviewed before claims are frozen |

## Implementation sequence

1. Freeze a small domain contract and two modern convention choices.
2. Obtain and license-pin the exact font file.
3. Build the deterministic phonetic-syllable-to-Baybayin renderer.
4. Create 30–50 reviewed golden cases before polishing the UI.
5. Add the editable pronunciation and syllable flow.
6. Add the traditional comparison and explanations.
7. Add SVG export, then PNG export.
8. Run the cross-browser glyph matrix.
9. Add conservative name candidate generation.
10. Evaluate Python/AI pronunciation helpers only after the manual path works.

## Final decision

Use **React + TypeScript + Vite** for the site and write a compact,
project-owned transliteration engine. Use existing Baybayin libraries to learn
from and test against, not as unquestioned dependencies. Bundle Noto Sans
Tagalog, make Unicode output primary, and use Satori/resvg only for exports.

Defer FastAPI, Epitran, G2P models, databases, and LLM assistance until a
validated deterministic converter and user-correction experience exist.
