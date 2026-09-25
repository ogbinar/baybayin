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
      error: error instanceof Error ? error.message : 'The phonetic spelling could not be processed.',
    };
  }
}

function showResult() {
  window.requestAnimationFrame(() => {
    document.getElementById('result')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  });
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
  const activeCandidate = candidates.find((candidate) => candidate.id === selectedCandidate);

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
    showResult();
  };

  const chooseCandidate = (candidate: PronunciationCandidate) => {
    setSelectedCandidate(candidate.id);
    setPhonetic(candidate.phonetic);
    setCopyState('idle');
    showResult();
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
    <div className="site-shell mx-auto w-full max-w-[1480px] px-[42px] max-[980px]:px-6 max-[660px]:px-[14px]">
      <header className="site-header flex min-h-[90px] items-center justify-between border-b border-line max-[660px]:min-h-[74px]">
        <a className="brand inline-flex items-center gap-3 text-xl font-[680] tracking-[0.08em] text-ink no-underline uppercase" href="#top" aria-label="Pantig home">
          <span className="brand-mark">ᜉ</span>
          <span>Pantig</span>
        </a>
        <div className="header-actions flex items-center gap-[18px] max-[660px]:gap-[9px]">
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
          <a className="method-link text-brown underline-offset-[5px] max-[660px]:text-[13px]" href="#method">How it works</a>
        </div>
      </header>

      <main id="top">
        <section className="hero grid grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] items-end gap-16 pt-[46px] pb-[34px] max-[660px]:grid-cols-1 max-[660px]:gap-4 max-[660px]:px-1 max-[660px]:pt-[52px] max-[660px]:pb-[38px]" aria-labelledby="hero-title">
          <p className="eyebrow col-span-full -mb-[46px] max-[660px]:col-span-1 max-[660px]:mb-0">Baybayin for your name</p>
          <h1 className="mb-0 max-w-[680px] text-[clamp(42px,5.5vw,76px)] leading-[0.98] font-[520] tracking-[-0.055em] max-[660px]:text-[clamp(46px,15vw,68px)]" id="hero-title">Your name, written by sound.</h1>
          <div className="hero-support">
            <p className="hero-copy mb-0 max-w-[620px] text-[clamp(18px,2vw,23px)] leading-[1.55] text-[#4d5e59] dark:text-[#bcc6c0] max-[660px]:text-[17px]">
              Baybayin follows how a name is said, not how it is spelled. Choose the closest
              bigkas, check each pantig, and save the result.
            </p>
            <a className="hero-link mt-4 inline-block text-[13px] font-bold text-brown underline-offset-[5px]" href="#name">Try your name ↓</a>
          </div>
        </section>

        <section className="workbench" aria-label="Baybayin name transliterator">
          <div className="control-panel">
            <div className="step-heading">
              <span>01</span>
              <div>
                <h2>Enter a name</h2>
                <p>Start with the name as you normally write it.</p>
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
                <button type="submit">Show pronunciations</button>
              </div>
              {inputError && <p className="field-error" id="name-error">{inputError}</p>}
            </form>

            <div className="step-block">
              <div className="step-heading compact">
                <span>02</span>
                <div>
                  <h2>How do you say it?</h2>
                  <p>Choose the closest pronunciation. You can edit it below.</p>
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
                    {candidate.recommended && <em>Suggested</em>}
                  </button>
                ))}
              </div>

              <label className="phonetic-label" htmlFor="phonetic">
                Bigkas — how it sounds
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

              {activeCandidate?.notes[0] && (
                <p className="candidate-guidance">{activeCandidate.notes[0]}</p>
              )}

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

          <div className="result-panel" id="result" aria-live="polite">
            <div className="result-topline">
              <span>03 · Suggested Baybayin spelling</span>
              <span className="privacy-note">Private · nothing uploaded</span>
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
                <p className="result-guidance">
                  Based on the bigkas you chose. Other spellings may also be valid.
                </p>

                {computed.result.warnings.length > 0 && (
                  <ul className="result-warnings">
                    {computed.result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                )}

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
                <p className="download-note">
                  For a tattoo or permanent design, ask a Baybayin teacher or experienced
                  practitioner to review the bigkas, convention, and spelling.
                </p>
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
              <p className="eyebrow">See the breakdown</p>
              <h2 id="explanation-title">How each pantig was written</h2>
              <p>Each pantig is shown beside the Baybayin characters used for it.</p>
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
                <strong>Sound changes</strong>
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
              <p className="eyebrow">Compare the options</p>
              <h2 id="comparison-title">Other ways to write the same sound</h2>
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
          <p className="eyebrow">A quick note</p>
          <h2 id="method-title">This is a suggested spelling, not the only valid one.</h2>
          <div className="method-copy">
            <p>
              Baybayin is written by syllable and does not preserve every sound found in modern
              names. Pantig starts with your chosen bigkas and shows where sounds were changed.
            </p>
            <p>
              Pantig is a learning and transliteration aid. Its current rules and examples have not
              yet received expert linguistic review.
            </p>
            <div className="sources-note">
              <strong>Sources and notes</strong>
              <p>
                Learn more from the{' '}
                <a href="https://www.nationalmuseum.gov.ph/exhibitions/anthropology/baybayin/" target="_blank" rel="noreferrer">
                  National Museum of the Philippines
                </a>, the{' '}
                <a href="https://unicode.org/versions/Unicode17.0.0/core-spec/chapter-17/" target="_blank" rel="noreferrer">
                  Unicode Standard
                </a>, and the{' '}
                <a href="https://ncca.gov.ph/wp-content/uploads/2021/09/PHILIPPINE-HISTORY-SOURCE-BOOK-FINAL-SEP022021.pdf" target="_blank" rel="noreferrer">
                  NCCA Philippine History Source Book
                </a>.
              </p>
              <p>
                Pantig’s suggestions for modern names are editable sound matches created by this
                tool. These sources explain the script; they do not certify one official spelling
                for a person’s name.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex min-h-[100px] items-center justify-between border-t border-line text-[13px] text-muted dark:text-[#9da8a2] max-[660px]:flex-col max-[660px]:items-start max-[660px]:justify-center max-[660px]:gap-2">
        <span className="font-[760] tracking-[0.13em] text-ink uppercase">Pantig</span>
        <span>
          A guide to writing names by sound.{' '}
          <a className="font-bold text-inherit underline-offset-4 hover:text-ink" href="https://github.com/ogbinar/baybayin" target="_blank" rel="noreferrer">
            View the code on GitHub
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;
