import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { askSchema } from '../schemas.js';

/** Ships a custom editor (labels + draggable toggles + the graded ask) via loadAuthoring. */
export default defineLab({
  id: 'triangle-trig',
  domain: 'math',
  group: 'Math',
  title: 'Triangle trig (elevation/depression)',
  description:
    'A right triangle for elevation/depression: give an angle + one side, solve the rest, grade a typed answer.',
  schema: z.object({
    angleDeg: z.number().min(5).max(85).optional(),
    // The leg slider runs legMin (1) to max(20, 2·leg), i.e. its top end SCALES with the authored
    // value, so only the lower end is a fixed runtime bound.
    leg: z.number().min(1).optional(),
    legKind: z.enum(['opposite', 'adjacent']).optional(),
    mode: z.enum(['elevation', 'depression', 'plain']).optional(),
    labels: z
      .object({
        opposite: z.string().optional(),
        adjacent: z.string().optional(),
        hypotenuse: z.string().optional(),
        angle: z.string().optional(),
      })
      .optional(),
    drive: z.array(z.enum(['angle', 'leg'])).optional(),
    ask: askSchema.optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Choose the trigonometric ratio linking the known and unknown sides',
      'Connect elevation or depression language to a right-triangle model',
      'Solve and verify a missing side or angle in an authored context',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['math', 'trigonometry', 'right-triangle'],
    durationMinutes: 12,
    interaction: 'build',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
