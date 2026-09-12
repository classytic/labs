import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'lorentz',
  domain: 'physics',
  group: 'Physics',
  title: 'Lorentz force F = q·v×B',
  description:
    'A charge fired into a magnetic field curves (cyclotron motion); v, B, F shown perpendicular with the right-hand rule. Flip charge or field → the curve reverses. Cyclotron / aurora framing.',
  schema: z.object({
    charge: z.union([z.literal(1), z.literal(-1)]).default(1),
    fieldOut: z.boolean().default(true),
    B: z.number().finite().min(0.6).max(3).default(1.4),
    speed: z.number().finite().min(0.6).max(4).default(2),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['magnetism', 'lorentz-force'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Determine magnetic-force direction',
      'Explain why magnetic force changes direction but not speed',
      'Relate field strength and speed to orbit radius',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
