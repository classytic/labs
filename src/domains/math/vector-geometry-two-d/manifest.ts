import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
export default defineLab({
  id: 'vector-geometry-two-d',
  tag: 'VectorGeometry2D',
  domain: 'math',
  group: 'Mathematics',
  title: 'Vector Geometry 2D',
  description: 'Build routes from position vectors, test scalar multiples and normalise a velocity vector.',
  schema: z.object({ title: z.string().optional(), prompt: z.string().optional() }),
  taxonomy: {
    grades: ['9', '10'],
    outcomes: ['vectors', 'position-vectors', 'unit-vectors', 'collinearity'],
    durationMinutes: 10,
    interaction: 'guided',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Find a displacement from two position vectors.',
      'Test parallelism and collinearity using a scalar multiple.',
      'Resolve a velocity into a unit vector.',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
