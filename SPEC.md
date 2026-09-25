# Pantig MVP Specification

**Status:** Frozen for implementation  
**Date:** 2026-09-25  
**Product name:** Pantig (working public name)

## Product contract

Pantig helps a person represent a name in Baybayin from its intended
pronunciation. It is an explainable transliterator, not a meaning translator
and not an authority that declares one universal spelling.

The primary flow is:

```text
name → recommended pronunciation → immediate Baybayin result
     → inline pronunciation correction → explanation/export
```

Pantig must label the pronunciation it used and let the user correct it inline.
The immediate result is a best-effort suggestion, not confirmation of the
person's actual pronunciation or one official spelling.

## V1 boundaries

- One name per conversion; spaces, hyphens, and apostrophes are allowed.
- Latin-script input only, with common diacritics normalized where safe.
- Maximum input length: 80 characters.
- Conversion runs entirely in the browser.
- No accounts, database, analytics, backend, AI, audio, sentence translation,
  community voting, or tattoo guarantee.
- Candidate suggestions come from curated overrides and deterministic rules.

Unsupported characters remain visible in an actionable validation message and
are never silently discarded.

## Writing conventions

### Default: modern pamudpod

- Use U+1715 TAGALOG SIGN PAMUDPOD to cancel the inherent `a` on final or
  clustered consonants.
- Use U+170D TAGALOG LETTER RA for modern `r`.
- Use U+1712 for both `e` and `i`.
- Use U+1713 for both `o` and `u`.

### Alternative: cross virama

Use U+1714 TAGALOG SIGN VIRAMA instead of U+1715. All other mappings are
identical to the default modern result.

### Comparison: traditional-style

- Do not emit U+1714 or U+1715.
- Omit coda consonants that require a killer.
- For an onset cluster, retain its consonant letters without a killer, which
  exposes the historical ambiguity/inherent-vowel consequence.
- Label this output as an educational comparison, not a precise modern name
  spelling.

## Supported sound inventory

The deterministic renderer accepts these normalized consonants:

```text
k g ng t d n p b m y r l w s h
```

and these vowels:

```text
a e i o u
```

The candidate normalizer applies visible, traceable adaptations:

| Input | Default normalized form | Note |
|---|---|---|
| `j` | `diy` | Filipino-style approximation; user may edit |
| `ch` | `ts` | Affricate approximation |
| `sh` | `siy` | Filipino-style approximation |
| `ñ` | `ny` | Palatal sequence |
| `ph` or `f` | `p` | Imported sound approximation |
| `v` | `b` | Imported sound approximation |
| `z` | `s` | Imported sound approximation |
| `x` | `ks` | Two-consonant sequence |
| `q` | `k` | `qu` is normalized to `kw` before this rule |
| hard `c` | `k` | Before `a`, `o`, `u`, or a consonant |
| soft `c` | `s` | Before `e`, `i`, or `y` |
| soft `g` | `diy` | Before `e`, `i`, or `y`; alternative candidates may override |

These are suggestions, not claims about the person's actual pronunciation.
Every changed sequence must produce an explanation. A user-edited phonetic
form is always allowed to supersede a suggestion.

## Tokenization and syllabification

- Normalize to Unicode NFC, then use a case-folded working copy.
- Treat `ng` as one consonant sound.
- Each syllable has an onset, one vowel nucleus, and an optional coda.
- A single consonant between vowels becomes the next onset.
- For longer intervocalic clusters, choose the longest allowed onset suffix;
  preceding consonants become the current coda.
- Supported two-consonant onset candidates are:

```text
kw gw kr gr pr br tr dr kl gl pl bl sw tw dy ty sy ny
```

- Leading clusters attach to the first vowel nucleus.
- Trailing consonants attach to the final syllable as a coda.
- Adjacent vowels form separate syllables.
- A word with no vowel is rejected for manual correction.

The detected syllable split is shown to the user. Editing the phonetic input
recomputes it immediately.

## Rendering rules

- A vowel-only syllable uses the independent vowel letter.
- The final onset consonant carries the vowel sign.
- Earlier consonants in a modern onset cluster are emitted with the selected
  killer.
- Each modern coda consonant is emitted with the selected killer.
- Separators between name parts are preserved in readable form.
- Each output token records the input syllable and rule that produced it.

## Curated candidate behavior

The curated layer may provide multiple known possibilities. The landing
example is:

