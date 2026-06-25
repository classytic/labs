/**
 * @classytic/labs/blocks — language lab block specs.
 *
 * `defineBlock` editor adapters for the language labs (one domain per file; the
 * registry is assembled in `./index.ts`). Each spec pairs a real zod schema
 * (`../schemas`) with a render `Component` that, in `mode === 'editing'`, shows
 * the row-based authoring kit (`./authoring`). `@classytic/cms-ui` + `zod` are
 * optional peers touched only by the blocks layer.
 */

import { defineBlock } from '@classytic/cms-ui/contract';
import { z } from 'zod';
import { ConfigPanel, ConfigRow, ChipToggle, TextField, RowsEditor, TagsField, coerceArray } from './authoring.js';
import { sentenceTileSchema, deckSchema, articleItemSchema, agreementItemSchema, transformTileSchema, prepItemSchema } from '../schemas/index.js';
import { SentenceBuilderLab, WordMatchLab, ArticleLensLab, AgreementLab, TransformLab, PrepositionSceneLab, type SentenceTile, type Deck, type ArticleItem, type AgreementItem, type TransformTile, type PrepItem } from '../language/index.js';

const DEMO_SENTENCE: SentenceTile[] = [
  { text: 'She', pos: 'pronoun', gloss: 'সে' },
  { text: 'reads', pos: 'verb', gloss: 'পড়ে' },
  { text: 'a', pos: 'article' },
  { text: 'book', pos: 'noun', gloss: 'বই' },
];

const DEMO_DECK: Deck = {
  termLang: 'en-US',
  transLang: 'bn-BD',
  items: [
    { term: 'water', translation: 'পানি', icon: '💧' },
    { term: 'book', translation: 'বই', icon: '📖' },
    { term: 'fish', translation: 'মাছ', icon: '🐟' },
    { term: 'rice', translation: 'ভাত', icon: '🍚' },
  ],
};

