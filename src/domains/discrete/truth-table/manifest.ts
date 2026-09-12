import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'truth-table',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'TruthTable',
  title: 'Truth table',
  description:
    'Any propositional formula → truth table with sub-expression build-up, fill/classify modes, and an equivalence verdict against a second formula.',
  schema: z.object({
    formula: z.string().trim().min(1).max(160).default('p -> q'),
    compare: z.string().trim().min(1).max(160).optional(),
    mode: z.enum(['show', 'fill', 'classify']).default('fill'),
    breakdown: z.boolean().optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['logic', 'truth-tables'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'boolean',
    related: ['logic-gate', 'karnaugh'],
  },
  experience: {
    objectives: [
      'Complete or classify a truth table',
      'Connect live input assignments to the final truth column',
      'Transfer final-column patterns to logical classification',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
