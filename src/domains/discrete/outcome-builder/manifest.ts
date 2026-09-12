import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'outcome-builder',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'OutcomeBuilder',
  title: 'Sample-space builder (coins & dice)',
  description:
    'Add coins/dice and watch every outcome fan out with the counting principle; click outcomes to mark an event → P = favourable ÷ total.',
  schema: z.object({
    stages: z
      .array(z.enum(['coin', 'die']))
      .min(1)
      .max(6)
      .optional(),
    maxOutcomes: z.number().int().min(4).max(144).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['probability', 'sample-space'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Construct a compound sample space',
      'Define an event by selecting favourable outcomes',
      'Explain why an independent stage multiplies the outcome count',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
