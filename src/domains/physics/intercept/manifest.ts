import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

const vec = z.object({ x: z.number().finite(), y: z.number().finite() });

export default defineLab({
  id: 'intercept',
  tag: 'Intercept',
  domain: 'physics',
  group: 'Physics',
  title: 'The tiger and the deer',
  description:
    'Interception with relative velocity. A tiger with a short sprint chooses a heading to catch a deer running across its path. Aiming at the deer misses; leading it until the relative velocity (tiger minus deer, built tip to tail) lies along the line of sight catches it. A deer’s-eye view turns the chase into a straight line, and a "keep turning" pursuit shows why curving after the deer wastes the sprint.',
  schema: z.object({
    chaser: vec.optional().describe('where the tiger starts, m'),
    quarry: vec.optional().describe('where the deer starts, m'),
    chaserSpeed: z.number().min(5).max(30).optional().describe('tiger speed, m/s'),
    quarryVelocity: vec.optional().describe('deer velocity, m/s'),
    stamina: z.number().min(1).max(30).optional().describe('how long the tiger can sprint, s'),
    heading: z.number().min(0).max(180).optional().describe('starting heading, degrees from east'),
    strategy: z
      .enum(['straight', 'chase'])
      .optional()
      .describe('run straight, or keep turning towards the deer'),
    at: z.number().min(0).max(30).optional().describe('open frozen this many seconds after the start'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Find the heading that intercepts a moving target',
      'Build a relative velocity by adding the negative of the other velocity',
      'Explain a collision course as a relative velocity along the line of sight',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['vectors', 'relative-velocity', 'interception', 'kinematics'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