- `Michel` → `Misyel` or `Mikel`

The UI recommends one candidate but never hides the alternatives. Generic
names receive a conservative “as written/normalized” candidate plus a
Filipino-natural candidate when rules produce a distinct form.

## Result experience

The interface reveals the result progressively:

1. enter a written name;
2. immediately reveal the recommended Baybayin suggestion;
3. show the pronunciation Pantig used and allow inline correction;
4. reveal explanations and advanced options only when requested.

The result screen contains:

- the large Baybayin rendering as the page's primary visual focus;
- original name and visible interpreted pronunciation;
- a concise `name → pronunciation → pantig → Baybayin` conversion trail;
- an optional “Why is it written this way?” section containing syllable and
  selectable-glyph explanations;
- primary copy, save-image, and share actions;
- an optional advanced section containing Pamudpod, Virama, Traditional,
  horizontal/stacked layout, background, SVG, and styled-image controls;
- light/dark appearance selector, initially following the system preference and
  remembering an explicit choice independently of image-export styling;
- an inline pronunciation editor with candidate and manual choices;
- warnings for adaptations or ambiguity;
- copy Unicode action;
- download card, transparent PNG, and SVG actions;
- a compact cultural/methodology disclaimer.

Functional copy uses plain, English-first language with `bigkas` and `pantig`
introduced in context. It describes concrete actions and consequences, avoids
claims of one correct or official spelling, and places limitations beside the
choice or download they affect.

## Export contract

### Primary card

- PNG, 1080 × 1350 pixels.
- Warm editorial background.
- Large Baybayin result.
- Original name, syllabified pronunciation, and convention label.
- Small Pantig attribution and non-authoritative wording.

### Transparent text

- Standalone PNG with transparent, paper, forest, or terracotta background.
- Horizontal output is 1600 × 520 pixels.
- Vertical output is 720 × 1600 pixels and keeps Unicode marks attached to
  their base glyphs.
- High-resolution output suitable for reuse in another design.

### SVG

- Scalable card export.
- Glyphs must be embedded or converted to paths so the recipient does not need
  the Baybayin font installed.

The visible result, SVG, and PNG must derive from the same structured result.

## Font contract

- Freeze a reviewed `NotoSansTagalog-Regular.ttf` binary in the repository.
- Retain the SIL Open Font License.
- Use the same binary for the page and exports.
- Test U+170D, U+1712, U+1713, U+1714, and U+1715 explicitly.

## Acceptance criteria

- A user can reach a result after one submission and understand it in under
  one minute.
- The generated Baybayin name is the dominant visual element on desktop while
  the input-first mobile order remains easy to use.
- The result is shown immediately from Pantig's recommended deterministic
  pronunciation, which is visibly labeled and editable on the result screen.
- The main result actions are Copy, Save image, and Share; writing conventions
  and image styling remain optional and collapsed by default.
- Each glyph cluster in the optional explanation can be selected with pointer
  or keyboard to show its source sound and explanation.
- The original name is never silently treated as its pronunciation; Pantig's
  interpretation appears beside the result.
- Manual phonetic correction updates syllables and output without leaving the
  result.
- Every non-identity adaptation has a visible explanation.
- Every output token is traceable to a syllable.
- Traditional mode contains neither U+1714 nor U+1715.
- Pamudpod and virama results differ only in killer code points.
- Copy, SVG, card PNG, and transparent PNG work without a backend.
- Horizontal/stacked layout and every background option are previewed before
  export and produce deterministic filenames.
- The methodology section links to the National Museum of the Philippines,
  Unicode Standard, and NCCA Philippine History Source Book, and distinguishes
  sourced script facts from Pantig's own editable sound-matching suggestions.
- Light and dark appearance themes remain legible, honor the system preference
  on first visit, and remember a user-selected theme locally.
- A reviewed golden corpus contains at least 30 representative cases before
  the result is described publicly as validated.
- Unit/property tests and production build pass.
- Critical result and export flows pass in Chromium, Firefox, and WebKit.
- Raw HTML contains the product purpose, journey, example, limitations, and
  sources, with canonical/social metadata, structured data, robots, and a
  sitemap available without executing the application JavaScript.

## Deferred decisions

These do not block the MVP:

- permanent brand/domain name;
- audio pronunciation;
- AI or external pronunciation suggestions;
- accounts and saved history;
- expert/community review workflow;
- additional Philippine scripts;
- public API and batch conversion.