export const SentenceBuilderBlock = defineBlock({
  key: 'sentence-builder',
  tag: 'SentenceBuilder',
  void: true,
  label: 'Sentence builder (word order)',
  description: 'Order colour-coded word tiles into a correct sentence — visualizes word order (great for SOV→SVO).',
  category: 'interactive',
  schema: z.object({
    tiles: z.array(sentenceTileSchema).default(DEMO_SENTENCE),
    prompt: z.string().optional(),
    promptDir: z.enum(['ltr', 'rtl']).default('ltr'),
    targetDir: z.enum(['ltr', 'rtl']).default('ltr'),
    title: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const tiles = coerceArray<SentenceTile>(attributes.tiles, DEMO_SENTENCE);
    const widget = <SentenceBuilderLab tiles={tiles} prompt={attributes.prompt} promptDir={attributes.promptDir} targetDir={attributes.targetDir} title={attributes.title} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="prompt"><TextField value={attributes.prompt ?? ''} onChange={(v) => updateAttributes({ prompt: v })} placeholder="meaning / L1 sentence" /></ConfigRow>
          <ConfigRow label="prompt dir"><ChipToggle active={attributes.promptDir === 'rtl'} onClick={() => updateAttributes({ promptDir: attributes.promptDir === 'rtl' ? 'ltr' : 'rtl' })}>RTL</ChipToggle></ConfigRow>
          <ConfigRow label="tiles">
            <RowsEditor
              rows={tiles}
              onChange={(v) => updateAttributes({ tiles: v })}
              columns={[{ key: 'text', label: 'word', grow: true }, { key: 'pos', label: 'part', type: 'pos' }, { key: 'gloss', label: 'gloss', grow: true }]}
              newRow={() => ({ text: '', pos: 'other' as const })}
              addLabel="word"
            />
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const WordMatchBlock = defineBlock({
  key: 'word-match',
  tag: 'WordMatch',
  void: true,
  label: 'Word match (vocab pairs)',
  description: 'Tap to pair each word with its meaning — or its picture (kids/concrete). Reads a vocab deck.',
  category: 'interactive',
  schema: z.object({
    deck: deckSchema.default(DEMO_DECK),
    count: z.number().optional(),
    show: z.enum(['translation', 'icon']).default('translation'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    // deck may arrive missing, malformed, or as a JSON string (MDX round-trip) — coerce to a
    // deck that always has a non-empty `items` array, else WordMatchLab's `.items.length` throws.
    let rawDeck: unknown = attributes.deck;
    if (typeof rawDeck === 'string') { try { rawDeck = JSON.parse(rawDeck); } catch { /* keep */ } }
    const deck: Deck = rawDeck && typeof rawDeck === 'object' && Array.isArray((rawDeck as Deck).items) && (rawDeck as Deck).items.length ? (rawDeck as Deck) : DEMO_DECK;
    const widget = <WordMatchLab deck={deck} count={attributes.count} show={attributes.show} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="languages">
            <TextField value={deck.termLang} onChange={(v) => updateAttributes({ deck: { ...deck, termLang: v } })} placeholder="en-US" />
            <TextField value={deck.transLang} onChange={(v) => updateAttributes({ deck: { ...deck, transLang: v } })} placeholder="bn-BD" />
          </ConfigRow>
          <ConfigRow label="show"><ChipToggle active={attributes.show === 'icon'} onClick={() => updateAttributes({ show: attributes.show === 'icon' ? 'translation' : 'icon' })}>pictures</ChipToggle></ConfigRow>
          <ConfigRow label="words">
            <RowsEditor
              rows={deck.items}
              onChange={(items) => updateAttributes({ deck: { ...deck, items } })}
              columns={[{ key: 'term', label: 'word', grow: true }, { key: 'translation', label: 'meaning', grow: true }, { key: 'icon', label: 'icon', type: 'icon' }, { key: 'transliteration', label: 'rom.' }]}
              newRow={() => ({ term: '', translation: '' })}
              addLabel="word"
            />
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

const DEMO_ARTICLES: ArticleItem[] = [
  { before: 'I saw', noun: 'cat', after: 'on the wall.', answer: 'a', why: 'a → any one (new), before a consonant sound' },
  { before: 'She is', noun: 'engineer.', answer: 'an', why: 'an → before a vowel sound (engineer)' },
  { before: 'Please open', noun: 'door.', answer: 'the', why: 'the → the specific door we both mean' },
  { before: 'I like', noun: 'tea.', answer: '—', why: 'no article → tea in general (uncountable)' },
];

const DEMO_AGREE: AgreementItem[] = [
  { subject: 'She', options: ['go', 'goes'], correct: 'goes', tail: 'to school.', note: 'he / she / it → add -s: goes' },
  { subject: 'They', options: ['is', 'are'], correct: 'are', tail: 'happy.', note: 'plural subject → are' },
  { subject: 'He', options: ['is', 'are', 'am'], correct: 'is', tail: 'a doctor.', note: 'English needs "is" — Bangla drops the present copula' },
];

export const ArticleLensBlock = defineBlock({
  key: 'article-lens',
  tag: 'ArticleLens',
  void: true,
  label: 'Article lens (a / an / the)',
  description: 'Pick the right article (a/an/the/none) — built for the "Bangla has no articles" gap.',
  category: 'interactive',
  schema: z.object({ items: z.array(articleItemSchema).default(DEMO_ARTICLES), objectives: z.array(z.string()).optional(), hints: z.array(z.string()).optional(), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const items = coerceArray<ArticleItem>(attributes.items, DEMO_ARTICLES);
    const widget = <ArticleLensLab items={items} objectives={attributes.objectives} hints={attributes.hints} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="items">
            <RowsEditor
              rows={items}
              onChange={(v) => updateAttributes({ items: v })}
              columns={[{ key: 'before', label: 'before', grow: true }, { key: 'noun', label: 'noun', grow: true }, { key: 'after', label: 'after', grow: true }, { key: 'answer', label: 'answer', type: 'select', options: ['a', 'an', 'the', '—'] }, { key: 'why', label: 'why', grow: true }]}
              newRow={() => ({ before: '', noun: '', answer: 'a' as const })}
              addLabel="item"
            />
          </ConfigRow>
          <ConfigRow label="objectives"><TagsField value={attributes.objectives ?? []} onChange={(v) => updateAttributes({ objectives: v })} placeholder="comma-separated goals" /></ConfigRow>
          <ConfigRow label="hints"><TagsField value={attributes.hints ?? []} onChange={(v) => updateAttributes({ hints: v })} placeholder="comma-separated hints" /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const AgreementBlock = defineBlock({
  key: 'agreement',
  tag: 'Agreement',
  void: true,
  label: 'Agreement (subject ↔ verb)',
  description: 'Pick the verb form that matches the subject — covers 3rd-sg -s and the dropped copula.',
  category: 'interactive',
  schema: z.object({ items: z.array(agreementItemSchema).default(DEMO_AGREE), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const items = coerceArray<AgreementItem>(attributes.items, DEMO_AGREE);
    const widget = <AgreementLab items={items} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="items">
            <RowsEditor
              rows={items}
              onChange={(v) => updateAttributes({ items: v })}
              columns={[{ key: 'subject', label: 'subject', grow: true }, { key: 'options', label: 'options (comma)', type: 'tags', grow: true }, { key: 'correct', label: 'correct' }, { key: 'tail', label: 'tail', grow: true }, { key: 'note', label: 'note', grow: true }]}
              newRow={() => ({ subject: '', options: [], correct: '' })}
              addLabel="item"
            />
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

const DEMO_TRANSFORM_FROM: TransformTile[] = [
  { text: 'You', pos: 'pronoun', gloss: 'তুমি' },
  { text: 'like', pos: 'verb', gloss: 'পছন্দ করো' },
  { text: 'tea', pos: 'noun', gloss: 'চা' },
];
const DEMO_TRANSFORM_TO: TransformTile[] = [
  { text: 'Do', pos: 'verb' },
  { text: 'you', pos: 'pronoun', gloss: 'তুমি' },
  { text: 'like', pos: 'verb', gloss: 'পছন্দ করো' },
  { text: 'tea', pos: 'noun', gloss: 'চা' },
  { text: '?', pos: 'other' },
];
const DEMO_PREP: PrepItem[] = [
  { before: 'The bird is', noun: 'the tree.', answer: 'above', options: ['above', 'in', 'under'], scene: 'above', figure: '🐦', landmark: '🌳', note: '"above the tree" — the word comes BEFORE the noun (Bangla puts it after).' },
  { before: 'The fish is', noun: 'the water.', answer: 'in', options: ['in', 'on', 'over'], scene: 'in', figure: '🐟', landmark: 'water', note: '"in the water" — preposition first.' },
  { before: 'The cat is', noun: 'the table.', answer: 'under', options: ['on', 'under', 'beside'], scene: 'under', figure: '🐱', landmark: '🪑', note: '"under the table" — preposition first.' },
];
const PREP_RELATIONS = ['in', 'on', 'over', 'above', 'under', 'below', 'beside', 'between', 'behind', 'infront', 'at'];

export const TransformBlock = defineBlock({
  key: 'transform',
  tag: 'Transform',
  void: true,
  label: 'Transform (statement → question / tense)',
  description: 'Rebuild a sentence into its transformed form; the changed words are highlighted (do-support, tense…).',
  category: 'interactive',
  schema: z.object({ from: z.array(transformTileSchema).default(DEMO_TRANSFORM_FROM), to: z.array(transformTileSchema).default(DEMO_TRANSFORM_TO), instruction: z.string().optional(), note: z.string().optional(), title: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const from = coerceArray<TransformTile>(attributes.from, DEMO_TRANSFORM_FROM);
    const to = coerceArray<TransformTile>(attributes.to, DEMO_TRANSFORM_TO);
    const widget = <TransformLab from={from} to={to} instruction={attributes.instruction} note={attributes.note} title={attributes.title} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="instruction"><TextField value={attributes.instruction ?? ''} onChange={(v) => updateAttributes({ instruction: v })} placeholder="e.g. Make it a question" /></ConfigRow>
          <ConfigRow label="note"><TextField value={attributes.note ?? ''} onChange={(v) => updateAttributes({ note: v })} placeholder="what changed + why" /></ConfigRow>
          <ConfigRow label="from (given)">
            <RowsEditor rows={from} onChange={(v) => updateAttributes({ from: v })} columns={[{ key: 'text', label: 'word', grow: true }, { key: 'pos', label: 'part', type: 'pos' }, { key: 'gloss', label: 'gloss', grow: true }]} newRow={() => ({ text: '', pos: 'other' as const })} addLabel="word" />
          </ConfigRow>
          <ConfigRow label="to (answer)">
            <RowsEditor rows={to} onChange={(v) => updateAttributes({ to: v })} columns={[{ key: 'text', label: 'word', grow: true }, { key: 'pos', label: 'part', type: 'pos' }, { key: 'gloss', label: 'gloss', grow: true }]} newRow={() => ({ text: '', pos: 'other' as const })} addLabel="word" />
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const PrepositionBlock = defineBlock({
  key: 'preposition',
  tag: 'Preposition',
  void: true,
  label: 'Preposition scene (in / on / at)',
  description: 'Pick the preposition that matches a spatial picture — teaches "before the noun" vs Bangla postpositions.',
  category: 'interactive',
  schema: z.object({ items: z.array(prepItemSchema).default(DEMO_PREP), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const items = coerceArray<PrepItem>(attributes.items, DEMO_PREP);
    const widget = <PrepositionSceneLab items={items} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="items">
            <RowsEditor
              rows={items}
              onChange={(v) => updateAttributes({ items: v })}
              columns={[{ key: 'before', label: 'before', grow: true }, { key: 'noun', label: 'noun', grow: true }, { key: 'answer', label: 'answer' }, { key: 'options', label: 'options (comma)', type: 'tags', grow: true }, { key: 'figure', label: 'figure', type: 'icon' }, { key: 'landmark', label: 'landmark', type: 'icon' }, { key: 'scene', label: 'relation', type: 'select', options: PREP_RELATIONS }, { key: 'note', label: 'note', grow: true }]}
              newRow={() => ({ before: 'The bird is', noun: 'the tree.', answer: 'above', options: ['above', 'in', 'under'], scene: 'above' as const, figure: '🐦', landmark: '🌳' })}
              addLabel="item"
            />
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

/** This domain's block specs (slash-menu order) + tag→component render map. */
export const languageBlocks = [
  SentenceBuilderBlock, WordMatchBlock, ArticleLensBlock, AgreementBlock, TransformBlock, PrepositionBlock,
] as const;

export const languageComponents = {
  SentenceBuilder: SentenceBuilderLab,
  WordMatch: WordMatchLab,
  ArticleLens: ArticleLensLab,
  Agreement: AgreementLab,
  Transform: TransformLab,
  Preposition: PrepositionSceneLab,
} as const;
