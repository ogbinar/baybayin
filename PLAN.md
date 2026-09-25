# Pantig Direct-to-Result UX Plan

**Status:** Implemented  
**Date:** 2026-09-25  
**Scope:** Focused experience revision; preserve the engine, brand, exports, references, and deployment architecture

## 1. Objective

Make Pantig feel like a small moment of discovery rather than a form-driven
converter. A user should see a thoughtful Baybayin suggestion within seconds,
understand how Pantig interpreted the name, and be able to correct that
interpretation without leaving the result.

The revised journey is:

```text
Enter name → See suggested Baybayin → Check pronunciation
           → Understand why → Copy / Save / Share
```

The central product decision is to replace the blocking pronunciation screen
with an **optimistic result**. Pantig uses its recommended deterministic
pronunciation immediately, labels that interpretation clearly, and keeps
correction one action away.

## 2. Why this revision is needed

The current three-stage journey is responsible but delays the emotional payoff:

```text
name → pronunciation choice → result
```

It also spreads the explanation across clickable glyphs, an always-visible
empty explanation panel, and a separate breakdown section. On mobile, the
opening headline and introductory copy push the input down the page, while the
result screen contains several panels that compete with the Baybayin itself.

The revision should improve speed and focus without weakening Pantig's honesty:

- show the best available result immediately after submission;
- state the pronunciation Pantig used;
- never imply that the suggestion is the only correct spelling;
- allow correction in place;
- reveal educational and advanced material only when requested.

## 3. Product decisions

### 3.1 Keep

- React, TypeScript, Vite, Tailwind CSS v4, and the current static container.
- The deterministic normalization, syllabification, and rendering engine.
- Curated pronunciation candidates and editable phonetic input.
- Modern pamudpod as the default writing convention.
- Virama and traditional-style comparison as optional alternatives.
- Light/dark themes and the existing warm neutral, forest, and terracotta
  palette.
- Local-only processing, pinned fonts, source references, and disclaimers.
- PNG/SVG export, native sharing, and clipboard fallback.
- The current Dokploy application and `pantig.apps.ogbinar.com` domain.

### 3.2 Change

- Replace `name → pronunciation → result` with `name → result`.
- Use the recommended candidate automatically when a valid name is submitted.
- Move pronunciation choices into an inline disclosure on the result screen.
- Begin with an empty input; use `Michel` as a placeholder/example rather than
  a prefilled value.
- Replace the large marketing-style opening with a compact product promise and
  one prominent form.
- Make the on-page result a finished warm card rather than a transparency
  checkerboard preview.
- Move Copy, Save, and Share close to the main result.
- Add the interpreted pronunciation to the transformation trail.
- Consolidate education into one expandable “Why is it written this way?”
  section.
- Rename advanced controls to “More options” and keep them collapsed.

### 3.3 Do not add

- Live conversion on every keystroke. Generation occurs on Enter or “Show me”
  so incomplete names do not create unstable results.
- Accounts, saved history, analytics, backend services, or AI generation.
- Audio recording or pronunciation playback.
- Decorative bamboo, parchment, tribal motifs, or additional visual themes.
- A new component library or state-management dependency.

## 4. Target information architecture

### 4.1 Persistent header

- Pantig mark and wordmark.
- Compact appearance control.
- About link.
- On mobile, preserve space for the main task; secondary controls must not
  dominate the header.

### 4.2 Empty state

The first viewport should contain only the essential task:

```text
Pantig

See your name in Baybayin.

[ Your name                              ]
[ Show me ]

Written from sound, not English spelling.
```

Requirements:

- blank, autofocus-capable input with `Michel` as the placeholder;
- visible label, even if visually compact;
- Enter submits the form;
- short validation appears next to the field;
- no step counter or large explanatory card;
- methodology and references remain below the primary viewport.

### 4.3 Result state

The result becomes the first major element below the header:

