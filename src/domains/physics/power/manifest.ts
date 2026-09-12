import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'power',
  domain: 'physics',
  group: 'Physics',
  title: 'Power (gradient of the energy–time graph)',
  description:
    'Power as the RATE of energy transfer, read as the gradient of an energy–time graph. Its sibling work-energy shows work as an area under force–distance; this is the other half. Two situations on the same axes: a pump doing a fixed job W = mgh, where more power is a steeper line meeting the same target sooner (P = W/t), and a bus at steady speed where drag balances the drive force so every joule goes against drag (P = Fv).',
  schema: z.object({
    mode: z.enum(['lift', 'drive']).optional().describe('which situation opens first'),
    massKg: z.number().finite().min(100).max(2000).optional().describe('lift: mass raised, kg'),
    heightM: z.number().finite().min(4).max(40).optional().describe('lift: height raised, m'),
    powerW: z.number().finite().min(500).max(12000).optional().describe('lift: pump power, W'),
    forceN: z.number().finite().min(100).max(2000).optional().describe('drive: steady driving force, N'),
    speedMs: z.number().finite().min(5).max(40).optional().describe('drive: steady speed, m/s'),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['energy', 'power'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Read power as the gradient of an energy-time graph',
      'Use P = W / t for a job of fixed size',
      'Use P = Fv at a steady speed, where drive force balances drag',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
