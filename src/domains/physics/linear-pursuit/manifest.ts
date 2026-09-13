import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'linear-pursuit',
  /**
   * The JSX tag a lesson writes, so it must be a valid identifier.
   *
   * This read `Catch-up motion`, the human label, which the generator copied faithfully into the
   * render map and the curriculum's lab-keys snapshot. `<Catch-up motion />` is not parseable, so
   * the lab has never been usable from a lesson and never could be. The label lives in `title`.
   */
  tag: 'LinearPursuit',
  domain: 'physics',
  group: 'Physics',
  title: 'Catch-up motion: where do they meet?',
  description:
    'Model a car catching a bus, a car catching a train, or two cars on one road. A delayed accelerating chaser and a moving leader meet where both their road positions and their position-time paths coincide.',
  schema: z.object({
    scenario: z.enum(['bus-car', 'train-car', 'cars']).optional(),
    headStartM: z.number().min(20).max(240).optional().describe('leader head start in metres'),
    delayS: z.number().min(0).max(12).optional().describe('chaser start delay in seconds'),
    leaderSpeed: z.number().min(0).max(40).optional().describe('leader speed in metres per second'),
    chaserSpeed: z.number().min(0).max(40).optional().describe('chaser initial speed in metres per second'),
    chaserAcceleration: z
      .number()
      .min(0)
      .max(4)
      .optional()
      .describe('chaser acceleration in metres per second squared'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Interpret a head start and delayed departure on a shared number line',
      'Connect motion on a road to position-time graphs',
      'Identify a meeting as equal position at equal time',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['8', '9', '10', '11'],
    outcomes: ['linear-motion', 'kinematics', 'position-time-graphs', 'simultaneous-equations'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