```text
One way to write Michel in modern Baybayin

ᜋᜒᜐ᜕ᜌᜒᜎ᜕

Michel
We read this as: Misyel   Change pronunciation

[ Copy ] [ Save ] [ Share ]

MICHEL → MISYEL → MI · SYEL → ᜋᜒᜐ᜕ᜌᜒᜎ᜕

▸ Why is it written this way?
▸ More options

Try another name
```

Requirements:

- the Baybayin output is the largest type on the page;
- use generous whitespace and a plain warm surface;
- retain a restrained forest/terracotta accent rather than a large dark UI
  container;
- dynamically fit common short names on one line where possible;
- wrap long names only at safe glyph-cluster or name-part boundaries;
- use uncertainty wording when candidates, adaptations, or conventions can
  produce alternatives;
- focus and announce the result after generation without producing duplicate
  screen-reader announcements.

## 5. Interaction design

### 5.1 Submit a name

1. Validate the written name using the existing domain function.
2. Retrieve candidates with `getPronunciationCandidates`.
3. Select the recommended candidate, or the first candidate as a deterministic
   fallback.
4. Compute the modern pamudpod result.
5. Replace the empty state with the result state.
6. Move keyboard focus to a result heading and announce a concise summary.
7. Preserve the original written name separately from the phonetic value.

No additional confirmation is required before the result appears.

### 5.2 Change pronunciation

“Change pronunciation” opens an inline panel directly beneath the
interpretation line. It must not navigate to a separate screen.

The panel contains:

- every curated or rule-derived candidate as a radio-style choice;
- the current choice marked clearly;
- a manual “I say it differently” field;
- short candidate notes only when they explain a meaningful sound change;
- Apply and Cancel actions for manual input;
- immediate updates when a listed candidate is selected;
- validation that preserves the last valid result when manual input is invalid.

After a valid change:

- recompute the result, syllables, warnings, explanation, and exports from the
  same structured result;
- announce “Pronunciation changed to …; Baybayin suggestion updated”;
- keep the user's scroll position and result context;
- close the panel after a candidate choice, but allow manual editing without
  losing work.

### 5.3 Transformation trail

Show four explicit stages:

```text
written name → interpreted pronunciation → syllables → Baybayin
```

Example:

```text
MICHEL → MISYEL → MI · SYEL → ᜋᜒᜐ᜕ᜌᜒᜎ᜕
```

On narrow screens, stack the stages vertically with meaningful labels. Arrows
remain decorative and hidden from assistive technology. Do not use the
syllabified form as a substitute for the full interpreted pronunciation.

### 5.4 Primary actions

Place Copy, Save, and Share immediately after the interpretation line and main
result. Their behavior remains:

- **Copy:** Unicode Baybayin only, with an announced success/error state.
- **Save:** polished 1080 × 1350 PNG card.
- **Share:** share the image when supported; otherwise share text/URL or copy a
  prepared share message.

On mobile, each action must be at least 44 × 44 CSS pixels and remain usable
with one hand. Save may be visually primary, but all three actions must be easy
to find.

### 5.5 Why section

Replace the always-visible empty glyph explanation and separate breakdown
section with one native disclosure:

```text
Why is it written this way?
```

Inside it:

- one mapping row/card per syllable;
- source syllable, Baybayin output, and a short explanation;
- sound adaptations grouped under “What Pantig changed” only when present;
- selectable glyph clusters for deeper character-level explanations;
- a short note that Baybayin writes sound and that another pronunciation may
  lead to another spelling.

The section is closed by default and fully keyboard-operable.

### 5.6 More options

Keep this disclosure closed by default. It contains:

- Modern · Pamudpod, selected by default;
- Modern · Virama;
- Traditional-style comparison, explicitly noting that final consonants may
  be omitted;
- horizontal and stacked design layouts;
- transparent, paper, forest, and terracotta export backgrounds;
- styled glyph PNG and SVG downloads.

Changing the convention updates the main result, transformation, explanation,
and all exports from the same structured result. Appearance theme remains
independent from export styling.

