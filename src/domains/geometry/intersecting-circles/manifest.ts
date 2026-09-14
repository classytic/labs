import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'intersecting-circles',
  domain: 'geometry',
  group: 'Geometry',
  title: 'Intersecting circles',
  description: 'Common chord of two circles, drag the centres, chord length by Pythagoras.',
  schema: z.object({
    prompt: z.string().optional(), r1: z.number().optional(), r2: z.number().optional(), title: z.string().optional() }),
  experience: {
    objectives: [
      'Predict whether two circles intersect from radii and centre distance',
      'Relate the common chord to the line of centres',
      'Derive chord length using right triangles and Pythagoras',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['geometry', 'circles', 'pythagoras'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
