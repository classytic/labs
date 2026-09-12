import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'lln',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'LawOfLargeNumbers',
  title: 'Law of large numbers',
  description:
    'A coin/die sampler: running frequencies converge onto the true probabilities as draws pile up.',
  schema: z.object({ experiment: z.enum(['coin', 'die']).optional(), ...commonLabProps }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['probability', 'law-of-large-numbers'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Predict why early running frequencies fluctuate strongly',
      'Observe empirical frequency settling near theoretical probability',
      'Distinguish long-run convergence from guaranteed exactness',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
