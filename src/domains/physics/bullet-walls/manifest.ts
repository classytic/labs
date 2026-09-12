import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../blocks/lab-block.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'bullet-walls',
  domain: 'physics',
  group: 'Physics',
  title: 'Bullet through N planks (penetration)',
  description:
    'The classic "how many planks?" problem, predict-first: each plank drains a fixed chunk of energy (a fixed Δv²), so the bullet slows plank-by-plank and lodges when its kinetic energy runs out. Guess the count, fire, and watch v² = u² − 2as play out with a draining energy bar.',
  schema: z.object({
    speed: z.number().finite().min(10).max(60).optional(),
    toughness: z.number().finite().min(40).max(400).optional(),
    planks: z.number().int().min(1).max(10).optional(),
    mass: z.number().finite().positive().max(1).optional(),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['kinematics', 'energy'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict penetration from an energy budget',
      'Track kinetic energy across repeated barriers',
      'Explain why penetration scales with speed squared',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
