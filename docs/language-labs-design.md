# Language labs — design (vocab recall, data-driven)

Status: design, ready to build. Author: pairing session 2026-06-18.

## Principle (don't violate this)

We are **not** building "an Arabic→Bangla lab" or "an IELTS lab." The language
pair + the words are **data** (a *deck*). We build a few **general lab modes**
that play any deck. One deck → many modes. This is the same rule as
Grapher/GeometryBoard: the creator declares the model, the engine plays it.
A new language pair = new rows of JSON, **zero new code**.

These labs are **DOM-based**, not SVG `Stage` scenes — vocab recall is card/button
UI, not spatial manipulation. They still ride the stage `useLearner` seam for
progress reporting and the labs `kit/controls` for themed UI. (Kids' picture
cards use emoji first, an SVG icon set later — still just deck data.)

This passes the interactive-vs-video bar: the interaction is **retrieval
practice** (the testing effect), not a fake animation. Grammar *explanation*
stays in video/text; these labs are for **practice/recall**.

## The deck (the one authorable model)

```ts
// src/language/deck.ts
export interface DeckItem {
  /** The word/phrase being taught (target-language side). */
  term: string;
  /** Its meaning in the learner's language. */
  translation: string;
  /** Optional romanization/pronunciation aid (e.g. Arabic → "kitāb"). */
  transliteration?: string;
  /** Optional audio: uploaded media URL OR external URL. No generation. */
  audioUrl?: string;
  /** Optional picture for kids/visual decks: an emoji or a registered SVG id. */
  icon?: string;
  /** Optional usage example (target language). */
  example?: string;
  /** Optional grouping/filtering. */
  tags?: string[];
}

export interface Deck {
  title?: string;
  /** BCP-47 of the term side, e.g. 'en-US', 'ar', 'fr-FR', 'bn-BD'.
   *  Used for browser-TTS voice lookup + text direction. */
  termLang: string;
  /** BCP-47 of the translation side. */
  transLang: string;
  items: DeckItem[];
}

export type TextDir = 'ltr' | 'rtl';
export function dirFor(lang: string): TextDir {
  return /^(ar|fa|ur|he|ps|sd)\b/i.test(lang) ? 'rtl' : 'ltr';
}
```

Per-field direction is derived from `termLang`/`transLang` so Arabic (RTL) and
Bangla/Latin (LTR) render correctly in the same deck. Bake this in from day one.

## Audio resolution (browser-TTS default, no AI/generation)

Most decks are IELTS / English-side, where browser voices are universally
present, so **browser TTS is the default and is enough**. Creators can override
per item with an uploaded or external URL. The lab never *creates* audio.

```ts
// src/language/deck.ts (cont.)
//   1. item.audioUrl  → play <audio> (uploaded OR external URL)
//   2. browser speechSynthesis for `lang`, if a matching voice exists
//   3. none → caller hides the speaker button

export function hasVoiceFor(lang: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const base = lang.toLowerCase().split('-')[0];
  return speechSynthesis.getVoices().some(v => v.lang.toLowerCase().startsWith(base));
}

export function canSpeak(item: DeckItem, lang: string): boolean {
  return Boolean(item.audioUrl) || hasVoiceFor(lang);
}

/** Play an item's audio. Returns false if nothing was playable. */
export function speak(item: DeckItem, lang: string): boolean {
  if (typeof window === 'undefined') return false;
  if (item.audioUrl) { void new Audio(item.audioUrl).play().catch(() => {}); return true; }
  if ('speechSynthesis' in window && hasVoiceFor(lang)) {
    const u = new SpeechSynthesisUtterance(item.term);
    u.lang = lang;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    return true;
  }
  return false;
}
```

Voices load async — components call `speechSynthesis.onvoiceschanged` once to
re-check `canSpeak` and reveal the speaker button when voices arrive.

## Lab modes

| Mode | Interaction | Why it works | Build order |
|---|---|---|---|
| **Flashcard** | show prompt → reveal → self-grade (Got it / Again) | active recall; "Again" requeues to end of session | v1 |
| **Matching pairs** | **tap one side, tap its pair** → lock if correct (term↔translation, or term↔icon for kids) | recognition, fast wins, touch+keyboard friendly | v1 |
| **Listening** | tap speaker → choose/type the word | pronunciation; uses the audio resolver | v2 |
| **Multiple choice** | "which means X" | warm-up/quiz; trivial given existing quiz block | v2 |

Matching uses **tap-to-select-two**, not drag — accessible on mobile and via
keyboard, and simpler than the SVG drag used in math labs.

