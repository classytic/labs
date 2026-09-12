import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'sampling',
  domain: 'statistics',
  group: 'Statistics',
  tag: 'SamplingDistribution',
  title: 'Sampling distribution & confidence intervals',
  description:
    'Stack confidence intervals → ~C% capture μ (what "95% confident" means), or watch sample means pile into Normal(μ, σ/√n).',
  schema: z.object({
    // mu and sigma drive no control: the plotted window is mu ± 3.4σ, so it follows them.
    mu: z.number().optional(),
    sigma: z.number().optional(),
    n: z.number().min(2).max(200).optional(),
    // Only these four levels have a z* in the runtime table; anything else yields NaN intervals.
    confidence: z.union([z.literal(0.8), z.literal(0.9), z.literal(0.95), z.literal(0.99)]).optional(),
    mode: z.enum(['sampling', 'ci']).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['12'],
    outcomes: ['statistics', 'sampling', 'confidence-intervals'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Explain why sample means vary less than individual observations',
      'Interpret confidence as long-run interval coverage',
      'Predict how sample size changes standard error',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
