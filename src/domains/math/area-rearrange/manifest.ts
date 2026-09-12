import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'area-rearrange',
  tag: 'AreaRearrange',
  domain: 'math',
  group: 'Mensuration',
  title: 'Cut and rearrange: where an area formula comes from',
  description:
    'A triangle is half its rectangle, a parallelogram is a rectangle with one triangle carried across, two trapezia make a parallelogram, and a circle cut into sectors closes into a rectangle of height r and width pi r. Drag the cut open and watch the shape you already know appear, with nothing added and nothing thrown away.',
  schema: z.object({
    mode: z
      .enum(['triangle', 'parallelogram', 'trapezium', 'circle'])
      .optional()
      .describe('which rearrangement'),
    base: z.number().min(3).max(14).optional().describe('base of the shape'),
    height: z.number().min(2).max(10).optional().describe('perpendicular height'),
    lean: z.number().min(0).max(8).optional().describe('apex offset or lean'),
    top: z.number().min(1).max(12).optional().describe('top parallel side, trapezium only'),
    sectors: z.number().int().min(4).max(24).optional().describe('sectors a circle is cut into'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'See that rearranging pieces cannot change an area',
      'Derive the triangle, parallelogram, trapezium and circle formulas rather than recall them',
      'Read a circle of sectors as a rectangle of height r and width pi r',
    ],
    phases: ['predict', 'act', 'observe', 'explain'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['mensuration', 'area', 'circle'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
