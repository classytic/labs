import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../blocks/lab-block.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'impulse',
  domain: 'physics',
  group: 'Physics',
  title: 'Impulse, catch the egg (J = F·Δt = Δp)',
  description:
    'Same ball, same speed → fixed impulse. Stretch the contact time and the force–time pulse morphs from a tall spike to a low bump with EQUAL shaded area, so the peak force plummets. A fragile egg cracks above its force limit, the number behind airbags, crumple zones and bending your knees.',
  schema: z.object({
    mass: z.number().min(0.2).max(1.5).finite().default(0.5),
    speed: z.number().min(2).max(12).finite().default(8),
    contact: z.number().min(0.02).max(0.3).finite().default(0.05),
    crackForce: z.number().positive().max(1000).finite().default(120),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['momentum', 'impulse'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Relate impulse to force-time area',
      'Explain why longer stopping time lowers peak force',
      'Transfer the model to a safety design',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
