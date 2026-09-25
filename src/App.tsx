import { useEffect, useMemo, useRef, useState } from 'react';

import {
  getPronunciationCandidates,
  titleCaseName,
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

type ViewState = 'name' | 'result';
type InteractiveGlyph =
  | { kind: 'token'; id: string; token: GlyphToken }
  | { kind: 'separator'; id: string; unicode: string };

const CONVENTIONS: Array<{ id: Convention; label: string; detail: string }> = [
  { id: 'pamudpod', label: 'Modern · Pamudpod', detail: 'Final sounds are shown' },
  { id: 'virama', label: 'Modern · Virama', detail: 'Uses the cross-shaped mark' },
  { id: 'traditional', label: 'Traditional-style', detail: 'May leave final sounds unwritten' },
];

function initialColorTheme(): ColorTheme {
  const stored = window.localStorage.getItem('pantig-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function buildResult(phonetic: string, convention: Convention) {
  if (!phonetic.trim()) return { result: null, error: '' };
  try {
    return { result: transliterate(phonetic, convention), error: '' };
  } catch (error) {
    return {
      result: null,
      error: error instanceof Error ? error.message : 'Pantig could not read that pronunciation.',
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
  const [view, setView] = useState<ViewState>('name');
  const [name, setName] = useState('');
  const [confirmedName, setConfirmedName] = useState('');
  const [candidates, setCandidates] = useState<PronunciationCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [draftPhonetic, setDraftPhonetic] = useState('');
  const [pronunciationOpen, setPronunciationOpen] = useState(false);
  const [manualError, setManualError] = useState('');
  const [convention, setConvention] = useState<Convention>('pamudpod');
  const [textFlow, setTextFlow] = useState<TextFlow>('horizontal');
  const [imageBackground, setImageBackground] = useState<ImageBackground>('transparent');
  const [inputError, setInputError] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [exportState, setExportState] = useState('');
  const [shareState, setShareState] = useState('');
  const [selectedGlyphId, setSelectedGlyphId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = colorTheme;
    window.localStorage.setItem('pantig-theme', colorTheme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', colorTheme === 'dark' ? '#101918' : '#f4efe5',
    );
  }, [colorTheme]);

  const computed = useMemo(() => buildResult(phonetic, convention), [phonetic, convention]);
  const glyphs = useMemo(() => computed.result ? resultGlyphs(computed.result) : [], [computed.result]);
  const selectedGlyph = glyphs.find(
    (glyph): glyph is Extract<InteractiveGlyph, { kind: 'token' }> =>
      glyph.kind === 'token' && glyph.id === selectedGlyphId,
  );
  const activeCandidate = candidates.find((candidate) => candidate.id === selectedCandidate);
  const pronunciationDisplay = activeCandidate?.phonetic === phonetic
    ? activeCandidate.display
    : titleCaseName(phonetic);

  const resetResultOptions = () => {
    setConvention('pamudpod');
    setTextFlow('horizontal');
    setImageBackground('transparent');
    setCopyState('idle');
    setExportState('');
    setShareState('');
    setSelectedGlyphId(null);
  };

  const focusResult = () => {
    window.requestAnimationFrame(() => {
      resultHeadingRef.current?.focus({ preventScroll: true });
      document.getElementById('result')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    });
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
    setDraftPhonetic(recommended.phonetic);
    setPronunciationOpen(false);
    setManualError('');
    resetResultOptions();
    setView('result');
    setAnnouncement(`Suggested Baybayin spelling for ${data.validation.value}, read as ${recommended.display}.`);
    focusResult();
  };

  const chooseCandidate = (candidate: PronunciationCandidate) => {
    setSelectedCandidate(candidate.id);
    setPhonetic(candidate.phonetic);
    setDraftPhonetic(candidate.phonetic);
    setPronunciationOpen(false);
    setManualError('');
    setSelectedGlyphId(null);
    setCopyState('idle');
    setExportState('');
    setShareState('');
    setAnnouncement(`Pronunciation changed to ${candidate.display}. Baybayin suggestion updated.`);
  };

  const applyManualPronunciation = (event: React.FormEvent) => {
    event.preventDefault();
    const trial = buildResult(draftPhonetic, 'pamudpod');
    if (!trial.result) {
      setManualError(trial.error || 'Write the pronunciation using supported sounds.');
      return;
    }
    const normalized = draftPhonetic.trim().toLocaleLowerCase('en');
    setPhonetic(normalized);
    setDraftPhonetic(normalized);
    setSelectedCandidate('user');
    setPronunciationOpen(false);
    setManualError('');
    setSelectedGlyphId(null);
    setCopyState('idle');
    setExportState('');
    setShareState('');
    setAnnouncement(`Pronunciation changed to ${titleCaseName(normalized)}. Baybayin suggestion updated.`);
  };

  const tryAnotherName = () => {
    setView('name');
    setName('');
    setInputError('');
    setPronunciationOpen(false);
    setAnnouncement('');
    window.requestAnimationFrame(() => nameInputRef.current?.focus());
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
    const text = `${confirmedName} in Baybayin: ${computed.result.unicode}\nPantig read the name as “${pronunciationDisplay}”. This is one suggested modern spelling.`;
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
      setShareState('Could not share this result. Try Save instead.');
    }
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Pantig home">
          <span className="brand-mark">ᜉ</span><span>Pantig</span>
        </a>
        <div className="header-actions">
          <div className="theme-picker" role="radiogroup" aria-label="Color theme">
            {(['light', 'dark'] as const).map((theme) => (
              <button type="button" key={theme} role="radio" aria-checked={colorTheme === theme}
                className={colorTheme === theme ? 'active' : ''} onClick={() => setColorTheme(theme)}>
                {theme === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
          <a className="method-link" href="#method">About</a>
        </div>
      </header>

      <main id="top">
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>

        {view === 'name' && (
          <section className="landing" aria-labelledby="landing-title">
            <p className="eyebrow">Pantig · Your name in Baybayin</p>
            <h1 id="landing-title">See your name in Baybayin.</h1>
            <p className="landing-copy">Pantig writes the sound of your name—not just its English spelling.</p>
            <form className="landing-form" onSubmit={handleGenerate} noValidate>
              <label htmlFor="name">Your name</label>
              <div className="input-row">
                <input ref={nameInputRef} id="name" value={name} placeholder="Michel"
                  onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="name"
                  autoFocus aria-describedby={inputError ? 'name-error' : 'name-help'} />
                <button type="submit">Show me</button>
              </div>
              <p className="name-help" id="name-help">You can check or change the pronunciation after.</p>
              {inputError && <p className="field-error" id="name-error">{inputError}</p>}
            </form>
          </section>
        )}

        {view === 'result' && computed.result && (
          <section className="result-experience" id="result" aria-labelledby="result-heading">
            <div className="result-card">
              <p className="result-qualifier">One way to write {confirmedName} in modern Baybayin</p>
              <h1 className="result-heading" id="result-heading" tabIndex={-1} ref={resultHeadingRef}>
                {confirmedName} in Baybayin
              </h1>
              <div className="baybayin-hero" data-testid="baybayin-result" role="img"
                aria-label={`Suggested modern Baybayin spelling for ${confirmedName}, interpreted as ${pronunciationDisplay}`}>
                {computed.result.unicode}
              </div>
              <p className="result-name">{confirmedName}</p>
              <div className="pronunciation-summary" id="result-context">
                <span>We read this as: <strong>{pronunciationDisplay}</strong></span>
                <button type="button" aria-expanded={pronunciationOpen} aria-controls="pronunciation-editor"
                  onClick={() => { setPronunciationOpen((open) => !open); setDraftPhonetic(phonetic); setManualError(''); }}>
                  Change pronunciation
                </button>
              </div>

              {pronunciationOpen && (
                <div className="pronunciation-editor" id="pronunciation-editor">
                  <p>Choose the closest pronunciation (bigkas), or write your own.</p>
                  <div className="candidate-list" role="radiogroup" aria-label="Pronunciation choices">
                    {candidates.map((candidate) => (
                      <button className="candidate-card" key={candidate.id} type="button" role="radio"
                        aria-checked={selectedCandidate === candidate.id} onClick={() => chooseCandidate(candidate)}>
                        <span><strong>{candidate.display}</strong><small>{candidate.label}</small></span>
                        {candidate.recommended && <em>Suggested</em>}
                      </button>
                    ))}
                  </div>
                  <form className="manual-pronunciation" onSubmit={applyManualPronunciation} noValidate>
                    <label htmlFor="phonetic">I say it differently <span>Write it the way it sounds.</span></label>
                    <div className="input-row">
                      <input id="phonetic" aria-label="Phonetic spelling" value={draftPhonetic}
                        onChange={(event) => { setDraftPhonetic(event.target.value); setManualError(''); }} spellCheck={false} />
                      <button type="submit">Use this sound</button>
                    </div>
                    {manualError && <p className="field-error" role="alert">{manualError}</p>}
                  </form>
                </div>
              )}

              <div className="primary-result-actions">
                <button type="button" onClick={copyResult}>{copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy'}</button>
                <button className="primary-action" type="button" onClick={() => runExport('image', async () => {
                  const { downloadCardPng } = await import('./export/image');
                  await downloadCardPng(confirmedName, computed.result!, textFlow);
                })}>Save</button>
                <button type="button" onClick={shareResult}>Share</button>
              </div>
              {(exportState || shareState || copyState !== 'idle') && (
                <p className="action-status" role="status">
                  {shareState || exportState || (copyState === 'copied' ? 'Baybayin copied.' : copyState === 'error' ? 'Copy failed.' : '')}
                </p>
              )}

              <div className="transformation-trail" aria-label="How the name became Baybayin">
                <span><small>Written name</small><strong>{confirmedName}</strong></span><b aria-hidden="true">→</b>
                <span><small>We read it as</small><strong>{pronunciationDisplay}</strong></span><b aria-hidden="true">→</b>
                <span><small>Syllables · pantig</small><strong>{syllableLine(computed.result)}</strong></span><b aria-hidden="true">→</b>
                <span><small>Baybayin</small><strong className="baybayin-trail">{computed.result.unicode}</strong></span>
              </div>

              {computed.result.warnings.length > 0 && (
                <ul className="result-warnings">{computed.result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
              )}

              <details className="result-disclosure why-disclosure">
                <summary>Why is it written this way?</summary>
                <div className="disclosure-body">
                  <p>Baybayin follows sound. Pantig split “{pronunciationDisplay}” into syllables, then wrote each one below.</p>
                  <div className="mapping-grid">
                    {computed.result.renderings.map((rendering) => (
                      <article className="mapping-card" key={rendering.syllable.index}>
                        <div className="mapping-pair"><span>{rendering.syllable.source}</span><span aria-hidden="true">→</span><strong className="baybayin-inline">{rendering.unicode}</strong></div>
                        <p>{rendering.explanation}</p>
                      </article>
                    ))}
                  </div>
                  <div className="glyph-learning">
                    <p><strong>Explore the characters</strong><br />Select a symbol for a short explanation.</p>
                    <div className="glyph-inspector" aria-label="Baybayin character explanations">
                      {glyphs.map((glyph) => glyph.kind === 'separator' ? (
                        <span className="glyph-separator" key={glyph.id}>{glyph.unicode}</span>
                      ) : (
                        <button className={selectedGlyphId === glyph.id ? 'selected' : ''} key={glyph.id}
                          type="button" aria-label={`Explain ${glyph.token.source}`} aria-pressed={selectedGlyphId === glyph.id}
                          onClick={() => setSelectedGlyphId(selectedGlyphId === glyph.id ? null : glyph.id)}>{glyph.token.unicode}</button>
                      ))}
                    </div>
                    {selectedGlyph && (
                      <div className="glyph-explanation" aria-live="polite">
                        <strong><span className="baybayin-inline">{selectedGlyph.token.unicode}</span> writes “{selectedGlyph.token.source}”</strong>
                        <p>{selectedGlyph.token.explanation}</p>
                      </div>
                    )}
                  </div>
                  {computed.result.analysis.adaptations.length > 0 && (
                    <div className="adaptation-note"><strong>What Pantig changed</strong><ul>
                      {computed.result.analysis.adaptations.map((adaptation) => <li key={`${adaptation.ruleId}-${adaptation.after}`}>{adaptation.explanation}</li>)}
                    </ul></div>
                  )}
                  <p className="education-note">Another pronunciation may lead to another spelling. This is a learning aid, not an official spelling.</p>
                </div>
              </details>

              <details className="result-disclosure options-disclosure">
                <summary>More options</summary>
                <div className="disclosure-body">
                  <p>Compare writing styles or prepare a different image.</p>
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
                  <div className={`export-preview flow-${textFlow} background-${imageBackground}`} data-testid="glyph-preview">
                    <span>{computed.result.unicode}</span>
                  </div>
                  <div className="secondary-downloads">
                    <button type="button" onClick={() => runExport('styled PNG', async () => {
                      const { downloadGlyphPng } = await import('./export/image');
                      await downloadGlyphPng(confirmedName, computed.result!, textFlow, imageBackground);
                    })}>Download styled image</button>
                    <button type="button" onClick={() => runExport('SVG card', async () => {
                      const { downloadCardSvg } = await import('./export/image');
                      await downloadCardSvg(confirmedName, computed.result!, textFlow);
                    })}>Download SVG</button>
                  </div>
                  <p className="permanent-note">For a tattoo or permanent design, ask an experienced Baybayin reader to review the pronunciation and spelling.</p>
                </div>
              </details>

              <button className="try-another" type="button" onClick={tryAnotherName}>Try another name</button>
            </div>
          </section>
        )}

        <section className="method-section" id="method" aria-labelledby="method-title">
          <div><p className="eyebrow">A quick note</p><h2 id="method-title">Baybayin follows sound, not English spelling.</h2></div>
          <div className="method-copy"><p>Pantig makes a best guess, shows how it read the name, and lets you change that pronunciation at any time.</p>
            <p>Pantig is a learning and transliteration aid. Its current rules and examples have not yet received expert linguistic review.</p>
            <div className="sources-note"><strong>Sources and notes</strong><p>Learn more from the{' '}
              <a href="https://www.nationalmuseum.gov.ph/exhibitions/anthropology/baybayin/" target="_blank" rel="noreferrer">National Museum of the Philippines</a>, the{' '}
              <a href="https://unicode.org/versions/Unicode17.0.0/core-spec/chapter-17/" target="_blank" rel="noreferrer">Unicode Standard</a>, and the{' '}
              <a href="https://ncca.gov.ph/wp-content/uploads/2021/09/PHILIPPINE-HISTORY-SOURCE-BOOK-FINAL-SEP022021.pdf" target="_blank" rel="noreferrer">NCCA Philippine History Source Book</a>.</p>
              <p>These sources explain the script; they do not certify one official spelling for a person’s name.</p></div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>Pantig</span><span>Discover your name in Baybayin.{' '}
          <a href="https://github.com/ogbinar/baybayin" target="_blank" rel="noreferrer">View the code on GitHub</a></span>
      </footer>
    </div>
  );
}

export default App;
