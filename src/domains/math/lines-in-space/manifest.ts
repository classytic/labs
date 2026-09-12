import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

const vec3 = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);

export default defineLab({
  id: 'lines-in-space',
  tag: 'LinesInSpace',
  domain: 'math',
  group: 'Vectors',
  title: 'Lines in space',
  description:
    'Vectors and lines in three dimensions, drawn in a view the learner can turn. Two vectors and the angle from their scalar product, a line as r = a + t b, two lines that meet or are skew, and the perpendicular from a point to a line. Where two lines cross on screen the nearer passes over the further, so turning the view shows whether a crossing is real.',
  schema: z.object({
    mode: z
      .enum(['vectors', 'line', 'two-lines', 'perpendicular'])
      .optional()
      .describe('which part of the topic to show'),
    a: vec3.optional().describe('vectors: the first vector; otherwise a point on the first line'),
    b: vec3.optional().describe('vectors: the vector the learner edits; otherwise the first direction'),
    c: vec3.optional().describe('two-lines: a point on the second line'),
    d: vec3.optional().describe('two-lines: the direction of the second line'),
    p: vec3.optional().describe('perpendicular: the point off the line'),
    goal: z.enum(['perpendicular']).optional().describe('vectors: solved when a · b = 0'),
    predict: z.boolean().optional().describe('two-lines: ask for a verdict before revealing'),
    yaw: z.number().min(-180).max(180).optional().describe('starting turn, degrees'),
    pitch: z.number().min(-5).max(85).optional().describe('starting tilt above the ground, degrees'),
    range: z.number().positive().max(20).optional().describe('radius of the drawn region'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Read and use position and direction vectors in three dimensions',
      'Find the angle between two vectors from the scalar product',
      'Decide whether two lines meet, are parallel, or are skew',
      'Find the foot of the perpendicular from a point to a line',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['12'],
    outcomes: ['vectors', 'scalar-product', 'lines-in-3d', 'skew-lines'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
