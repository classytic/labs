import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'water-density',
  domain: 'physics',
  group: 'Physics',
  title: 'Water’s 4 °C anomaly, why ice floats',
  description:
    'Water is densest at 4 °C and expands again toward freezing, so ice floats. Drag the temperature on the density curve, or switch to the lake view to see why a pond freezes top-down (4 °C water and fish survive below the ice).',
  schema: z.object({
    mode: z.enum(['anomaly', 'lake']).optional(),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['density', 'thermal-expansion'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Identify water’s maximum density near 4 °C',
      'Explain why ice floats',
      'Explain why lakes freeze from the surface downward',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
