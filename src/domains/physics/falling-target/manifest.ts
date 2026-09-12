import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'falling-target',
  tag: 'FallingTarget',
  domain: 'physics',
  group: 'Physics',
  title: 'Hit the falling target',
  description:
    'The monkey-and-hunter demonstration as a game: a coconut drops from its tree the moment the stone is thrown, and the learner chooses the aim and the speed. The figure draws the no-gravity line and the ½gt² drop below it for both bodies, so aiming straight at the target is seen to be right. Gravity can be switched off to compare.',
  schema: z.object({
    target: z
      .object({ x: z.number().min(5).max(80), y: z.number().min(2).max(40) })
      .optional()
      .describe('where the target hangs, metres from the thrower'),
    angle: z.number().min(0).max(75).optional().describe('starting aim, degrees'),
    speed: z.number().min(5).max(50).optional().describe('starting throw speed, m/s'),
    drops: z.boolean().optional().describe('release the target at the moment of the throw'),
    noGravity: z.boolean().optional().describe('start with gravity switched off'),
    at: z.number().min(0).max(10).optional().describe('open frozen this many seconds after launch'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Aim a projectile at a target that falls as it is launched',
      'Explain why both bodies fall the same distance below their straight-line paths',
      'Find the least speed that still reaches the target in time',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['kinematics', 'projectile-motion', 'free-fall', 'independence-of-components'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
