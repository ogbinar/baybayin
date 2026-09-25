import { createElement } from 'react';
import satori from 'satori';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import resvgWasmUrl from '@resvg/resvg-wasm/index_bg.wasm?url';

import type { Convention, TransliterationResult } from '../domain';
import {
  IMAGE_BACKGROUNDS,
  splitBaybayinClusters,
  type ImageBackground,
  type TextFlow,
} from '../presentation';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;
const HORIZONTAL_IMAGE = { width: 1600, height: 520 };
const VERTICAL_IMAGE = { width: 720, height: 1600 };

let fontPromise: Promise<{ latin: ArrayBuffer; baybayin: ArrayBuffer }> | undefined;
let wasmPromise: Promise<void> | undefined;

function loadFonts() {
  fontPromise ??= Promise.all([
    fetch('/fonts/NotoSans-Regular.ttf').then((response) => {
      if (!response.ok) throw new Error('Could not load the Latin export font.');
      return response.arrayBuffer();
    }),
    fetch('/fonts/NotoSansTagalog-Regular.ttf').then((response) => {
      if (!response.ok) throw new Error('Could not load the Baybayin export font.');
      return response.arrayBuffer();
    }),
  ]).then(([latin, baybayin]) => ({ latin, baybayin }));
  return fontPromise;
}

function ensureWasm() {
  wasmPromise ??= initWasm(fetch(resvgWasmUrl));
  return wasmPromise;
}

function safeFilename(name: string): string {
  const safe = name
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return safe || 'baybayin-name';
}

export function cardPngFilename(name: string, flow: TextFlow = 'horizontal'): string {
  return `${safeFilename(name)}-baybayin-card-${flow}.png`;
}

function conventionLabel(convention: Convention): string {
  if (convention === 'pamudpod') return 'Modern · Pamudpod';
  if (convention === 'virama') return 'Modern · Cross virama';
  return 'Traditional-style comparison';
}

function syllableLine(result: TransliterationResult): string {
  return result.analysis.parts
    .map((part) => {
      if (part.kind === 'separator') return part.source;
      return part.syllables.map((syllable) => syllable.source).join(' · ');
    })
    .join('');
}

function baybayinFontSize(value: string, maximum: number): number {
  const visibleLength = Array.from(value.replace(/[ '\-]/g, '')).length;
  if (visibleLength <= 8) return maximum;
  if (visibleLength <= 14) return Math.round(maximum * 0.78);
  if (visibleLength <= 22) return Math.round(maximum * 0.6);
  return Math.round(maximum * 0.46);
}

function glyphContent(value: string, flow: TextFlow) {
  if (flow === 'horizontal') return value;
  return splitBaybayinClusters(value).map((cluster, index) =>
    createElement(
      'span',
      {
        key: `${cluster}-${index}`,
        style: cluster === ' '
          ? { display: 'flex', minHeight: 30 }
          : { display: 'flex' },
      },
      cluster === ' ' ? '\u00a0' : cluster,
    ),
  );
}

async function renderSvg(
  element: ReturnType<typeof createElement>,
  width: number,
  height: number,
): Promise<string> {
  const fonts = await loadFonts();
  return satori(element, {
    width,
    height,
    fonts: [
      {
        name: 'Noto Sans',
        data: fonts.latin,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Noto Sans Tagalog',
        data: fonts.baybayin,
        weight: 400,
        style: 'normal',
      },
    ],
  });
}

export async function createCardSvg(
  originalName: string,
  result: TransliterationResult,
  flow: TextFlow = 'horizontal',
): Promise<string> {
  const glyphSize = flow === 'vertical' ? 118 : baybayinFontSize(result.unicode, 176);
  const element = createElement(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '78px 80px 68px',
        background: '#f1eadc',
        color: '#152d2b',
        fontFamily: 'Noto Sans',
      },
    },
    createElement(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      createElement('div', { style: { fontSize: 28, letterSpacing: '0.18em', textTransform: 'uppercase' } }, 'Pantig'),
      createElement('div', { style: { fontSize: 22, color: '#745746' } }, conventionLabel(result.convention)),
    ),
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          borderTop: '1px solid rgba(21,45,43,.18)',
          borderBottom: '1px solid rgba(21,45,43,.18)',
          margin: '54px 0 48px',
          textAlign: 'center',
        },
      },
      createElement(
        'div',
        {
          style: {
            fontFamily: 'Noto Sans Tagalog',
            fontSize: glyphSize,
            lineHeight: 1.45,
            color: '#173d38',
            maxWidth: 920,
            display: 'flex',
            flexDirection: flow === 'vertical' ? 'column' : 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        glyphContent(result.unicode, flow),
      ),
      createElement('div', { style: { fontSize: 56, marginTop: 34, letterSpacing: '-0.025em' } }, originalName),
      createElement('div', { style: { fontSize: 26, marginTop: 16, color: '#745746' } }, syllableLine(result)),
    ),
    createElement(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' } },
      createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', maxWidth: 670 } },
        createElement('div', { style: { fontSize: 22, color: '#173d38' } }, 'Based on the pronunciation you selected.'),
        createElement('div', { style: { fontSize: 17, color: '#745746', marginTop: 8 } }, 'Suggested spelling. Ask an experienced reader to check it before permanent use.'),
      ),
      createElement('div', { style: { width: 88, height: 8, borderRadius: 8, background: '#b96346' } }),
    ),
  );
  return renderSvg(element, CARD_WIDTH, CARD_HEIGHT);
}

