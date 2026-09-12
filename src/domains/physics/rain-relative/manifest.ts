import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'rain-relative',
  domain: 'physics',
  group: 'Physics',
  title: 'Rain on a moving car (relative velocity)',
  description:
    'Animated rain that slants as the car speeds up, apparent velocity V_rain − V_car, with a live triangle + angle.',
  schema: z
    .object({
      maxSpeed: z.number().finite().min(1).max(40).default(10),
      start: z.number().finite().min(0).max(40).default(0),
      title: z.string().trim().min(1).optional(),
      prompt: z.string().trim().min(1).optional(),
      objectives: z.array(z.string().trim().min(1)).min(1).optional(),
      activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
    })
    .refine(({ start, maxSpeed }) => start <= maxSpeed, {
      message: 'start speed must not exceed maxSpeed',
      path: ['start'],
    }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['vectors', 'relative-velocity'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Subtract velocities in different frames',
      'Relate relative components to apparent angle',
      'Transfer relative velocity to a new moving observer',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
