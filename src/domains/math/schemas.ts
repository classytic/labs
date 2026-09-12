/**
 * Shared zod fragments for the math lab manifests (pure schema, no React) — the equation/param/
 * derive/ask shapes reused across the grapher family, the interactive-problem engine, and the
 * coordinate-geometry labs. Manifests import only what they need, so this stays light.
 */
import { z } from 'zod';

export const equationSchema = z.union([
  z.string(),
  z.object({ expr: z.string(), color: z.string().optional() }),
]);

export const paramSchema = z.object({
  name: z.string(),
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
  value: z.number(),
});

export const derivationStepSchema = z.union([
  z.string(),
  z.object({ tex: z.string(), note: z.string().optional() }),
]);

export const pointSchema = z.object({ x: z.number(), y: z.number() });

export const calculusExpressionSchema = z.string().trim().min(1).max(240);
export const calculusRangeSchema = z
  .tuple([z.number().finite(), z.number().finite()])
  .refine(([minimum, maximum]) => maximum > minimum, { message: 'maximum must be greater than minimum' });

/** interactive-problem / triangle-trig: a graded typed answer (number or expression). */
export const answerSchema = z.union([
  z.object({ kind: z.literal('number'), value: z.number(), tol: z.number().optional() }),
  z.object({ kind: z.literal('expression'), value: z.string() }),
]);
export const askSchema = z.object({
  prompt: z.string(),
  answer: answerSchema,
  placeholder: z.string().optional(),
});

export const deriveSchema = z.object({
  kind: z.enum(['intersections', 'roots', 'tangent', 'normal', 'area']),
  of: z.union([z.number(), z.tuple([z.number(), z.number()])]).optional(),
  at: z.union([z.number(), z.string()]).optional(),
  between: z.tuple([z.number(), z.number()]).optional(),
  from: z.union([z.number(), z.string()]).optional(),
  to: z.union([z.number(), z.string()]).optional(),
  label: z.string().optional(),
});

/** coordinate-geometry labs: a graded question as a typed answer OR multiple choice. */
const labChoiceSchema = z.object({ value: z.string(), label: z.string() });
export const labAskSchema = z.object({
  prompt: z.string(),
  placeholder: z.string().optional(),
  answer: answerSchema.optional(),
  choices: z.array(labChoiceSchema).optional(),
  correct: z.string().optional(),
  explain: z.string().optional(),
});

export const receiptItemSchema = z.object({ qty: z.number(), name: z.string(), unit: z.number() });