## 6. Content and voice

### 6.1 Core copy

- Landing promise: **“See your name in Baybayin.”**
- Result qualifier: **“One way to write your name in modern Baybayin.”**
- Interpretation: **“We read this as: Misyel.”**
- Correction action: **“Change pronunciation.”**
- Education disclosure: **“Why is it written this way?”**
- Advanced disclosure: **“More options.”**
- Restart action: **“Try another name.”**

### 6.2 Voice rules

- Use plain, short English-first sentences.
- Introduce `pronunciation (bigkas)` and `syllable (pantig)` only where they
  help teach the concept.
- Prefer specific consequences over institutional language.
- Say “suggested,” “one way,” or “based on how we read the name.”
- Never claim “correct,” “official,” “authentic,” or “validated.”
- Keep the permanent-use warning near Save/Share or inside More options; do not
  let it overpower the normal result.

## 7. Visual direction

### 7.1 Layout

- Mobile-first single-column layout.
- Compact header, centered input, and short first viewport.
- Result card uses a maximum readable width but does not resemble a dashboard.
- Reduce borders, nested panels, labels, and repeated headings.
- Keep generous vertical rhythm around the Baybayin output.

### 7.2 Color and typography

- Retain Pantig Sans and Noto Sans Tagalog.
- Retain warm paper neutrals, deep forest text, and one terracotta accent.
- Use dark forest as an accent or text color rather than a full-screen result
  panel unless contrast testing demonstrates a clear benefit.
- Remove the checkerboard from the default on-page result.
- Use subtle cultural character through the script, vocabulary, and spacing—not
  decorative historical motifs.

### 7.3 Motion

- Use one restrained reveal transition for the result.
- Do not animate individual characters unnecessarily.
- Under `prefers-reduced-motion: reduce`, disable smooth scrolling,
  transitions, transforms, and nonessential animation.

## 8. Share-card revision

The primary exported card remains 1080 × 1350 and contains:

- large Baybayin name;
- Latin name;
- interpreted pronunciation or syllables in smaller type;
- “Suggested modern Baybayin” or equivalent modest qualifier;
- subtle Pantig branding;
- warm neutral background with one restrained accent detail.

It must not contain:

- checkerboards or editor-like UI;
- buttons or website controls;
- dense methodology copy;
- claims of a unique or official spelling.

The visible result and exported card must continue to use the same structured
transliteration result and pinned font.

## 9. Accessibility requirements

- Every input has a persistent programmatic label.
- All interactive targets are at least 44 × 44 CSS pixels on touch layouts.
- The theme control meets the same touch-target requirement.
- Keyboard order follows visual order.
- Focus moves to the result only after explicit form submission.
- The output has an accessible name and description containing the written
  name, interpreted pronunciation, convention, and suggested nature.
- Pronunciation and convention changes are announced through one polite live
  region.
- Disclosures use native `details/summary` or equivalent correct semantics.
- Selected candidates and conventions expose state programmatically.
- Focus indicators remain visible in light and dark themes.
- Text and controls meet WCAG AA contrast.
- Reduced-motion mode disables all nonessential movement.
- Baybayin glyphs remain visible text, not inaccessible raster-only content.

## 10. Static HTML and SEO

Retain the current static fallback approach and update it to match the new
journey:

- state that Pantig immediately suggests a result from its best pronunciation
  guess;
- explain that pronunciation can be corrected after the result appears;
- preserve product purpose, limitations, example, and source links;
- update JSON-LD and social descriptions where they mention the old gated
  sequence;
- keep canonical URL, robots, sitemap, and social image available without
  JavaScript;
- verify the raw HTML is meaningful with JavaScript disabled.

Full SSR or a framework migration is not required for this release.

## 11. Technical implementation map

### `src/App.tsx`

- Replace the three-value `JourneyStage` with a simpler empty/result state.
- Change `handleGenerate` to select the recommended candidate and reveal the
  result immediately.
