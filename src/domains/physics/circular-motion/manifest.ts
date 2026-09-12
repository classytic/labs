import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps, controlConfig } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'circular-motion',
  domain: 'physics',
  group: 'Physics',
  title: 'Circular motion, centripetal force & cut the string',
  description:
    'A ball whirls on a string: velocity stays tangent while the tension (centripetal force F = mv²/r) points to the centre, bending the path without changing speed. Cut the string and it flies off along the TANGENT, not radially outward, killing the classic misconception. Live F, ω and period.',
  schema: z.object({
    speed: z.number().finite().min(2).max(12).optional(),
    radius: z.number().finite().min(1.5).max(5).optional(),
    mass: z.number().finite().min(0.5).max(4).optional(),
    controlConfig,
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['circular-motion', 'centripetal-force'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Distinguish tangential velocity from inward force',
      'Relate centripetal force to mass, speed, and radius',
      'Predict the path after the inward force is removed',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
