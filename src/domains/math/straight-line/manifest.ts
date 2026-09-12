import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { pointSchema, labAskSchema } from '../schemas.js';

/** Ships a custom editor (form chooser + the typed-or-MCQ graded question) via loadAuthoring. */
export default defineLab({
  id: 'straight-line',
  tag: 'StraightLine',
  domain: 'math',
  group: 'Math',
  title: 'Straight line (y = mx + c, parallel/⊥, intercepts)',
  description:
    'Drag points/intercepts to build a line; covers gradient–intercept, two-point, intercept form, and parallel/perpendicular. Optional graded answer.',
  schema: z.object({
    mode: z
      .enum(['two-point', 'gradient-intercept', 'intercept-form', 'parallel', 'perpendicular'])
      .optional(),
    pointA: pointSchema.optional(),
    pointB: pointSchema.optional(),
    given: z.object({ m: z.number(), c: z.number() }).optional(),
    through: pointSchema.optional(),
    showDistance: z.boolean().optional(),
    snap: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    ask: labAskSchema.optional(),
    activity: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Construct a line from points, gradient, intercepts or a relationship to another line',
      'Connect geometric movement to gradient and intercept values',
      'Transfer between equivalent straight-line forms',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['math', 'coordinate-geometry', 'straight-line'],
    durationMinutes: 12,
    interaction: 'build',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
