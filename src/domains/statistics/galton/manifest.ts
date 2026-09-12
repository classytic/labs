import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'galton',
  domain: 'statistics',
  group: 'Statistics',
  tag: 'GaltonBoard',
  title: 'Galton board (central limit theorem)',
  description:
    'Balls bounce through pegs (each a coin-flip) and pile into a bell curve hugging the theoretical normal, the CLT made visible.',
  schema: z.object({
    // Runtime clamp (no slider): R = clamp(rows, 4, 16) pegs the peg-grid depth.
    rows: z.number().min(4).max(16).optional(),
    seed: z.number().optional(),
    showCurve: z.boolean().optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['statistics', 'central-limit-theorem'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Predict the distribution created by repeated independent bounces',
      'Connect rare edge outcomes to unlikely bounce sequences',
      'Relate the empirical pile to its theoretical binomial envelope',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
