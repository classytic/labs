/**
 * Shared starter content + a light array coercer for the language labs. Kept free of React and the
 * cms-ui authoring kit so the per-lab RUNTIME chunks stay small (the demos double as schema defaults
 * in the manifests and as runtime/editor fallbacks). Array attrs can round-trip from MDX as JSON
 * strings, so runtimes read them through `coerceArray`.
 */
import type {
  SentenceTile,
  Deck,
  ArticleItem,
  AgreementItem,
  TransformTile,
  PrepItem,
  ClozeItem,
  ReadingQuestion,
  GlossEntry,
  ErrorItem,
} from '../../language/index.js';

export type {
  SentenceTile,
  Deck,
  ArticleItem,
  AgreementItem,
  TransformTile,
  PrepItem,
  ClozeItem,
  ReadingQuestion,
  GlossEntry,
  ErrorItem,
};
export type { ListenMode } from '../../language/index.js';

/** array → as-is, JSON-string-of-array → parsed, else fallback (no cms-ui dependency). */
export function coerceArray<T>(raw: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p as T[];
    } catch {
      /* not JSON */
    }
  }
  return fallback;
}

export const DEMO_SENTENCE: SentenceTile[] = [
  { text: 'She', pos: 'pronoun', gloss: 'সে' },
  { text: 'reads', pos: 'verb', gloss: 'পড়ে' },
  { text: 'a', pos: 'article' },
  { text: 'book', pos: 'noun', gloss: 'বই' },
];

export const DEMO_DECK: Deck = {
  termLang: 'en-US',
  transLang: 'bn-BD',
  items: [
    { term: 'water', translation: 'পানি', icon: '💧' },
    { term: 'book', translation: 'বই', icon: '📖' },
    { term: 'fish', translation: 'মাছ', icon: '🐟' },
    { term: 'rice', translation: 'ভাত', icon: '🍚' },
  ],
};

export const DEMO_ARTICLES: ArticleItem[] = [
  {
    before: 'I saw',
    noun: 'cat',
    after: 'on the wall.',
    answer: 'a',
    why: 'a → any one (new), before a consonant sound',
    feedback: {
      ', ': 'English needs an article for a single countable thing: a cat.',
      the: '"the" means a specific one we both know, but this cat is new here.',
    },
  },
  {
    before: 'She is',
    noun: 'engineer.',
    answer: 'an',
    why: 'an → before a vowel sound (engineer)',
    feedback: { a: 'Right idea (one, new), but engineer starts with a vowel sound: an.' },
  },
  {
    before: 'Please open',
    noun: 'door.',
    answer: 'the',
    why: 'the → the specific door we both mean',
    feedback: { a: 'We mean one specific door, not just any door: the door.' },
  },
  {
    before: 'I like',
    noun: 'tea.',
    answer: ', ',
    why: 'no article → tea in general (uncountable)',
    feedback: { a: 'Tea here is uncountable (in general), so no article.' },
  },
];

export const DEMO_AGREE: AgreementItem[] = [
  {
    subject: 'She',
    options: ['go', 'goes'],
    correct: 'goes',
    tail: 'to school.',
    note: 'he / she / it → add -s: goes',
    feedback: { go: 'Bangla keeps the verb the same, but English adds -s for he / she / it: goes.' },
  },
  {
    subject: 'They',
    options: ['is', 'are'],
    correct: 'are',
    tail: 'happy.',
    note: 'plural subject → are',
    feedback: { is: '"is" is singular; a plural subject (they) takes are.' },
  },
  {
    subject: 'He',
    options: ['is', 'are', 'am'],
    correct: 'is',
    tail: 'a doctor.',
    note: 'English needs "is", Bangla drops the present copula',
    feedback: { are: '"are" is for plural / you; he takes is.', am: '"am" is only for I; he takes is.' },
  },
];

export const DEMO_TRANSFORM_FROM: TransformTile[] = [
  { text: 'You', pos: 'pronoun', gloss: 'তুমি' },
  { text: 'like', pos: 'verb', gloss: 'পছন্দ করো' },
  { text: 'tea', pos: 'noun', gloss: 'চা' },
];
export const DEMO_TRANSFORM_TO: TransformTile[] = [
  { text: 'Do', pos: 'verb' },
  { text: 'you', pos: 'pronoun', gloss: 'তুমি' },
  { text: 'like', pos: 'verb', gloss: 'পছন্দ করো' },
  { text: 'tea', pos: 'noun', gloss: 'চা' },
  { text: '?', pos: 'other' },
];

