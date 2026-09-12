import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'solid-net',
  tag: 'SolidNet',
  domain: 'math',
  group: 'Mensuration',
  title: 'Solids seen flat: layers, nets, spheres and joins',
  description:
    'A cuboid drawn in perspective hides three of its six faces, and those are the ones learners forget to add. Every view here is flat: volume as stacked layers, the solid opened into its net, a sphere in side view, and two solids joined with the faces that stop being outside marked.',
  schema: z.object({
    mode: z.enum(['layers', 'net', 'sphere', 'compound']).optional().describe('which flat view'),
    length: z.number().min(1).max(12).optional(),
    width: z.number().min(1).max(12).optional(),
    height: z.number().min(1).max(8).optional().describe('layers, or the lower solid'),
    topHeight: z.number().min(1).max(6).optional().describe('the upper solid, joined mode'),
    radius: z.number().min(1).max(6).optional().describe('sphere radius'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Count a volume as one layer repeated, so the cubed unit is earned rather than recalled',
      'Add a surface area from a net, using the fact that opposite faces match',
      'See why joining two solids adds their volumes but reduces their surface area',
    ],
    phases: ['predict', 'act', 'observe', 'explain'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['mensuration', 'volume', 'surface-area'],
    durationMinutes: 9,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
