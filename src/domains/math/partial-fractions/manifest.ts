import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

const factor = z.union([
  z.object({
    kind: z.literal('linear'),
    a: z.number().finite(),
    b: z.number().finite(),
    power: z.number().int().min(1).max(3).optional(),
  }),
  z.object({
    kind: z.literal('quadratic'),
    a: z.number().finite(),
    b: z.number().finite(),
    c: z.number().finite(),
  }),
]);

export default defineLab({
  id: 'partial-fractions',
  tag: 'PartialFractions',
  domain: 'math',
  group: 'Algebra',
  title: 'Partial fractions (choose the form, then see it add up)',
  description:
    'The graded decision is the SHAPE of the answer, made before any constant exists, so the menu offers the shapes people actually write wrongly. Once the form is right the constants are solved and the pieces are drawn separately, so the complicated original visibly appears out of simple ones.',
  schema: z.object({
    numerator: z
      .array(z.number().finite())
      .min(1)
      .max(5)
      .optional()
      .describe('coefficients ascending: [1, 3] is 3x + 1'),
    factors: z
      .array(factor)
      .min(1)
      .max(4)
      .optional()
      .describe('denominator factors; a quadratic must be irreducible, and the fraction proper'),
    options: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(40),
          tex: z.string().trim().min(1).max(240),
          correct: z.boolean().optional(),
          why: z.string().trim().min(1).max(300).optional(),
        }),
      )
      .min(2)
      .max(5)
      .optional()
      .describe('candidate forms; mark exactly one correct and give every other one a reason'),
    revealed: z
      .boolean()
      .optional()
      .describe('open with the form already chosen, for a lesson that only wants the graph'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Choose the correct form of a decomposition before finding any constant',
      'Give a repeated factor a term at every power, and a quadratic a linear numerator',
      'Check that the number of unknowns equals the degree of the denominator',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['algebra', 'partial-fractions', 'rational-functions'],
    durationMinutes: 12,
    interaction: 'guided',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
