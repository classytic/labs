import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'binomial',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'Binomial',
  title: 'Binomial distribution',
  description:
    'P(k successes) = C(n,k)pᵏ(1−p)ⁿ⁻ᵏ as bars; click a bar to derive it; bell overlay shows it approach the normal.',
  schema: z.object({
    n: z.number().int().min(1).max(24).default(10),
    p: z.number().min(0).max(1).default(0.5),
    showNormal: z.boolean().optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['12'],
    outcomes: ['distributions', 'binomial'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict the most likely success count, including tied modes',
      'Connect a selected bar to the binomial probability formula',
      'Explain when a normal curve approximates the binomial distribution',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['numeric'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
