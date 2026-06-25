/**
 * @classytic/labs/schemas — the validation contract for every authorable lab.
 *
 * Real zod schemas for the lab DATA shapes (decks, tiles, items, vectors) that the
 * language + physics blocks reuse to validate authored arrays (no `z.any()`). zod is
 * isolated to this subpath + `/blocks`.
 *
 * Per-lab PROP schemas are NOT here — each lives on its own `defineBlock({ schema })`
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
import type { BoardVector } from '../physics/vector-board/index.js';
import type { TypePanel } from '../physics/vector-types/index.js';
import type { ControlConfig } from '../kit/frame.js';

// ── shared scalars ──────────────────────────────────────────────────────────
export const posSchema = z.enum(['noun', 'verb', 'article', 'adjective', 'preposition', 'pronoun', 'conjunction', 'adverb', 'other']);
export const relationSchema = z.enum(['in', 'on', 'over', 'above', 'under', 'below', 'beside', 'between', 'behind', 'infront', 'at']);
export const articleAnswerSchema = z.enum(['a', 'an', 'the', '—']);
export const vec2Schema = z.object({ x: z.number(), y: z.number() });

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
  term: z.string().describe('the target-language word/phrase'),
  translation: z.string().describe("the learner's-language meaning"),
  transliteration: z.string().optional(),
  audioUrl: z.string().optional().describe('uploaded or external audio URL; none → browser TTS'),
  icon: iconValueSchema.optional().describe('emoji string, or an IconRef for a registered SVG / image'),
  example: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export const deckSchema = z.object({
  title: z.string().optional(),
  termLang: z.string().describe('BCP-47, e.g. en-US / ar / bn-BD'),
  transLang: z.string().describe('BCP-47 of the translation side'),
  items: z.array(deckItemSchema),
});
export const sentenceTileSchema = z.object({ text: z.string(), pos: posSchema.optional(), gloss: z.string().optional() });
export const transformTileSchema = sentenceTileSchema;
export const articleItemSchema = z.object({
  before: z.string(), noun: z.string(), after: z.string().optional(),
  answer: articleAnswerSchema, why: z.string().optional(),
});
export const agreementItemSchema = z.object({
  subject: z.string(), options: z.array(z.string()), correct: z.string(),
  tail: z.string().optional(), note: z.string().optional(),
});
export const prepItemSchema = z.object({
  before: z.string(), noun: z.string(), answer: z.string(), options: z.array(z.string()),
  scene: relationSchema,
  figure: iconValueSchema.optional().describe('emoji/IconRef for the placed thing'),
  landmark: iconValueSchema.optional().describe("emoji/IconRef, or a backdrop key: 'sky'|'water'|'ground'|'room'"),
  note: z.string().optional(),
});

// ── physics data ────────────────────────────────────────────────────────────
export const boardVectorSchema = z.object({
  id: z.string().optional(), tail: vec2Schema.optional(), comp: vec2Schema,
  color: z.string().optional(), label: z.string().optional(), drag: z.boolean().optional(),
});
/** Block-authoring shape (flat dx/dy; the view maps to {comp:{x,y}}). */
export const flatVecSchema = z.object({
  label: z.string().optional(),
  dx: z.union([z.number(), z.string()]).optional(),
  dy: z.union([z.number(), z.string()]).optional(),
  color: z.string().optional(), drag: z.boolean().optional(),
});
export const typePanelSchema = z.object({
  name: z.string(), caption: z.string(),
  vectors: z.array(z.object({ tail: vec2Schema.optional(), comp: vec2Schema, color: z.string().optional(), label: z.string().optional() })).optional(),
  origin: z.boolean().optional(),
});


// ── creator control policy (cross-domain; consumed by LabFrame.controlConfig) ──
/** Per-knob hide/lock policy a creator authors on any lab block. */
export const controlConfigSchema = z.object({
  hide: z.array(z.string()).optional().describe('control names the learner cannot see or change'),
  lock: z.array(z.string()).optional().describe('control names shown read-only, frozen at the authored value'),
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
_ck<BoardVector>({} as z.infer<typeof boardVectorSchema>);
_ck<TypePanel>({} as z.infer<typeof typePanelSchema>);
_ck<ControlConfig>({} as z.infer<typeof controlConfigSchema>);
