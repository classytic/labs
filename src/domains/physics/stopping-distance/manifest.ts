import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'stopping-distance',
  domain: 'physics',
  group: 'Physics',
  title: 'Stopping distance (drive & brake)',
  description:
    '1-D kinematics: a car reacts then brakes; the road paints a blue thinking stripe + red braking stripe while synced v–t (area = distance) and s–t graphs share a playhead. ×2 speed shows thinking double but braking quadruple.',
  schema: z
    .object({
      speed: z.number().min(5).max(40).finite().default(20),
      reactionTime: z.number().min(0.2).max(2).finite().default(0.7),
      deceleration: z.number().min(2).max(10).finite().default(6),
      maxSpeed: z.number().min(5).max(80).finite().default(40),
      predict: z.boolean().default(false),
      showGraphs: z.boolean().default(false),
      title: z.string().trim().min(1).optional(),
      prompt: z.string().trim().min(1).optional(),
      activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
    })
    .refine(({ speed, maxSpeed }) => speed <= maxSpeed, {
      message: 'speed must not exceed maxSpeed',
      path: ['speed'],
    }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['kinematics', 'stopping-distance'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Separate reaction distance from braking distance',
      'Relate braking distance to speed squared',
      'Transfer the model to a safer driving decision',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
