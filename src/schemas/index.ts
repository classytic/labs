/**
 * @classytic/labs/schemas, the validation contract for every authorable lab.
 *
 * Real zod schemas for the lab DATA shapes (decks, tiles, items, vectors) that the
 * language + physics blocks reuse to validate authored arrays (no `z.any()`). zod is
 * isolated to this subpath + `/blocks`.
 *
 * Per-lab PROP schemas are NOT here, each lives on its own `defineBlock({ schema })`
 * (the single source of truth), so there's no parallel registry to drift. A consuming
 * app builds LLM tools straight from the block schemas if it wants.
 *
 * Source-of-truth note: the TS interfaces live in the (zod-free) domain presets;
 * the `_check*` lines below assert each schema's output stays assignable to its
 * interface so the two can't silently drift.
 */

import { z } from 'zod';
import type { IconValue } from '../language/icon.js';
import type { DeckItem, Deck, Pos } from '../language/deck.js';
import type { SentenceTile } from '../language/sentence-builder/index.js';
import type { ArticleItem } from '../language/article-lens/index.js';
import type { AgreementItem } from '../language/agreement/index.js';
import type { TransformTile } from '../language/transform/index.js';
import type { PrepItem, Relation } from '../language/preposition-scene/index.js';
import type { ClozeItem } from '../language/cloze/index.js';
import type { ReadingQuestion, GlossEntry } from '../language/reading/index.js';
import type { ErrorItem } from '../language/error-correct/index.js';
import type { BoardVector } from '../physics/vector-board/index.js';
import type { TypePanel } from '../physics/vector-types/index.js';
import type { ControlConfig } from '../kit/frame.js';
export {
  activityPatternSchema,
  authoredChoiceSchema,
  authoredQuestionSchema,
  authoredSuccessSchema,
  authoredDatasetSchema,
  authoredActivityStepSchema,
  authoredTransferCaseSchema,
  authoredActivitySchema,
} from './activity-authoring.js';

// ── shared scalars ──────────────────────────────────────────────────────────
export const posSchema = z.enum([
  'noun',
  'verb',
  'article',
  'adjective',
  'preposition',
  'pronoun',
  'conjunction',
  'adverb',
  'other',
]);
export const relationSchema = z.enum([
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
]);
export const articleAnswerSchema = z.enum(['a', 'an', 'the', ', ']);
export const vec2Schema = z.object({ x: z.number(), y: z.number() });
const nonBlankSchema = z.string().trim().min(1);
/** Practical BCP-47 guard: accepts language + optional script/region/variants. */
export const languageTagSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/, 'Use a BCP-47 language tag such as en-US, ar, or bn-BD');

/** A durable visual-asset reference (emoji / registered SVG id / image URL). */
export const iconRefSchema = z.object({
  kind: z.enum(['emoji', 'svg', 'image']),
  id: z.string().optional().describe('emoji char, or a registered svg id'),
  src: z.string().optional().describe('image URL (kind:image)'),
  alt: z.string().describe('accessible label; "" = decorative'),
});
/** Back-compat union: a plain string (emoji, or a scene backdrop key) OR an IconRef. */
export const iconValueSchema = z.union([z.string(), iconRefSchema]);

