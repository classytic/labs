import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'work-energy',
  domain: 'physics',
  group: 'Physics',
  title: 'Work done = area under the force–distance graph',
  description:
    'Work made visible as the AREA under the force–distance graph. A spring (F = kx) gives a triangle so W = ½kx², a constant force gives a rectangle so W = Fx. Drag the distance and the shaded area (the work) grows with it; the equation updates live.',
  schema: z.object({
    mode: z.enum(['spring', 'constant']).default('spring'),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    objectives: z.array(z.string().trim().min(1)).min(1).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['work', 'energy'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Read work as area under a force-distance graph',
      'Compare constant and variable force',
      'Predict how work scales when distance doubles',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
