import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../blocks/lab-block.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'atwood',
  domain: 'physics',
  group: 'Physics',
  title: 'Atwood machine, two masses over a pulley',
  description:
    'Two masses share one rope over a pulley. Only the difference in weight drives the system while the total mass resists it: a = (m₁−m₂)g/(m₁+m₂), tension T = 2m₁m₂g/(m₁+m₂). Equal masses balance; a tiny difference on big masses gives a slow, measurable a, how Atwood weighed gravity. Predict which side falls, then release.',
  schema: z.object({
    m1: z.number().min(1).max(8).finite().default(3),
    m2: z.number().min(1).max(8).finite().default(2),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['newton-laws', 'dynamics'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Predict the direction of acceleration',
      'Relate mass difference and total mass to acceleration',
      'Explain rope tension in a coupled system',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
