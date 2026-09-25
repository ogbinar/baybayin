# Baybayin Name Studio — Initial Vision

## Product vision

Create a simple, trustworthy website that helps a person write their name in
Baybayin based on how the name is pronounced—not by mechanically replacing
Latin letters one at a time.

The product should make ambiguity visible. When a name has more than one
reasonable pronunciation or Filipino phonetic form, the site should offer
alternatives, explain the differences, and let the person choose or correct
the intended pronunciation.

The working promise is:

> See your name in Baybayin, based on how you actually pronounce it.

## The problem

Baybayin is an abugida organized around vowel and consonant-vowel sounds.
Modern names—especially names inherited from English, Spanish, Chinese, and
other languages—cannot always be converted faithfully from their spelling
alone.

A conventional character-replacement tool can therefore produce a confident
but misleading answer. The same written name may have several valid
pronunciations, and sounds such as `j`, `f`, `v`, `z`, `ch`, and consonant
clusters may require adaptation.

For example, **Angelica** might first be interpreted as one of several
phonetic forms:

- **Anjelika** — a common English/Filipino-style pronunciation
- **Andiyelika** — a more explicitly phonetic Filipino rendering
- **Anghelika** — a localized alternative with a different sound and nuance

These are pronunciation candidates, not interchangeable declarations of one
historically definitive spelling.

## Product principles

1. **Pronunciation before script**  
   Determine or confirm how the name sounds before generating Baybayin.

2. **Alternatives before false certainty**  
   Show plausible variants when the spelling is ambiguous. Recommend a likely
   form, but never present a guess as the only correct answer.

3. **Explain every transformation**  
   Show the phonetic spelling, syllable breakdown, and Baybayin mapping so the
   result can be understood and checked.

4. **Deterministic conversion at the core**  
   Use explicit, testable transliteration rules for the final conversion. AI
   may suggest and rank pronunciations, but it should not silently invent the
   Baybayin result.

5. **Cultural care without pretending uniformity**  
   Explain that Baybayin usage has historical and modern conventions. Avoid
   implying that one contemporary convention represents every region,
   community, or scholar.

6. **The user has the final word**  
   Let the person edit the phonetic form and syllable boundaries because they
   know how their own name is pronounced.

## Core experience

The primary journey should take less than a minute:

1. The user enters a name.
2. The site proposes one or more Filipino-friendly phonetic forms.
3. The user selects a pronunciation or edits it directly.
4. The site divides the form into syllables.
5. The site renders the result in modern Baybayin.
6. The user can inspect the mapping, compare a traditional convention, and
   copy or download the result.

The result screen should answer four questions clearly:

- What does the name look like in Baybayin?
- How is this version pronounced?
- How was each syllable converted?
- What other reasonable renderings are available?

## Output modes

### Modern precise form

Use an explicit final-consonant convention, such as a supported virama or
pamudpod approach, so modern names can be represented more precisely. The UI
must identify the convention used rather than treating “modern Baybayin” as a
single universal standard.

### Traditional-style form

Offer an educational comparison based on the older syllabic convention, where
final consonants may be omitted or ambiguous. The site should warn when this
changes how a modern reader may interpret the name.

### Filipino-natural form

Offer phonetic adaptations that make foreign-origin names more natural to
pronounce using Filipino sound patterns. These should remain optional and
should not overwrite the user's preferred pronunciation.

## MVP scope

The first useful release should include:

- a single-name input;
- likely pronunciation or phonetic-form suggestions;
- an editable phonetic spelling;
- a visible syllable breakdown;
- deterministic Baybayin generation;
- one clearly documented modern convention;
- a traditional-style comparison;
- explanations for substitutions and ambiguous sounds;
- copy-to-clipboard support;
- downloadable PNG and SVG outputs;
- a concise methodology and limitations page;
- responsive, accessible behavior on phones and desktops.

## Explicit non-goals for the first release

- claiming to translate the meaning of a name;
- claiming one universally correct Baybayin spelling;
- supporting sentences or general-purpose translation;
- accounts, profiles, or social features;
- community voting or crowdsourced corrections;
- batch conversion;
- tattoo certification or guarantees;
- allowing an LLM to produce unexplained final script output.

## Trust and safety

The site should label the operation correctly as **transliteration**, not
translation. It should also recommend independent review by a knowledgeable
reader before the output is used for permanent, legal, ceremonial, or
high-stakes purposes such as tattoos or official branding.

All examples and rules should eventually be reviewed against credible
historical and contemporary references. Font support, Unicode normalization,
combining marks, and export rendering must be tested across major browsers and
mobile devices.

## Visual direction

The experience should feel Filipino and contemporary rather than resembling a
generic “ancient parchment” generator.

- Make the Baybayin result the visual hero.
- Use a calm editorial layout with warm ivory, ink, and a restrained accent.
- Use subtle local texture without turning cultural motifs into decoration.
- Animate the transformation from pronunciation to syllables to Baybayin.
- Keep educational detail available without crowding the primary action.

## Technical direction

The core can begin as a small rule-driven library with three layers:

```text
written name
    → pronunciation candidates
    → confirmed phonetic syllables
    → Baybayin tokens and rendered output
```

Each result should retain a structured explanation of which rule produced each
token. This makes the engine testable, permits future scholarly review, and
keeps the UI independent from the conversion implementation.

AI assistance, if introduced, should be bounded to pronunciation discovery,
language-of-origin hints, and plain-language explanations. The deterministic
engine remains the authority for rendering.

## Initial success criteria

The MVP succeeds when:

- a first-time user can obtain and understand a result in under one minute;
- users can correct a wrong pronunciation without restarting;
- every displayed glyph can be traced to a phonetic syllable and rule;
- common Filipino and foreign-origin test names render consistently;
- the experience clearly communicates uncertainty and convention choices;
- exported output matches the on-screen result across supported devices.

## Open decisions

- Final product name: **Pantig**, **Pangalan sa Baybayin**, or another name.
- Which modern final-consonant convention will be the default.
- Whether pronunciation suggestions should begin with deterministic rules, a
  curated name dictionary, AI assistance, or a combination.
- Which historical and contemporary references will form the documented rule
  basis.
- Whether the first release should include audio pronunciation.
- The initial language-of-origin options and how strongly they should affect
  suggestions.

## North-star boundary

This product is not a novelty font converter. It is a pronunciation-aware,
explainable writing assistant that helps people make an informed and personal
choice about how their name can be represented in Baybayin.