Each mode fires `useLearner().report({ activity, correct, score, completion })`
so lesson progress / xAPI is captured. **No cross-session SRS in v1** (that needs
per-learner persistence); the session loop ("Again" requeues) is the v1 substitute.

## Where each piece lives

New subpath `@classytic/labs/language` mirroring `/math`:

```
src/language/
  deck.ts                 # Deck/DeckItem types + dirFor + audio resolver (above)
  flashcard/
    preset.tsx            # FlashcardLab({ deck, ...opts })
    index.ts
  matching/
    preset.tsx            # MatchingLab({ deck, mode: 'translation'|'icon' })
    index.ts
  index.ts                # re-exports FlashcardLab, MatchingLab, types
```

Wiring (follow the exact existing patterns):
- **package.json** `exports`: add `"./language": { types/default → dist/language/index.* }`.
- **tsdown.config.ts** `entry`: add `'language/index': 'src/language/index.ts'`.
- **src/blocks/index.tsx**: add `FlashcardBlock` + `MatchingBlock` via `defineBlock`
  (deck authored as JSON in the config panel), then add both to `labsBlocks` and
  to the `labsComponents` render map (which also feed the `sciViz*` aliases).
- **Control UI**: a `Speaker` button + a `FlipCard` go in `src/kit/controls.tsx`
  (DOM kit), themed off `--stage-*`; `.lab-*` CSS rules added to `labs/styles.css`
  (NOT runtime-injected — see the LabStyles deprecation).
- **No `@classytic/stage` change needed** — language labs only consume `useLearner`.

## Authoring (humans and agents)

The `defineBlock` config panel lets a creator edit deck rows inline: term,
translation, optional transliteration, optional emoji/icon, optional audio URL
(reuse the **pick-from-library OR paste-URL** input pattern already used for
course covers). The whole deck round-trips through MDX as JSON, so an **agent can
author a deck** ("French→English, 20 food words, emoji + examples") and drop it
straight into a lesson.

## Quality gates (apply per lab)

- Every interactive element has an `aria-label`; correct/locked state announces
  via an `aria-live` region.
- Keyboard: Flashcard reveal/grade and Matching select are button-driven (focusable,
  Enter/Space).
