import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'entropy',
  domain: 'physics',
  group: 'Physics',
  title: 'Entropy & the 2nd law, the one-way arrow',
  description:
    'Why heat flows hot→cold (ΔS_total = Q/Tc − Q/Th > 0) and a gas spreads into a vacuum (ΔS = nR·ln Vf/Vi). The total entropy of the universe always increases. Two modes: heat flow and free expansion.',
  schema: z.object({
    mode: z.enum(['heat', 'expansion']).optional(),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['12'],
    outcomes: ['thermodynamics', 'entropy', 'second-law'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Calculate entropy change for heat transfer',
      'Explain why spontaneous processes increase total entropy',
      'Relate free expansion to accessible microstates',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
