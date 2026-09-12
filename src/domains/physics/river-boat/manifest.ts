import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'river-boat',
  domain: 'physics',
  group: 'Physics',
  title: 'River crossing (vectors)',
  description: 'Boat-and-river vector problem, step through tip-to-tail addition + component resolution.',
  schema: z.object({
    boatSpeed: z.number().finite().min(0.5).max(10).default(4),
    current: z.number().finite().min(0).max(8).default(2),
    riverWidth: z.number().finite().min(3).max(14).default(8),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    objectives: z.array(z.string().trim().min(1)).min(1).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['vectors', 'relative-velocity'],
    durationMinutes: 12,
    interaction: 'guided',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Add boat and current velocity vectors',
      'Resolve the resultant into crossing and drift components',
      'Choose a heading that controls the landing point',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
