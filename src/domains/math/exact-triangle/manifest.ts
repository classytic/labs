import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'exact-triangle',
  tag: 'ExactTriangle',
  domain: 'math',
  group: 'Math',
  title: 'Where the exact values come from',
  description:
    'sin 30 = 1/2 taught as a measurement rather than a fact to memorise. An equilateral triangle of side 2 cuts down the middle into 1, 2 and root 3; a unit square cuts on its diagonal into 1, 1 and root 2. Open the cut and read the ratios straight off the half that is left. Both accepted forms are shown, 1/root 2 and root 2 over 2, because a learner who has only met one assumes the other is a different number.',
  schema: z.object({
    shape: z.enum(['half-equilateral', 'half-square']).default('half-equilateral'),
    angle: z
      .union([z.literal(30), z.literal(45), z.literal(60)])
      .optional()
      .describe('which angle to read the ratios at; defaults to 60 for the triangle and 45 for the square'),
    cut: z.number().min(0).max(1).default(0).describe('0 opens with the shape whole, 1 with it already cut'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Derive the exact sine, cosine and tangent of 30, 45 and 60 degrees from a cut shape',
      'Recognise the two accepted forms of a ratio with a root underneath',
      'Rebuild a forgotten exact value rather than recalling it',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['math', 'trigonometry', 'exact-values'],
    durationMinutes: 7,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