// ── language data ───────────────────────────────────────────────────────────
export const deckItemSchema = z.object({
  term: nonBlankSchema.describe('the target-language word/phrase'),
  translation: nonBlankSchema.describe("the learner's-language meaning"),
  transliteration: z.string().optional(),
  audioUrl: z.string().optional().describe('uploaded or external audio URL; none → browser TTS'),
  icon: iconValueSchema.optional().describe('emoji string, or an IconRef for a registered SVG / image'),
  example: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export const deckSchema = z.object({
  title: z.string().optional(),
  termLang: languageTagSchema.describe('BCP-47, e.g. en-US / ar / bn-BD'),
  transLang: languageTagSchema.describe('BCP-47 of the translation side'),
  items: z.array(deckItemSchema).min(1),
});
export const sentenceTileSchema = z.object({
  text: nonBlankSchema,
  pos: posSchema.optional(),
  gloss: z.string().optional(),
});
export const transformTileSchema = sentenceTileSchema;
/** Per-wrong-option feedback: maps an option the learner might wrongly pick to a
 *  targeted correction ("why that's the classic trap"). Keys are option strings. */
export const feedbackSchema = z.record(z.string(), z.string());
export const articleItemSchema = z.object({
  before: nonBlankSchema,
  noun: nonBlankSchema,
  after: z.string().optional(),
  answer: articleAnswerSchema,
  why: z.string().optional(),
  feedback: feedbackSchema.optional(),
});
export const agreementItemSchema = z
  .object({
    subject: nonBlankSchema,
    options: z.array(nonBlankSchema).min(2).max(6),
    correct: nonBlankSchema,
    tail: z.string().optional(),
    note: z.string().optional(),
    feedback: feedbackSchema.optional(),
  })
  .superRefine((item, context) => {
    if (!item.options.includes(item.correct))
      context.addIssue({
        code: 'custom',
        path: ['correct'],
        message: 'The correct verb form must be one of the options',
      });
    if (new Set(item.options).size !== item.options.length)
      context.addIssue({ code: 'custom', path: ['options'], message: 'Verb options must be unique' });
  });
export const prepItemSchema = z
  .object({
    before: nonBlankSchema,
    noun: nonBlankSchema,
    answer: nonBlankSchema,
    options: z.array(nonBlankSchema).min(2).max(6),
    scene: relationSchema,
    figure: iconValueSchema.optional().describe('emoji/IconRef for the placed thing'),
    landmark: iconValueSchema
      .optional()
      .describe("emoji/IconRef, or a backdrop key: 'sky'|'water'|'ground'|'room'"),
    note: z.string().optional(),
    feedback: feedbackSchema.optional(),
  })
  .superRefine((item, context) => {
    if (!item.options.includes(item.answer))
      context.addIssue({
        code: 'custom',
        path: ['answer'],
        message: 'The answer must be one of the preposition options',
      });
    if (new Set(item.options).size !== item.options.length)
      context.addIssue({ code: 'custom', path: ['options'], message: 'Preposition options must be unique' });
  });
export const clozeItemSchema = z
  .object({
    text: nonBlankSchema.describe('sentence with each blank written as ___ (3+ underscores)'),
    answers: z.array(nonBlankSchema).min(1).max(8),
    distractors: z.array(nonBlankSchema).max(16).optional(),
    why: z.string().optional(),
    gloss: z.string().optional(),
    audioUrl: z.string().optional(),
  })
  .superRefine((item, context) => {
    const blanks = item.text.match(/_{3,}/g)?.length ?? 0;
    if (blanks !== item.answers.length)
      context.addIssue({
        code: 'custom',
        path: ['answers'],
        message: `Provide exactly one answer for each blank (${blanks} found)`,
      });
  });
export const readingQuestionSchema = z
  .object({
    q: nonBlankSchema,
    options: z.array(nonBlankSchema).min(2).max(6),
    answer: nonBlankSchema,
    explain: z.string().optional(),
  })
  .superRefine((question, context) => {
    if (!question.options.includes(question.answer))
      context.addIssue({
        code: 'custom',
        path: ['answer'],
        message: 'The reading answer must be one of the options',
      });
    if (new Set(question.options).size !== question.options.length)
      context.addIssue({ code: 'custom', path: ['options'], message: 'Reading options must be unique' });
  });
export const glossEntrySchema = z.object({ word: nonBlankSchema, meaning: nonBlankSchema });
export const errorItemSchema = z
  .object({
    text: nonBlankSchema,
    wrong: nonBlankSchema,
    fix: nonBlankSchema,
    why: z.string().optional(),
  })
  .superRefine((item, context) => {
    const bare = (value: string): string => value.replace(/[.,!?;:"']+$/g, '').toLocaleLowerCase();
    const matches = item.text.split(/\s+/).filter((token) => bare(token) === bare(item.wrong)).length;
    if (matches !== 1)
      context.addIssue({
        code: 'custom',
        path: ['wrong'],
        message: 'The wrong word must appear exactly once in the sentence',
      });
    if (bare(item.wrong) === bare(item.fix))
      context.addIssue({
        code: 'custom',
        path: ['fix'],
        message: 'The correction must differ from the wrong word',
      });
  });

// ── physics data ────────────────────────────────────────────────────────────
export const boardVectorSchema = z.object({
  id: z.string().optional(),
  tail: vec2Schema.optional(),
  comp: vec2Schema,
  color: z.string().optional(),
  label: z.string().optional(),
  drag: z.boolean().optional(),
});
/** Block-authoring shape (flat dx/dy; the view maps to {comp:{x,y}}). */
export const flatVecSchema = z.object({
  label: z.string().optional(),
  dx: z.union([z.number(), z.string()]).optional(),
  dy: z.union([z.number(), z.string()]).optional(),
  color: z.string().optional(),
  drag: z.boolean().optional(),
});
export const typePanelSchema = z.object({
  name: z.string(),
  caption: z.string(),
  vectors: z
    .array(
      z.object({
        tail: vec2Schema.optional(),
        comp: vec2Schema,
        color: z.string().optional(),
        label: z.string().optional(),
      }),
    )
    .optional(),
  origin: z.boolean().optional(),
});

// ── creator control policy (cross-domain; consumed by Activity compositions) ──
/** Per-knob hide/lock policy a creator authors on any lab block. */
export const controlConfigSchema = z.object({
  hide: z.array(z.string()).optional().describe('control names the learner cannot see or change'),
  lock: z
    .array(z.string())
    .optional()
    .describe('control names shown read-only, frozen at the authored value'),
});

// ── drift guards: schema output must stay assignable to the preset interface ──
const _ck = <T>(_v: T): void => undefined;
_ck<IconValue>('' as z.infer<typeof iconValueSchema>);
_ck<Pos>('noun' as z.infer<typeof posSchema>);
_ck<Relation>('in' as z.infer<typeof relationSchema>);
_ck<DeckItem>({} as z.infer<typeof deckItemSchema>);
_ck<Deck>({} as z.infer<typeof deckSchema>);
_ck<SentenceTile>({} as z.infer<typeof sentenceTileSchema>);
_ck<ArticleItem>({} as z.infer<typeof articleItemSchema>);
_ck<AgreementItem>({} as z.infer<typeof agreementItemSchema>);
_ck<TransformTile>({} as z.infer<typeof transformTileSchema>);
_ck<PrepItem>({} as z.infer<typeof prepItemSchema>);
_ck<ClozeItem>({} as z.infer<typeof clozeItemSchema>);
_ck<ReadingQuestion>({} as z.infer<typeof readingQuestionSchema>);
_ck<GlossEntry>({} as z.infer<typeof glossEntrySchema>);
_ck<ErrorItem>({} as z.infer<typeof errorItemSchema>);
_ck<BoardVector>({} as z.infer<typeof boardVectorSchema>);
_ck<TypePanel>({} as z.infer<typeof typePanelSchema>);
_ck<ControlConfig>({} as z.infer<typeof controlConfigSchema>);
