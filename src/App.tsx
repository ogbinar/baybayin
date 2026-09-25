import { useEffect, useMemo, useState } from 'react';

import {
  getPronunciationCandidates,
  transliterate,
  type Convention,
  type PronunciationCandidate,
  type TransliterationResult,
} from './domain';
import {
  IMAGE_BACKGROUNDS,
  splitBaybayinClusters,
  TEXT_FLOWS,
  type ColorTheme,
  type ImageBackground,
  type TextFlow,
} from './presentation';
import './styles.css';

const CONVENTIONS: Array<{ id: Convention; label: string; detail: string }> = [
  { id: 'pamudpod', label: 'Pamudpod', detail: 'Modern default' },
  { id: 'virama', label: 'Virama', detail: 'Cross-shaped killer' },
  { id: 'traditional', label: 'Traditional', detail: 'Ambiguous comparison' },
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
      error: error instanceof Error ? error.message : 'The phonetic spelling could not be processed.',
    };
  }
}

function App() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(initialColorTheme);
  const [name, setName] = useState('Michel');
  const [confirmedName, setConfirmedName] = useState('Michel');
  const [candidates, setCandidates] = useState<PronunciationCandidate[]>(
    initialCandidateData.candidates,
  );
  const [selectedCandidate, setSelectedCandidate] = useState(initialCandidate.id);
  const [phonetic, setPhonetic] = useState(initialCandidate.phonetic);
  const [convention, setConvention] = useState<Convention>('pamudpod');
  const [textFlow, setTextFlow] = useState<TextFlow>('horizontal');
  const [imageBackground, setImageBackground] = useState<ImageBackground>('transparent');
  const [inputError, setInputError] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [exportState, setExportState] = useState('');

  useEffect(() => {
    document.documentElement.dataset.theme = colorTheme;
    window.localStorage.setItem('pantig-theme', colorTheme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      colorTheme === 'dark' ? '#101918' : '#f1eadc',
    );
  }, [colorTheme]);

  const computed = useMemo(() => buildResult(phonetic, convention), [phonetic, convention]);
  const comparisons = useMemo(() => {
    if (!computed.result) return [];
    return CONVENTIONS.map((item) => ({
      ...item,
      result: buildResult(phonetic, item.id).result,
    })).filter((item): item is typeof item & { result: TransliterationResult } => Boolean(item.result));
  }, [computed.result, phonetic]);

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
    setConvention('pamudpod');
    setTextFlow('horizontal');
    setImageBackground('transparent');
    setCopyState('idle');
  };

  const chooseCandidate = (candidate: PronunciationCandidate) => {
    setSelectedCandidate(candidate.id);
    setPhonetic(candidate.phonetic);
    setCopyState('idle');
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

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Pantig home">
          <span className="brand-mark">ᜉ</span>
          <span>Pantig</span>
        </a>
        <div className="header-actions">
          <div className="theme-picker" role="radiogroup" aria-label="Color theme">
            {(['light', 'dark'] as const).map((theme) => (
              <button
                type="button"
                key={theme}
                role="radio"
                aria-checked={colorTheme === theme}
                className={colorTheme === theme ? 'active' : ''}
                onClick={() => setColorTheme(theme)}
              >
                {theme === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
          <a className="method-link" href="#method">How it works</a>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">Pronunciation-aware Baybayin</p>
          <h1 id="hero-title">Your name, written by sound.</h1>
          <p className="hero-copy">
            Baybayin follows syllables, not English spelling. Choose how your name sounds,
            inspect every step, then save the result.
          </p>
        </section>

        <section className="workbench" aria-label="Baybayin name transliterator">
          <div className="control-panel">
            <div className="step-heading">
              <span>01</span>
              <div>
                <h2>Enter a name</h2>
                <p>We will suggest a Filipino-friendly pronunciation.</p>
              </div>
            </div>

            <form className="name-form" onSubmit={handleGenerate} noValidate>
              <label htmlFor="name">Name</label>
              <div className="input-row">
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  autoComplete="name"
                  aria-describedby={inputError ? 'name-error' : undefined}
                />
                <button type="submit">Find its form</button>
              </div>
              {inputError && <p className="field-error" id="name-error">{inputError}</p>}
            </form>

            <div className="step-block">
              <div className="step-heading compact">
                <span>02</span>
                <div>
                  <h2>Choose the sound</h2>
                  <p>Your pronunciation is the source of truth.</p>
                </div>
              </div>

              <div className="candidate-list" role="radiogroup" aria-label="Pronunciation candidates">
                {candidates.map((candidate) => (
                  <button
                    className={`candidate-card ${selectedCandidate === candidate.id ? 'selected' : ''}`}
                    key={candidate.id}
                    type="button"
                    role="radio"
                    aria-checked={selectedCandidate === candidate.id}
                    onClick={() => chooseCandidate(candidate)}
                  >
                    <span>
                      <strong>{candidate.display}</strong>
                      <small>{candidate.label}</small>
                    </span>
                    {candidate.recommended && <em>Recommended</em>}
                  </button>
                ))}
              </div>

              <label className="phonetic-label" htmlFor="phonetic">
                Phonetic spelling
                <span>Edit this until it matches how you say your name.</span>
              </label>
              <input
                className="phonetic-input"
                id="phonetic"
                aria-label="Phonetic spelling"
                value={phonetic}
                onChange={(event) => {
                  setPhonetic(event.target.value);
                  setSelectedCandidate('user');
                  setCopyState('idle');
                }}
                spellCheck={false}
              />

              {computed.result && (
                <div className="syllable-row" aria-label="Detected syllables">
                  {computed.result.analysis.parts.map((part, partIndex) =>
                    part.kind === 'separator' ? (
                      <span className="syllable-separator" key={`separator-${partIndex}`}>{part.source}</span>
                    ) : (
                      part.syllables.map((syllable) => (
                        <span className="syllable-chip" key={syllable.index}>{syllable.source}</span>
                      ))
                    ),
                  )}
                </div>
              )}
              {computed.error && <p className="field-error">{computed.error}</p>}
            </div>
          </div>

          <div className="result-panel" aria-live="polite">
            <div className="result-topline">
              <span>03 · Your Baybayin form</span>
              <span className="privacy-note">Runs on your device</span>
            </div>

            {computed.result ? (
              <>
                <div
                  className={`glyph-preview flow-${textFlow} background-${imageBackground}`}
                  data-testid="glyph-preview"
                >
                  <div className="baybayin-result" data-testid="baybayin-result">
                    {textFlow === 'vertical'
                      ? splitBaybayinClusters(computed.result.unicode).map((cluster, index) => (
                        <span key={`${cluster}-${index}`}>{cluster === ' ' ? '\u00a0' : cluster}</span>
                      ))
                      : computed.result.unicode}
                  </div>
                </div>
                <div className="result-name">{confirmedName}</div>
                <div className="result-phonetic">
                  {computed.result.analysis.syllables.map((syllable) => syllable.source).join(' · ')}
                </div>

                <div className="convention-picker" role="radiogroup" aria-label="Writing convention">
                  {CONVENTIONS.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={convention === item.id ? 'active' : ''}
                      role="radio"
                      aria-checked={convention === item.id}
                      onClick={() => setConvention(item.id)}
                    >
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </button>
                  ))}
                </div>

                <div className="design-options" aria-label="Image style">
                  <div>
                    <span className="option-label">Text flow</span>
                    <div className="segmented-picker" role="radiogroup" aria-label="Text flow">
                      {TEXT_FLOWS.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          className={textFlow === item.id ? 'active' : ''}
                          role="radio"
                          aria-checked={textFlow === item.id}
                          onClick={() => setTextFlow(item.id)}
                        >
                          <strong>{item.label}</strong>
                          <small>{item.detail}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="option-label">Image background</span>
                    <div className="background-picker" role="radiogroup" aria-label="Image background">
                      {IMAGE_BACKGROUNDS.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          className={imageBackground === item.id ? 'active' : ''}
                          role="radio"
                          aria-checked={imageBackground === item.id}
                          aria-label={item.label}
                          title={item.label}
                          onClick={() => setImageBackground(item.id)}
                        >
                          <span className={`background-swatch swatch-${item.id}`} />
                          <small>{item.label}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="result-actions">
                  <button className="primary-action" type="button" onClick={() => runExport('card PNG', async () => {
                    const { downloadCardPng } = await import('./export/image');
                    await downloadCardPng(confirmedName, computed.result!, textFlow);
                  })}>
                    Download card
                  </button>
                  <button type="button" onClick={copyResult}>
                    {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy text'}
                  </button>
                  <div className="more-downloads">
                    <button type="button" onClick={() => runExport('styled PNG', async () => {
                      const { downloadGlyphPng } = await import('./export/image');
                      await downloadGlyphPng(confirmedName, computed.result!, textFlow, imageBackground);
                    })}>Download image</button>
                    <button type="button" onClick={() => runExport('SVG card', async () => {
                      const { downloadCardSvg } = await import('./export/image');
                      await downloadCardSvg(confirmedName, computed.result!, textFlow);
                    })}>SVG</button>
                  </div>
                </div>
                {exportState && <p className="export-status" role="status">{exportState}</p>}
              </>
            ) : (
              <div className="empty-result">Adjust the phonetic spelling to continue.</div>
            )}
          </div>
        </section>

        {computed.result && (
          <section className="explanation-section" aria-labelledby="explanation-title">
            <div className="section-intro">
              <p className="eyebrow">Nothing hidden</p>
              <h2 id="explanation-title">How this form was built</h2>
              <p>Every syllable stays connected to the characters it produced.</p>
            </div>

            <div className="mapping-grid">
              {computed.result.renderings.map((rendering) => (
                <article className="mapping-card" key={rendering.syllable.index}>
                  <div className="mapping-pair">
                    <span>{rendering.syllable.source}</span>
                    <span aria-hidden="true">→</span>
                    <strong className="baybayin-inline">{rendering.unicode}</strong>
                  </div>
                  <p>{rendering.explanation}</p>
                </article>
              ))}
            </div>

            {computed.result.analysis.adaptations.length > 0 && (
              <div className="adaptation-note">
                <strong>Sound adaptations</strong>
                <ul>
                  {computed.result.analysis.adaptations.map((adaptation) => (
                    <li key={`${adaptation.ruleId}-${adaptation.after}`}>{adaptation.explanation}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {comparisons.length > 0 && (
          <section className="comparison-section" aria-labelledby="comparison-title">
            <div className="section-intro">
              <p className="eyebrow">Compare conventions</p>
              <h2 id="comparison-title">One sound, different writing choices</h2>
            </div>
            <div className="comparison-grid">
              {comparisons.map((item) => (
                <button type="button" key={item.id} className={convention === item.id ? 'selected' : ''} onClick={() => setConvention(item.id)}>
                  <span>{item.label}</span>
                  <strong className="baybayin-inline">{item.result.unicode}</strong>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="method-section" id="method" aria-labelledby="method-title">
          <p className="eyebrow">Our method</p>
          <h2 id="method-title">A careful suggestion, not a declaration.</h2>
          <div className="method-copy">
            <p>
              Baybayin represents syllables and does not preserve every sound found in modern names.
              Pantig asks for pronunciation, shows its adaptations, and lets you choose among documented conventions.
            </p>
            <p>
              Have a knowledgeable reader review the result before using it for a tattoo, legal mark,
              ceremony, or permanent identity design.
            </p>
          </div>
        </section>
      </main>

      <footer>
        <span>Pantig</span>
        <span>Built for informed, personal choices.</span>
      </footer>
    </div>
  );
}

export default App;