- Remove the full-page pronunciation branch.
- Add local state for the inline pronunciation disclosure and draft manual
  phonetic value.
- Keep the last valid phonetic value separate from an invalid draft.
- Render the interpreted display name separately from `syllableLine`.
- Reorder result actions and disclosures.
- Consolidate glyph and syllable explanations under the Why disclosure.
- Add focus management and concise live announcements.

### `src/styles.css`

- Simplify the landing hero and form.
- Restyle the result as a warm share-card-like surface.
- Remove the default checkerboard from the on-page preview.
- Add the inline pronunciation editor layout.
- Add a four-stage responsive transformation trail.
- Consolidate explanation styles and remove obsolete step/wizard styles.
- Increase small control touch targets.
- expand reduced-motion overrides.
- Verify light/dark contrast and mobile type fitting.

### `src/domain/candidates.ts`

- Preserve deterministic candidate behavior.
- Confirm every valid result has a stable recommended/first-candidate fallback.
- No new linguistic rules are part of this UI revision.

### `src/export/image.ts`

- Simplify card hierarchy and branding.
- Include the interpreted pronunciation consistently.
- Preserve deterministic filenames, dimensions, pinned fonts, and PNG/SVG
  equivalence.

### `index.html`

- Update raw fallback journey and example.
- Align meta descriptions and structured data with immediate suggestion plus
  editable pronunciation.

### Documentation

- Update `SPEC.md` product contract, result experience, and acceptance criteria.
- Update `README.md` journey and feature summary.
- Update `TODO.md` as each phase closes.
- Record that immediate display is a best-effort suggestion, not confirmation
  of the user's actual pronunciation.

## 12. Implementation phases

### Phase A — Contract and state transition

1. Update the spec to freeze the direct-to-result contract.
2. Simplify the app state machine.
3. Make submit generate the recommended result immediately.
4. Remove the blocking pronunciation page.
5. Add unit tests for automatic candidate selection and direct reveal.

**Exit criterion:** a valid name reaches a labeled result after one submission.

### Phase B — Inline pronunciation correction

1. Add the “We read this as…” line.
2. Add the inline candidate/manual editor.
3. Preserve the last valid result during invalid manual edits.
4. Recompute and announce valid changes.
5. Add candidate and manual-correction tests.

**Exit criterion:** users can correct pronunciation without leaving the result.

### Phase C — Result hierarchy and education

1. Simplify the result surface.
2. Move primary actions next to the reveal.
3. Expand the transformation to four explicit stages.
4. Consolidate explanations under the Why disclosure.
5. Keep More options closed and secondary.

**Exit criterion:** the Baybayin result remains the visual focus and all
secondary detail is progressively disclosed.

### Phase D — Share card and accessibility

1. Refine the PNG/SVG card composition.
2. Add focus transfer and live announcements.
3. Repair touch targets and reduced-motion behavior.
4. Test keyboard use, contrast, and screen-reader labels.

**Exit criterion:** the primary flow and export are usable on mobile, keyboard,
and reduced-motion configurations.

### Phase E — SEO, documentation, and rollout

1. Update fallback HTML, metadata, README, specification, and TODO.
2. Run the complete automated verification matrix.
3. Perform desktop/mobile visual review in both themes.
4. Commit and push only after the local gate passes.
5. Confirm Dokploy deploys the exact commit.
6. Smoke-test the public domain and downloadable assets.

**Exit criterion:** GitHub, Dokploy, live behavior, and documentation all agree.

## 13. Test plan

### Unit and component tests

- Initial input is empty and no result is shown.
- Submitting `Michel` directly shows the recommended `Misyel` result.
- The interpretation line displays `Misyel`, not only `mi · syel`.
- Changing to `Mikel` updates the output and trail.
- Manual valid pronunciation updates the result.
- Manual invalid pronunciation retains the last valid result and shows an
  actionable error.
- Copy status is announced.
- Share uses file sharing, text sharing, and clipboard fallback correctly.
- Why and More options are closed initially and keyboard-operable.
- Convention changes update visible and exported results consistently.

