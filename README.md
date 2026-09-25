# Pantig

Pantig writes names in Baybayin based on how they are said. It immediately
shows a best-effort suggestion, makes its pronunciation guess visible and
editable, explains each pantig, and exports the result as SVG or PNG.

**Live site:** [pantig.apps.ogbinar.com](https://pantig.apps.ogbinar.com/)

The app is deliberately deterministic and runs entirely in the browser. It is
a learning and transliteration aid, not a source of official spellings.

## Current MVP

- Direct discovery flow: name → immediate suggested Baybayin result
- Curated alternatives for ambiguous names such as `Michel` → `Misyel` or
  `Mikel`
- Inline pronunciation correction and visible syllable analysis
- Modern pamudpod, cross-virama, and traditional-style comparison modes
- Per-syllable Unicode traceability
- Copyable Unicode output
- Progressively disclosed syllable and clickable-character explanations
- Primary copy, save-image, and native share actions with a clipboard fallback
- Horizontal presentation and a stacked design layout
- Transparent, paper, forest, and terracotta image backgrounds
- System-aware light and dark appearance themes with a remembered preference
- 1080 × 1350 card PNG and path-based SVG export
- Standalone glyph PNG export at 1600 × 520 horizontal or 720 × 1600 vertical
- Responsive, client-only React application
- Tailwind CSS v4 theme tokens and utilities for the shared interface, with
  focused custom CSS for Baybayin rendering and export-specific presentation
- Crawlable HTML introduction, canonical/social metadata, structured data,
  `robots.txt`, `sitemap.xml`, and a 1200 × 630 social preview image

The 30-case corpus in `data/golden-cases.json` is a technical regression
fixture. It has not yet received expert linguistic review, so the app should
not be presented as authoritative or tattoo-safe.

## Run locally

```bash
npm ci
npm run dev
```

The development server listens on all interfaces. Vite prints the local URL.

The interface theme is defined in `src/styles.css` through Tailwind theme
tokens for Pantig's paper, ink, forest, terracotta, brown, line, and muted
colors. The existing `data-theme` attribute drives the light and dark variants.

## Verify

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`test:e2e` covers Chromium and Firefox. WebKit is available separately with
`npm run test:e2e:webkit` when the host has Playwright's WebKit system
dependencies installed.

## Container

```bash
docker build -t pantig:local .
docker run --rm -p 8080:80 pantig:local
```

The production image serves the static application with Nginx. No environment
variables, API keys, database, or backend are required.

## Project documents

- `VISION.md` — product direction and principles
- `TECHNICAL_RESEARCH.md` — evaluated libraries and implementation research
- `SPEC.md` — frozen MVP contract
- `PLAN.md` — direct-to-result UX rationale, implementation, and verification plan
- `TODO.md` — implementation and verification status

## Sources

The interface links to a compact external source set: the National Museum of
the Philippines for cultural and historical context, the Unicode Standard for
encoded characters and writing mechanics, and the NCCA Philippine History
Source Book for an early documented description. Pantig's editable modern-name
sound matches remain product suggestions rather than externally certified
spellings.

## Fonts

The project packages Noto Sans and Noto Sans Tagalog under the SIL Open Font
License. Browser display and exports use these pinned local font files so that
Baybayin output does not depend on fonts installed on the viewer's device.
