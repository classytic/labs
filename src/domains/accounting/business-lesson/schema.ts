/**
 * Authoring schema for the "run a business" scene script. Mirrors the component's `Scene` union
 * (src/commerce/finance/business-lesson.tsx) and the @classytic/stage/finance `BizAction` /
 * `BizState`, so an authored scenario is actually VALIDATED instead of `z.any()`.
 *
 * Keep this contract aligned with the runtime union instead of loosening authored data to `any`.
 */
import { z } from 'zod';

/** A balanced business action (double-entry preserving), applied by a `decide` choice. */
export const bizActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('invest'), amount: z.number().positive().finite() }),
  z.object({ type: z.literal('loan'), amount: z.number().positive().finite() }),
  z.object({ type: z.literal('repay'), amount: z.number().positive().finite() }),
  z.object({ type: z.literal('buyEquipment'), amount: z.number().positive().finite() }),
  z.object({ type: z.literal('depreciate'), amount: z.number().positive().finite() }),
  z.object({
    type: z.literal('buyStock'),
    qty: z.number().positive().finite(),
    unitCost: z.number().nonnegative().finite(),
  }),
  z.object({
    type: z.literal('sell'),
    qty: z.number().positive().finite(),
    price: z.number().nonnegative().finite(),
  }),
  z.object({ type: z.literal('expense'), amount: z.number().positive().finite() }),
  z.object({ type: z.literal('closePeriod') }),
]);

/** Rich-text scene fields are authored as strings (rendered as ReactNode by the runtime). */
const richText = z.string().trim().min(1);

/** One scene screen: a line of narration, a decision, a predict-question, or a books report. */
export const sceneSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('narrate'), text: richText }),
  z.object({
    kind: z.literal('decide'),
    prompt: richText,
    choices: z
      .array(
        z.object({
          label: z.string().trim().min(1),
          actions: z.array(bizActionSchema).optional(),
          feedback: richText,
        }),
      )
      .min(1),
  }),
  z.object({
    kind: z.literal('predict'),
    prompt: richText,
    choices: z.array(z.object({ value: z.string().trim().min(1), label: z.string().trim().min(1) })).min(1),
    answer: z.string().trim().min(1),
    explain: richText,
  }),
  z.object({ kind: z.literal('report'), show: z.enum(['income', 'balance']), note: richText.optional() }),
]);

/** Starting books (partial — unspecified fields default to 0 in the bizsim engine). */
export const bizStateSchema = z
  .object({
    cash: z.number(),
    inventoryQty: z.number(),
    inventoryValue: z.number(),
    equipment: z.number(),
    loan: z.number(),
    capital: z.number(),
    retained: z.number(),
    revenue: z.number(),
    cogs: z.number(),
    expenses: z.number(),
  })
  .partial();
