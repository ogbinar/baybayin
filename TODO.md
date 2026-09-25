# Pantig MVP TODO

## Phase 0 — Freeze

- [x] Capture product vision.
- [x] Research the technical ecosystem.
- [x] Freeze V1 product, transliteration, Unicode, export, and acceptance rules.

## Phase 1 — Foundation

- [x] Scaffold React + TypeScript + Vite.
- [x] Pin the Baybayin font and license.
- [x] Add build, unit-test, and browser-test configuration.
- [x] Add production static-container configuration.

## Phase 2 — Deterministic engine

- [x] Define typed domain contracts.
- [x] Implement input normalization and validation.
- [x] Implement curated and rule-based pronunciation candidates.
- [x] Implement Filipino-oriented tokenization and syllabification.
- [x] Implement pamudpod, virama, and traditional renderers.
- [x] Emit per-transformation and per-syllable explanations.
- [x] Add at least 30 technical golden cases and property tests.

## Phase 3 — Product experience

- [x] Build name input and candidate selection.
- [x] Build editable phonetic spelling and live syllable breakdown.
- [x] Build result hero and convention comparison.
- [x] Build explanation and limitations surfaces.
- [x] Add responsive and accessible states.

## Phase 4 — Export

- [x] Copy Unicode output.
- [x] Download portable 1080 × 1350 SVG card.
- [x] Download 1080 × 1350 PNG card.
- [x] Download transparent 1600 × 520 glyph PNG.
- [x] Verify export uses the same structured result and font as the screen.

## Phase 5 — Verification

- [x] Run TypeScript checking.
- [x] Run unit and property tests.
- [x] Run production build.
- [x] Run Chromium and Firefox critical-flow checks.
- [ ] Run WebKit critical-flow checks (host is missing Playwright WebKit libraries).
- [x] Build and smoke-test the production container.
- [x] Review remaining limitations and update this tracker.

## Deferred

- [ ] Expert review of the golden corpus and explanatory language.
- [ ] Optional pronunciation/audio research.
- [ ] Optional backend, persistence, analytics, or AI assistance.
- [x] Publish the repository publicly on GitHub.
- [ ] Deploy through Dokploy after explicit authorization.