export async function createGlyphSvg(
  result: TransliterationResult,
  flow: TextFlow = 'horizontal',
  background: ImageBackground = 'transparent',
): Promise<string> {
  const dimensions = flow === 'vertical' ? VERTICAL_IMAGE : HORIZONTAL_IMAGE;
  const palette = IMAGE_BACKGROUNDS.find((item) => item.id === background) ?? IMAGE_BACKGROUNDS[0];
  const glyphSize = flow === 'vertical' ? 138 : baybayinFontSize(result.unicode, 260);
  const element = createElement(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '52px 72px',
        background: palette.color,
        fontFamily: 'Noto Sans Tagalog',
        fontSize: glyphSize,
        lineHeight: flow === 'vertical' ? 1.08 : 1.3,
        color: palette.ink,
        textAlign: 'center',
        flexDirection: flow === 'vertical' ? 'column' : 'row',
      },
    },
    glyphContent(result.unicode, flow),
  );
  return renderSvg(element, dimensions.width, dimensions.height);
}

async function svgToPng(svg: string): Promise<Uint8Array> {
  await ensureWasm();
  const renderer = new Resvg(svg, {
    fitTo: { mode: 'original' },
    font: { loadSystemFonts: false },
  });
  const rendered = renderer.render();
  const png = rendered.asPng();
  rendered.free();
  renderer.free();
  return png;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export async function downloadCardSvg(
  originalName: string,
  result: TransliterationResult,
  flow: TextFlow = 'horizontal',
): Promise<void> {
  const svg = await createCardSvg(originalName, result, flow);
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${safeFilename(originalName)}-baybayin-card-${flow}.svg`);
}

export async function downloadCardPng(
  originalName: string,
  result: TransliterationResult,
  flow: TextFlow = 'horizontal',
): Promise<void> {
  const blob = await createCardPngBlob(originalName, result, flow);
  downloadBlob(blob, cardPngFilename(originalName, flow));
}

export async function createCardPngBlob(
  originalName: string,
  result: TransliterationResult,
  flow: TextFlow = 'horizontal',
): Promise<Blob> {
  const svg = await createCardSvg(originalName, result, flow);
  const png = await svgToPng(svg);
  return new Blob([Uint8Array.from(png).buffer], { type: 'image/png' });
}

export async function downloadGlyphPng(
  originalName: string,
  result: TransliterationResult,
  flow: TextFlow = 'horizontal',
  background: ImageBackground = 'transparent',
): Promise<void> {
  const svg = await createGlyphSvg(result, flow, background);
  const png = await svgToPng(svg);
  downloadBlob(
    new Blob([Uint8Array.from(png).buffer], { type: 'image/png' }),
    `${safeFilename(originalName)}-baybayin-${flow}-${background}.png`,
  );
}
