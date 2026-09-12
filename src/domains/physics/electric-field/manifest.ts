import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'electric-field',
  domain: 'physics',
  group: 'Physics',
  title: 'Electric field, charges & the force F = qE',
  description:
    'Drag two charges and flip their signs; field lines retrace live, flowing out of + into −. Drop a test charge anywhere and a force arrow F = qE appears, toward + or away depending on its sign. Like charges repel, opposites attract.',
  schema: z.object({
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    objectives: z.array(z.string().trim().min(1)).min(1).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['electrostatics', 'electric-field'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict force direction from field direction',
      'Distinguish field from force on a signed probe',
      'Compare like-charge and dipole fields',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
