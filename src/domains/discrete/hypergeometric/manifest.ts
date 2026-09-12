import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'hypergeometric',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'Hypergeometric',
  title: 'With vs without replacement',
  description:
    'Same urn, draw n: binomial (with replacement) vs hypergeometric (without) as paired bars; same mean, hyper narrower, merging as N grows.',
  schema: z
    .object({
      N: z.number().int().min(2).max(60).default(10),
      K: z.number().int().min(0).default(4),
      n: z.number().int().min(1).default(3),
      ...commonLabProps,
    })
    .refine((value) => value.K <= value.N, { message: 'K cannot exceed N', path: ['K'] })
    .refine((value) => value.n <= value.N, { message: 'draw size cannot exceed N', path: ['n'] }),
  taxonomy: {
    grades: ['12'],
    outcomes: ['distributions', 'hypergeometric'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict how sampling without replacement changes spread',
      'Compare exact with- and without-replacement probabilities',
      'Transfer the finite-population correction to cards and quality control',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