### Browser tests

- Desktop and mobile: one submit reaches the result.
- The Baybayin output is visible without a second decision.
- Copy, Save, and Share are visible before advanced options.
- Pronunciation correction remains on the result screen.
- Four-stage transformation is complete and ordered.
- Why section exposes syllable and glyph explanations.
- More options defaults to pamudpod and remains collapsed.
- No horizontal overflow at 320, 375, 390, 768, and 1440 pixels.
- Keyboard-only journey has logical focus order and visible focus.
- Reduced-motion emulation removes nonessential motion.
- Light and dark themes retain legibility.
- Raw HTML, robots, sitemap, canonical tags, and social assets remain valid.
- PNG/SVG downloads have expected names, types, and nonzero content.

### Manual review

- First meaningful result feels reachable within a few seconds.
- The input and result fit naturally in the first mobile journey.
- Common short names remain visually coherent on one line.
- Long and multipart names wrap without splitting combining marks.
- Copy does not sound authoritative or AI-polished.
- The share card is attractive when viewed outside Pantig.
- No control competes visually with the Baybayin name.

## 14. Acceptance criteria

- A valid name produces a visible recommended result after one form submission.
- No separate pronunciation page blocks the result.
- The result clearly states the pronunciation Pantig used.
- Pronunciation can be changed inline and updates every derived artifact.
- The transformation shows written name, interpreted pronunciation, syllables,
  and Baybayin as distinct stages.
- Baybayin is the largest and strongest visual element.
- Copy, Save, and Share are visible without opening a disclosure.
- The Why and More options sections are closed by default.
- Modern pamudpod remains the default; alternatives remain clearly labeled.
- The interface consistently describes the output as one suggested rendering.
- The default on-page result does not use a transparency checkerboard.
- The primary share card contains Baybayin, Latin name, pronunciation, and
  subtle Pantig branding.
- The primary mobile journey has no horizontal overflow and uses 44-pixel touch
  targets.
- Keyboard, focus, contrast, ARIA, and reduced-motion checks pass.
- Raw HTML remains meaningful without client-side JavaScript.
- Type checking, unit/property tests, production build, dependency audit, and
  Chromium/Firefox browser tests pass before deployment.
- Dokploy reports the deployed commit as successful and live smoke tests pass.

## 15. Risks and mitigations

### Risk: an immediate guess appears authoritative

**Mitigation:** place “One way to write…” and “We read this as…” beside the
result, keep Change pronunciation visible, and preserve adaptation warnings.

### Risk: generic rules produce a weak pronunciation guess

**Mitigation:** do not claim confidence; make correction frictionless; preserve
the current deterministic and inspectable behavior rather than adding opaque AI.

### Risk: simplification hides valuable learning material

**Mitigation:** consolidate rather than delete it. The Why disclosure retains
syllable, glyph, adaptation, and convention explanations.

### Risk: restyling breaks export parity

**Mitigation:** keep all screen and export formats derived from the same
`TransliterationResult`; add regression tests for changed pronunciation and
convention.

### Risk: automatic deployment publishes a partially verified state

**Mitigation:** complete all local phases and tests in one coherent commit or a
small sequence of non-pushed commits; push only after the full gate passes.

## 16. Rollback

- Keep the current deployed commit available as the rollback point.
- Avoid domain, infrastructure, engine, or data migrations.
- If the new journey fails production verification, redeploy the previous
  known-good image/commit through Dokploy.
- Because this revision changes only client state, presentation, copy, and
  exports, rollback requires no data recovery.

## 17. Definition of done

The revision is complete when a first-time mobile user can enter a name, see a
large and honestly qualified Baybayin suggestion immediately, understand the
pronunciation Pantig used, correct it without leaving the result, learn the
mapping only if interested, and save or share a polished card—with the local
test suite, production build, accessibility checks, static fallback, GitHub
state, and Dokploy deployment all verified.
