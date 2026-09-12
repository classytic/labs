import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'moving-launcher',
  tag: 'MovingLauncher',
  domain: 'physics',
  group: 'Physics',
  title: 'Fired up from a moving cart',
  description:
    'A cart fires a ball straight up and rolls on: the learner predicts where it lands, then watches from the ground or from the cart. The ball keeps the cart’s horizontal speed, so a steady cart catches it and a cart that speeds up leaves it behind by ½at². A second mode drops one ball and throws another sideways from the same ledge, and they land together.',
  schema: z.object({
    mode: z.enum(['cart', 'drop-and-throw']).optional().describe('the cart, or two balls leaving a ledge'),
    cartSpeed: z.number().min(0).max(8).optional().describe('cart speed at launch, m/s'),
    launchSpeed: z.number().min(2).max(15).optional().describe('upward launch speed, m/s'),
    cartAccel: z.number().min(-2).max(2).optional().describe('cart acceleration after launch, m/s²'),
    height: z.number().min(2).max(40).optional().describe('drop-and-throw: ledge height, m'),
    throwSpeed: z.number().min(0).max(14).optional().describe('drop-and-throw: sideways speed, m/s'),
    predict: z.boolean().optional().describe('ask for a prediction before the launch'),
    frame: z.enum(['ground', 'cart']).optional().describe('which frame to watch from at the start'),
    at: z.number().min(0).max(10).optional().describe('open frozen this many seconds after launch'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Predict where a ball fired vertically from a moving cart lands',
      'Explain that horizontal and vertical motion are independent',
      'Describe the same motion from two frames of reference',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11', '12'],
    outcomes: ['kinematics', 'projectile-motion', 'independence-of-components', 'frames-of-reference'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
