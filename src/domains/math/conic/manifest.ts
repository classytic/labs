import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { labAskSchema } from '../schemas.js';

export default defineLab({
  id: 'conic',
  tag: 'ConicLab',
  domain: 'math',
  group: 'Math',
  title: 'Conic (parabola / ellipse / hyperbola / reciprocal)',
  description:
    'Drag a parabola (y²=4ax, focus+directrix), an ellipse (x²/a²+y²/b²=1, foci), a hyperbola (x²/a²−y²/b²=1, asymptotes), or the reciprocal xy=c. Optional graded answer.',
  schema: z.object({
    kind: z.enum(['parabola', 'ellipse', 'hyperbola', 'rectangular']).optional(),
    a: z.number().optional(),
    b: z.number().optional(),
    c: z.number().optional(),
    showFocusDirectrix: z.boolean().optional(),
    showAsymptotes: z.boolean().optional(),
    snap: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    ask: labAskSchema.optional(),
    activity: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Connect each conic equation to its defining geometric constraint',
      'Track how authored parameters move foci, directrices or asymptotes',
      'Distinguish conic families from their visual invariants',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['math', 'coordinate-geometry', 'conics'],
    durationMinutes: 15,
    interaction: 'build',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
