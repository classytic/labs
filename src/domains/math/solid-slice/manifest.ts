import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'solid-slice',
  tag: 'SolidSlice',
  domain: 'math',
  group: 'Math',
  title: 'The hidden right triangle',
  description:
    'A cuboid or square-based pyramid the learner can turn, with the one right triangle a 3D question is actually about highlighted inside it. A second control carries that triangle out of the solid until it lies flat beside it, sides labelled. Three-dimensional trigonometry is ordinary trigonometry on a triangle nobody has drawn, so this draws it twice, in place and on the page, and shows every position in between.',
  schema: z.object({
    solid: z.enum(['cuboid', 'pyramid']).default('cuboid'),
    length: z.number().min(1).max(20).default(8),
    width: z.number().min(1).max(20).default(6),
    height: z.number().min(1).max(20).default(5),
    target: z
      .enum(['face-diagonal', 'space-diagonal', 'line-plane-angle'])
      .default('space-diagonal')
      .describe('which quantity the question asks for'),
    yaw: z.number().min(-60).max(110).default(35).describe('starting turn of the view'),
    lift: z.number().min(0).max(1).default(0).describe('0 opens with the triangle inside the solid, 1 with it flat on the page'),
    unit: z.string().default('cm'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Identify which right triangle inside a solid a question is about',
      'Find a face diagonal, then build the space diagonal or the line-plane angle on it',
      'Transfer a triangle from a three-dimensional drawing onto a flat page',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['math', 'trigonometry', 'three-dimensions'],
    durationMinutes: 9,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
