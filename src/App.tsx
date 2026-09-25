import { useEffect, useMemo, useState } from 'react';

import {
  getPronunciationCandidates,
  transliterate,
  type Convention,
  type GlyphToken,
  type PronunciationCandidate,
  type TransliterationResult,
} from './domain';
import {
  IMAGE_BACKGROUNDS,
  TEXT_FLOWS,
  type ColorTheme,
  type ImageBackground,
  type TextFlow,
} from './presentation';
import './styles.css';

type JourneyStage = 'name' | 'pronunciation' | 'result';
type InteractiveGlyph =
  | { kind: 'token'; id: string; token: GlyphToken }
  | { kind: 'separator'; id: string; unicode: string };

const CONVENTIONS: Array<{ id: Convention; label: string; detail: string }> = [
  { id: 'pamudpod', label: 'Pamudpod', detail: 'Modern · final sounds shown' },
  { id: 'virama', label: 'Virama', detail: 'Modern · cross mark' },
  { id: 'traditional', label: 'Traditional-style', detail: 'May omit final sounds' },
];

const initialCandidateData = getPronunciationCandidates('Michel');
const initialCandidate = initialCandidateData.candidates[0];

function initialColorTheme(): ColorTheme {
  const stored = window.localStorage.getItem('pantig-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function buildResult(phonetic: string, convention: Convention) {
  try {
    return { result: transliterate(phonetic, convention), error: '' };
  } catch (error) {
    return {
      result: null,
      error: error instanceof Error ? error.message : 'The pronunciation could not be processed.',
    };
  }
}

function resultGlyphs(result: TransliterationResult): InteractiveGlyph[] {
  const bySyllable = new Map(result.renderings.map((item) => [item.syllable.index, item]));
  const glyphs: InteractiveGlyph[] = [];
  let tokenIndex = 0;
  let separatorIndex = 0;
  for (const part of result.analysis.parts) {
    if (part.kind === 'separator') {
      glyphs.push({ kind: 'separator', id: `separator-${separatorIndex++}`, unicode: part.source });
      continue;
    }
    for (const syllable of part.syllables) {
      for (const token of bySyllable.get(syllable.index)?.tokens ?? []) {
        glyphs.push({ kind: 'token', id: `token-${tokenIndex++}`, token });
      }
    }
  }
  return glyphs;
}

function syllableLine(result: TransliterationResult): string {
  return result.analysis.parts
    .map((part) => part.kind === 'separator'
      ? part.source
      : part.syllables.map((syllable) => syllable.source).join(' · '))
    .join('');
}

function App() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(initialColorTheme);
  const [stage, setStage] = useState<JourneyStage>('name');
  const [name, setName] = useState('Michel');
  const [confirmedName, setConfirmedName] = useState('Michel');
  const [candidates, setCandidates] = useState<PronunciationCandidate[]>(initialCandidateData.candidates);
  const [selectedCandidate, setSelectedCandidate] = useState(initialCandidate.id);
  const [phonetic, setPhonetic] = useState(initialCandidate.phonetic);
  const [convention, setConvention] = useState<Convention>('pamudpod');
  const [textFlow, setTextFlow] = useState<TextFlow>('horizontal');
  const [imageBackground, setImageBackground] = useState<ImageBackground>('transparent');
  const [inputError, setInputError] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [exportState, setExportState] = useState('');
  const [shareState, setShareState] = useState('');
  const [selectedGlyphId, setSelectedGlyphId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = colorTheme;
    window.localStorage.setItem('pantig-theme', colorTheme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', colorTheme === 'dark' ? '#101918' : '#f1eadc',
    );
  }, [colorTheme]);

  const computed = useMemo(() => buildResult(phonetic, convention), [phonetic, convention]);
  const glyphs = useMemo(() => computed.result ? resultGlyphs(computed.result) : [], [computed.result]);
  const selectedGlyph = glyphs.find(
    (glyph): glyph is Extract<InteractiveGlyph, { kind: 'token' }> =>
      glyph.kind === 'token' && glyph.id === selectedGlyphId,
  );
  const activeCandidate = candidates.find((candidate) => candidate.id === selectedCandidate);

  const scrollToJourney = () => {
    window.requestAnimationFrame(() => {
      document.getElementById('journey')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    });
  };

  const resetResultOptions = () => {
    setConvention('pamudpod');
    setTextFlow('horizontal');
    setImageBackground('transparent');
    setCopyState('idle');
    setExportState('');
    setShareState('');
    setSelectedGlyphId(null);
  };

  const handleGenerate = (event: React.FormEvent) => {
    event.preventDefault();
    const data = getPronunciationCandidates(name);
    if (!data.validation.ok) {
      setInputError(data.validation.message);
      return;
    }
    const recommended = data.candidates.find((candidate) => candidate.recommended) ?? data.candidates[0];
    setInputError('');
    setConfirmedName(data.validation.value);
    setCandidates(data.candidates);
    setSelectedCandidate(recommended.id);
    setPhonetic(recommended.phonetic);
    resetResultOptions();
    setStage('pronunciation');
    scrollToJourney();
  };

  const revealCandidate = (candidate: PronunciationCandidate) => {
    setSelectedCandidate(candidate.id);
    setPhonetic(candidate.phonetic);
    resetResultOptions();
    setStage('result');
    scrollToJourney();
  };

  const revealEditedPronunciation = () => {
    if (!buildResult(phonetic, 'pamudpod').result) return;
    setSelectedCandidate('user');
    resetResultOptions();
    setStage('result');
    scrollToJourney();
  };

  const copyResult = async () => {
    if (!computed.result) return;
    try {
      await navigator.clipboard.writeText(computed.result.unicode);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  const runExport = async (label: string, task: () => Promise<void>) => {
    try {
      setExportState(`Preparing ${label}…`);
      await task();
      setExportState(`${label} downloaded.`);
    } catch (error) {
      console.error(`Could not create ${label}.`, error);
      setExportState(error instanceof Error ? error.message : `Could not create ${label}.`);
    }
  };

  const shareResult = async () => {
    if (!computed.result) return;
    const text = `${confirmedName} in Baybayin: ${computed.result.unicode}\nSuggested by Pantig from the pronunciation “${phonetic}”.`;
    try {
      if (!navigator.share) {
        await navigator.clipboard.writeText(`${text}\n${window.location.origin}`);
        setShareState('Share text copied.');
        return;
      }
      const { cardPngFilename, createCardPngBlob } = await import('./export/image');
      const blob = await createCardPngBlob(confirmedName, computed.result, textFlow);
      const file = new File([blob], cardPngFilename(confirmedName, textFlow), { type: 'image/png' });
      const fileShare = { files: [file], title: `${confirmedName} in Baybayin`, text };
      if (navigator.canShare?.(fileShare)) {
        await navigator.share(fileShare);
      } else {
        await navigator.share({ title: `${confirmedName} in Baybayin`, text, url: window.location.origin });
      }
      setShareState('Shared.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setShareState('Share cancelled.');
        return;
      }
      console.error('Could not share the result.', error);
      setShareState('Could not share this result. Try Save image instead.');
    }
  };

  return (
    <div className="site-shell mx-auto w-full max-w-[1480px] px-[42px] max-[980px]:px-6 max-[660px]:px-[14px]">
      <header className="site-header flex min-h-[90px] items-center justify-between border-b border-line max-[660px]:min-h-[74px]">
        <a className="brand inline-flex items-center gap-3 text-xl font-[680] tracking-[0.08em] text-ink no-underline uppercase" href="#top" aria-label="Pantig home">
          <span className="brand-mark">ᜉ</span><span>Pantig</span>
        </a>
        <div className="header-actions flex items-center gap-[18px] max-[660px]:gap-[9px]">
          <div className="theme-picker" role="radiogroup" aria-label="Color theme">
            {(['light', 'dark'] as const).map((theme) => (
              <button type="button" key={theme} role="radio" aria-checked={colorTheme === theme}
                className={colorTheme === theme ? 'active' : ''} onClick={() => setColorTheme(theme)}>
                {theme === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
          <a className="method-link text-brown underline-offset-[5px] max-[660px]:text-[13px]" href="#method">About</a>
        </div>
      </header>

      <main id="top">
        {stage !== 'result' && (
          <section className="hero grid grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] items-end gap-16 pt-[46px] pb-[34px] max-[660px]:grid-cols-1 max-[660px]:gap-4 max-[660px]:px-1 max-[660px]:pt-[52px] max-[660px]:pb-[38px]" aria-labelledby="hero-title">
            <p className="eyebrow col-span-full -mb-[46px] max-[660px]:col-span-1 max-[660px]:mb-0">Discover your name in Baybayin</p>
            <h1 className="mb-0 max-w-[680px] text-[clamp(42px,5.5vw,76px)] leading-[0.98] font-[520] tracking-[-0.055em] max-[660px]:text-[clamp(46px,15vw,68px)]" id="hero-title">Your name, written by sound.</h1>
            <p className="hero-copy mb-0 max-w-[620px] text-[clamp(18px,2vw,23px)] leading-[1.55] text-[#4d5e59] dark:text-[#bcc6c0] max-[660px]:text-[17px]">
              Tell us your name, choose how you say it, and see how each pantig becomes Baybayin.
            </p>
          </section>
        )}

        <section className={`journey stage-${stage}`} id="journey" aria-label="Discover your name in Baybayin">
          {stage === 'name' && (
            <div className="journey-card name-stage">
              <p className="step-kicker">Step 1 of 3</p>
              <h2>What’s your name?</h2>
              <p>Start with the name as you normally write it.</p>
              <form className="name-form" onSubmit={handleGenerate} noValidate>
                <label htmlFor="name">Your name</label>
                <div className="input-row">
                  <input id="name" value={name} onChange={(event) => setName(event.target.value)}
                    maxLength={80} autoComplete="name" aria-describedby={inputError ? 'name-error' : undefined} />
                  <button type="submit">Show me</button>
                </div>
                {inputError && <p className="field-error" id="name-error">{inputError}</p>}
              </form>
              <p className="example-note">Example: Michel can sound like “Misyel” or “Mikel.”</p>
            </div>
          )}

          {stage === 'pronunciation' && (
            <div className="journey-card pronunciation-stage">
              <button className="back-link" type="button" onClick={() => setStage('name')}>← Change the name</button>
              <p className="step-kicker">Step 2 of 3</p>
              <h2>How do you say {confirmedName}?</h2>
              <p>Choose the closest bigkas. You can also type your own.</p>
              <div className="candidate-list" aria-label="Pronunciation choices">
                {candidates.map((candidate) => (
                  <button className="candidate-card" key={candidate.id} type="button" onClick={() => revealCandidate(candidate)}>
                    <span><strong>{candidate.display}</strong><small>{candidate.label}</small></span>
                    {candidate.recommended ? <em>Suggested</em> : <span aria-hidden="true">→</span>}
                  </button>
                ))}
              </div>
              <div className="manual-pronunciation">
                <label className="phonetic-label" htmlFor="phonetic">I say it differently<span>Write it the way it sounds.</span></label>
                <div className="input-row">
                  <input className="phonetic-input" id="phonetic" aria-label="Phonetic spelling" value={phonetic}
                    onChange={(event) => { setPhonetic(event.target.value); setSelectedCandidate('user'); }} spellCheck={false} />
                  <button type="button" onClick={revealEditedPronunciation}>Use this sound</button>
                </div>
                {computed.error && <p className="field-error">{computed.error}</p>}
                {activeCandidate?.notes[0] && selectedCandidate !== 'user' && <p className="candidate-guidance">{activeCandidate.notes[0]}</p>}
              </div>
            </div>
          )}

          {stage === 'result' && computed.result && (
            <div className="result-experience">
              <div className="result-panel result-reveal" id="result" aria-live="polite">
                <div className="result-topline"><span>Step 3 of 3 · Your suggested Baybayin</span><span className="privacy-note">Private · nothing uploaded</span></div>
                <div className={`glyph-preview flow-${textFlow} background-${imageBackground}`} data-testid="glyph-preview">
                  <div className="baybayin-result interactive-result" data-testid="baybayin-result" aria-label={`${confirmedName} in Baybayin`}>
                    {glyphs.map((glyph) => glyph.kind === 'separator' ? (
                      <span className="glyph-separator" key={glyph.id}>{glyph.unicode}</span>
                    ) : (
                      <button className={`glyph-token ${selectedGlyphId === glyph.id ? 'selected' : ''}`} key={glyph.id}
                        type="button" aria-label={`Explain ${glyph.token.source}`} aria-pressed={selectedGlyphId === glyph.id}
                        onClick={() => setSelectedGlyphId(selectedGlyphId === glyph.id ? null : glyph.id)}>{glyph.token.unicode}</button>
                    ))}
                  </div>
                </div>
                <div className="result-name">{confirmedName}</div>
                <p className="tap-note">Tap a Baybayin symbol to learn what it does.</p>
                <div className="conversion-trail" aria-label="How the name became Baybayin">
                  <span><small>Your name</small><strong>{confirmedName}</strong></span><b aria-hidden="true">→</b>
                  <span><small>How it sounds</small><strong>{syllableLine(computed.result)}</strong></span><b aria-hidden="true">→</b>
                  <span><small>Baybayin</small><strong className="baybayin-trail">{computed.result.unicode}</strong></span>
                </div>
                <div className="glyph-explanation" aria-live="polite">
                  {selectedGlyph ? <><strong><span className="baybayin-inline">{selectedGlyph.token.unicode}</span> writes “{selectedGlyph.token.source}”</strong><p>{selectedGlyph.token.explanation}</p></> : <p>Select a symbol above for a short explanation.</p>}
                </div>
                {computed.result.warnings.length > 0 && <ul className="result-warnings">{computed.result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
                <div className="primary-result-actions">
                  <button type="button" onClick={copyResult}>{copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy'}</button>
                  <button className="primary-action" type="button" onClick={() => runExport('image', async () => { const { downloadCardPng } = await import('./export/image'); await downloadCardPng(confirmedName, computed.result!, textFlow); })}>Save image</button>
                  <button type="button" onClick={shareResult}>Share</button>
                </div>
                {(exportState || shareState) && <p className="export-status" role="status">{shareState || exportState}</p>}
                <details className="advanced-options">
                  <summary>Writing and image options</summary>
                  <p>Optional choices for comparing styles or customizing an image.</p>
                  <span className="option-label">Writing style</span>
                  <div className="convention-picker" role="radiogroup" aria-label="Writing convention">
                    {CONVENTIONS.map((item) => <button type="button" key={item.id} className={convention === item.id ? 'active' : ''}
                      role="radio" aria-checked={convention === item.id} onClick={() => { setConvention(item.id); setSelectedGlyphId(null); }}>
                      <strong>{item.label}</strong><small>{item.detail}</small></button>)}
                  </div>
                  <div className="design-options" aria-label="Image style">
                    <div><span className="option-label">Text flow</span><div className="segmented-picker" role="radiogroup" aria-label="Text flow">
                      {TEXT_FLOWS.map((item) => <button type="button" key={item.id} className={textFlow === item.id ? 'active' : ''}
                        role="radio" aria-checked={textFlow === item.id} onClick={() => setTextFlow(item.id)}><strong>{item.label}</strong><small>{item.detail}</small></button>)}
                    </div></div>
                    <div><span className="option-label">Image background</span><div className="background-picker" role="radiogroup" aria-label="Image background">
                      {IMAGE_BACKGROUNDS.map((item) => <button type="button" key={item.id} className={imageBackground === item.id ? 'active' : ''}
                        role="radio" aria-checked={imageBackground === item.id} aria-label={item.label} title={item.label} onClick={() => setImageBackground(item.id)}>
                        <span className={`background-swatch swatch-${item.id}`} /><small>{item.label}</small></button>)}
                    </div></div>
                  </div>
                  <div className="secondary-downloads">
                    <button type="button" onClick={() => runExport('styled PNG', async () => { const { downloadGlyphPng } = await import('./export/image'); await downloadGlyphPng(confirmedName, computed.result!, textFlow, imageBackground); })}>Download styled image</button>
                    <button type="button" onClick={() => runExport('SVG card', async () => { const { downloadCardSvg } = await import('./export/image'); await downloadCardSvg(confirmedName, computed.result!, textFlow); })}>Download SVG</button>
                  </div>
                </details>
                <p className="download-note">This is a suggested spelling, not the only valid one. For a tattoo or permanent design, ask an experienced Baybayin reader to review it.</p>
                <div className="result-reset-actions"><button type="button" onClick={() => setStage('pronunciation')}>Change pronunciation</button><button type="button" onClick={() => setStage('name')}>Try another name</button></div>
              </div>
            </div>
          )}
        </section>

        {stage === 'result' && computed.result && (
          <section className="explanation-section" aria-labelledby="explanation-title">
            <div className="section-intro"><p className="eyebrow">See the breakdown</p><h2 id="explanation-title">How each pantig was written</h2><p>Each pantig is shown beside the Baybayin symbols used for it.</p></div>
            <div className="mapping-grid">{computed.result.renderings.map((rendering) => <article className="mapping-card" key={rendering.syllable.index}>
              <div className="mapping-pair"><span>{rendering.syllable.source}</span><span aria-hidden="true">→</span><strong className="baybayin-inline">{rendering.unicode}</strong></div><p>{rendering.explanation}</p></article>)}</div>
            {computed.result.analysis.adaptations.length > 0 && <div className="adaptation-note"><strong>Sound changes</strong><ul>{computed.result.analysis.adaptations.map((adaptation) => <li key={`${adaptation.ruleId}-${adaptation.after}`}>{adaptation.explanation}</li>)}</ul></div>}
          </section>
        )}

        <section className="method-section" id="method" aria-labelledby="method-title">
          <p className="eyebrow">A quick note</p><h2 id="method-title">Baybayin follows sound, not English spelling.</h2>
          <div className="method-copy"><p>Pantig asks how you say your name, breaks that bigkas into pantig, and shows a suggested Baybayin spelling you can inspect.</p>
            <p>Pantig is a learning and transliteration aid. Its current rules and examples have not yet received expert linguistic review.</p>
            <div className="sources-note"><strong>Sources and notes</strong><p>Learn more from the{' '}
              <a href="https://www.nationalmuseum.gov.ph/exhibitions/anthropology/baybayin/" target="_blank" rel="noreferrer">National Museum of the Philippines</a>, the{' '}
              <a href="https://unicode.org/versions/Unicode17.0.0/core-spec/chapter-17/" target="_blank" rel="noreferrer">Unicode Standard</a>, and the{' '}
              <a href="https://ncca.gov.ph/wp-content/uploads/2021/09/PHILIPPINE-HISTORY-SOURCE-BOOK-FINAL-SEP022021.pdf" target="_blank" rel="noreferrer">NCCA Philippine History Source Book</a>.</p>
              <p>These sources explain the script; they do not certify one official spelling for a person’s name.</p></div>
          </div>
        </section>
      </main>

      <footer className="flex min-h-[100px] items-center justify-between border-t border-line text-[13px] text-muted dark:text-[#9da8a2] max-[660px]:flex-col max-[660px]:items-start max-[660px]:justify-center max-[660px]:gap-2">
        <span className="font-[760] tracking-[0.13em] text-ink uppercase">Pantig</span><span>Discover your name in Baybayin.{' '}
          <a className="font-bold text-inherit underline-offset-4 hover:text-ink" href="https://github.com/ogbinar/baybayin" target="_blank" rel="noreferrer">View the code on GitHub</a></span>
      </footer>
    </div>
  );
}

export default App;
