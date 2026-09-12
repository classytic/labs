/**
 * Shared authoring-schema fragments reused across migrated labs. Keeps each lab's
 * schema.ts a thin, honest declaration instead of re-inlining the same shapes.
 */
import { z } from 'zod';

export { commonLabProps } from '../blocks/lab-block.js';

/**
 * Creator control policy — the Activity `controlConfig` fragment: hide or lock named
 * knobs so an author can ship a FOCUSED lesson (one setup) from a multi-mode lab.
 */
export const controlConfig = z
  .object({ hide: z.array(z.string()).optional(), lock: z.array(z.string()).optional() })
  .optional();

/** A 2-D point in world coords. */
export const vec2 = z.object({ x: z.number(), y: z.number() });

/**
 * An attached graded question (the LabAsk mechanism): MCQ (choices + correct) or a typed
 * answer (number / algebraic), with an explanation shown once answered correctly.
 */
export const ask = z
  .object({
    prompt: z.string().describe('the question'),
    choices: z
      .array(z.object({ value: z.string(), label: z.string() }))
      .optional()
      .describe('multiple-choice options'),
    correct: z.string().optional().describe('the value of the correct choice'),
    answer: z.any().optional().describe('typed-answer spec (number or algebraic), instead of choices'),
    placeholder: z.string().optional(),
    explain: z.string().optional().describe('shown once answered correctly'),
  })
  .optional();