- RTL: term/translation sides set `dir` from `dirFor(lang)`.
- Speaker button is hidden (not broken) when `canSpeak` is false.
- Deterministic: same deck → same initial render (shuffle seeded by item index,
  never `Math.random()` at module scope — matches the engine's SSR rule).

## Build order

1. `deck.ts` (schema + dir + audio resolver) + `Speaker`/`FlipCard` in kit + CSS.
2. `FlashcardLab` + `MatchingLab` (translation + icon modes).
3. Subpath wiring (package.json, tsdown, blocks registration).
4. `FlashcardBlock` + `MatchingBlock` authoring panels; verify MDX round-trip.
5. v2: `ListeningLab`, MCQ; later: SVG icon set, cross-session SRS via learner seam.

---

# Part 2 — Images, the grammar moat, and the Bangla→English demo

Added 2026-06-18 after global SLA + visual-grammar research (sources at bottom).

## The image decision (this is the important reframing)

"Image-based is best" is HALF right, and the half matters:

- **Pictorial images work for CONTENT words** — concrete nouns/verbs, spatial
  prepositions, countability. Dual coding + picture-superiority effect → better
  retention. Use real imagery here, ideally instead of an L1 translation gloss.
- **Pictorial images FAIL for FUNCTION words and grammar nuance** — you cannot
  draw "the", "of", "would", definiteness, or aspect. A literal picture there
  over-constrains meaning and misleads.
- **Grammar wants STRUCTURAL visuals, not pictures** — color, position,
  connecting lines, timelines, transformation motion. THIS is exactly what an SVG
  engine does and what apps like Duolingo do NOT do.

So: yes add SVG and creator-uploadable images — but the **moat is not prettier
vocab cards, it's interactive *structural* grammar** that you can see and move.
Duolingo teaches grammar implicitly through repetition; we teach it explicitly
and visually. That is the "smarter than Duolingo" wedge.

**Adopt the Montessori grammar-symbol system** as our visual language for parts
of speech (a proven, beautiful color+shape per POS: noun, verb=red, article=tan,
adjective, preposition=green, pronoun, conjunction, adverb…). Every grammar lab
reuses the same color/shape coding so a learner builds one consistent visual
intuition across lessons. (Pairs with our Brilliant-grade parametric-glyph rule.)

## Tactics we bake into the engine (research-backed)

These are lab-design rules, not features:
- **Production over recognition** — default to *building/typing* the answer, not
  tapping a choice (testing effect + generation effect). Multiple-choice is a
  warm-up, never the main event. (Duolingo's biggest weakness is over-recognition.)
- **Comprehensible input, scaffolded** — make new sentences ~95% understandable
  via picture/context so meaning is inferable without a translation crutch.
- **Spaced repetition, decoupled from lesson order** — per-item scheduler that
  surfaces due items *inside* live tasks (phase 2; needs learner persistence).
- **Interleaving** — mix tenses/structures/vocab rather than massing one drill.
- **Pushed output + correction** — tasks that demand self-generated production
  with inline corrective feedback (Swain "noticing the gap").
- **Pronunciation/listening from day one** — minimal-pair discrimination using the
  browser-TTS/audio resolver.
- **Explicit, visual rule reveals triggered by errors** — adults benefit from
  noticing the rule; show a short structural visual when the learner trips.
- **Anti-pattern to avoid**: streak/XP gamification that optimizes habit over
  competence. Progress must track *memory and production*, not points.

## Grammar visualization labs (the moat) — all data-driven

Each is fed authored DATA (creator declares the model); the lab visualizes + tests.

| Lab | Data it's fed | What the learner does | Renders |
|---|---|---|---|
| **SentenceBuilder** | tiles `{text, pos, gloss?}` + `correctOrder` | drag color-coded tiles into valid order | tiles (DOM) + POS color/shape |
| **TenseTimeline** | `{base, past, future, ...}` + prompt | drag event marker on past/now/future → verb form updates | SVG timeline + Stage |
| **TransformLab** | `{from, to, kind}` (statement→question, present→past…) | apply the transform; morphology/aux highlighted | tiles + transform motion |
| **AgreementLab** | subject/verb (or noun/article) pairs | connect/color-match; "-s"/copula auto-attaches | connecting lines (SVG) |
| **ArticleLens** | nouns tagged known/new/unique | choose definiteness → correct a/an/the/zero slides in | spotlight (SVG) |
| **PrepositionScene** | object + scene + correct prep | drag object in scene; preposition appears *before* noun | SVG scene |

Vocab labs (Flashcard/Matching from Part 1) remain — they're the recall layer.
Grammar labs are the differentiator.

## Bangla→English demo: "English Grammar You Can See" (ছবিতে ইংরেজি)

Designed for native **Bangla** speakers — ordered by the contrastive errors that
actually hurt this L1 (not a generic syllabus). Bangla scaffolding (gloss/ghost),
English target. Each lesson = short visual rule reveal + one interactive lab +
a short interleaved check.

1. **Words you can see** — concrete vocab via image **Matching** (warm-up, dual coding).
2. **English word order (SVO)** — Bangla is SOV. "আমি ভাত খাই" → "I eat rice."
   **SentenceBuilder**: the Bangla SOV ghost re-snaps into English SVO slots. ← flagship
3. **a / an / the (যা বাংলায় নেই)** — Bangla has no articles (highest-novelty error).
   **ArticleLens** definiteness spotlight: known vs new → the right article slides in.
4. **He go→goes / is–am–are** — Bangla drops the present copula & 3rd-sg -s.
   **AgreementLab**: color-match subject↔verb, "-s"/"is" auto-attaches.
5. **Questions: "Do you like tea?"** — Bangla has no do-support/inversion.
   **TransformLab**: animate the *do*-aux injecting + word-order flip.
6. **Where things are (in/on/at)** — Bangla uses postpositions (after the noun).
   **PrepositionScene**: drag the object; the preposition appears *before* the noun.

Pronunciation mini-drills (minimal pairs: v/w, s/sh, school→iskool cluster) can ride
along lessons via the audio resolver.

## Sources (research, 2026-06-18)

SLA/tactics: testing effect (Roediger & Karpicke), spaced repetition (SuperMemo/
Pimsleur graduated-interval recall), dual coding & picture-superiority, comprehensible
input (Krashen, with the 95–98% caveat), pushed output (Swain), interleaving &
desirable difficulty (Bjork), minimal-pair perception training; Duolingo gamification
critique. Visual grammar: Montessori grammar symbols, Reed–Kellogg diagrams, TPR,
visualizations-in-grammar research. Contrastive: Bengali↔English articles, Bangla–
English phonology, Bengali grammar (SOV, postpositions, dropped copula, no gender).