export const DEMO_PREP: PrepItem[] = [
  {
    before: 'The bird is',
    noun: 'the tree.',
    answer: 'above',
    options: ['above', 'in', 'under'],
    scene: 'above',
    figure: '🐦',
    landmark: '🌳',
    note: '"above the tree", the word comes before the noun, while Bangla puts it after.',
    feedback: {
      in: 'Look at the picture: the bird is not inside the tree, it is above it.',
      under: 'The bird is higher than the tree, so above, not under.',
    },
  },
  {
    before: 'The fish is',
    noun: 'the water.',
    answer: 'in',
    options: ['in', 'on', 'over'],
    scene: 'in',
    figure: '🐟',
    landmark: 'water',
    note: '"in the water", preposition first.',
    feedback: {
      on: '"on" is the surface; the fish is inside the water: in.',
      over: '"over" is above and not touching; the fish is inside: in.',
    },
  },
  {
    before: 'The cat is',
    noun: 'the table.',
    answer: 'under',
    options: ['on', 'under', 'beside'],
    scene: 'under',
    figure: '🐱',
    landmark: '🪑',
    note: '"under the table", preposition first.',
    feedback: {
      on: 'The cat is below the table, not on top: under.',
      beside: '"beside" is next to; here the cat is below: under.',
    },
  },
];
export const PREP_RELATIONS = [
  'in',
  'on',
  'over',
  'above',
  'under',
  'below',
  'beside',
  'between',
  'behind',
  'infront',
  'at',
];

export const DEMO_CLOZE: ClozeItem[] = [
  {
    text: 'She ___ to school every day.',
    answers: ['goes'],
    distractors: ['go', 'going'],
    why: '3rd person singular adds -s: goes.',
    gloss: 'সে প্রতিদিন স্কুলে যায়।',
  },
  {
    text: 'I want ___ apple.',
    answers: ['an'],
    distractors: ['a', 'the'],
    why: 'an before a vowel sound (apple).',
    gloss: 'আমি একটি আপেল চাই।',
  },
  {
    text: 'They ___ playing in the ___.',
    answers: ['are', 'park'],
    distractors: ['is', 'garden'],
    why: 'plural subject → are; the place is the park.',
  },
];

export const DEMO_READING_PASSAGE =
  'Mina walks to school every morning. She carries a bag of books and a small umbrella.\n\nHer friend Ravi walks with her. They talk about their lessons on the way.';
export const DEMO_READING_Q: ReadingQuestion[] = [
  {
    q: 'Where does Mina go every morning?',
    options: ['to the market', 'to school', 'to the river'],
    answer: 'to school',
    explain: 'The passage says she walks to school every morning.',
  },
  {
    q: 'What does she carry?',
    options: ['a bag of books', 'a basket of fish', 'an umbrella'],
    answer: 'a bag of books',
  },
];
export const DEMO_READING_GLOSS: GlossEntry[] = [
  { word: 'carry', meaning: 'বহন করা' },
  { word: 'morning', meaning: 'সকাল' },
];

export const DEMO_ERRORS: ErrorItem[] = [
  { text: 'He go to school every day.', wrong: 'go', fix: 'goes', why: 'he / she / it takes -s: goes.' },
  { text: 'I want a apple.', wrong: 'a', fix: 'an', why: 'an before a vowel sound (apple).' },
  {
    text: 'She have two brother.',
    wrong: 'brother',
    fix: 'brothers',
    why: 'two → plural, add -s: brothers.',
  },
];

/** Coerce a possibly-JSON-string deck to a Deck with a non-empty items array (else the lab throws). */
export function coerceDeck(raw: unknown): Deck {
  if (raw == null || raw === '') return DEMO_DECK;
  let d: unknown = raw;
  if (typeof d === 'string') {
    try {
      d = JSON.parse(d);
    } catch {
      throw new Error('Language deck must be valid JSON.');
    }
  }
  if (d && typeof d === 'object' && Array.isArray((d as Deck).items) && (d as Deck).items.length)
    return d as Deck;
  throw new Error('Language deck must contain at least one item.');
}
