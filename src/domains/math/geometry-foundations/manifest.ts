import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'geometry-foundations',
  tag: 'GeometryFoundationsLab',
  domain: 'math',
  group: 'Geometry and measurement',
  title: 'Geometry by decomposition',
  description:
    'Rearrange Pythagorean areas, compare angles on a shared circle arc, and derive polygon angle sums by triangulation.',
  schema: z.object({
    mode: z.enum(['pythagorean', 'circle-theorem', 'polygon-angles']).default('pythagorean'),
    sideA: z.number().min(2).max(8).default(3),
    sideB: z.number().min(2).max(8).default(4),
    centralAngle: z.number().min(30).max(240).default(100),
    sides: z.number().int().min(3).max(10).default(6),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['7', '8', '9', '10'],
    outcomes: ['geometry', 'pythagorean-theorem', 'circle-theorems', 'polygon-angles', 'proof'],
    durationMinutes: 18,
    interaction: 'guided',
    authorability: 'moderate',
    prerequisites: [],
    related: ['measurement', 'circle-geometry', 'triangle-trig'],
  },
  experience: {
    objectives: [
      'Explain the Pythagorean relationship as conservation of area',
      'Relate angles subtended by the same circle arc',
      'Derive polygon angle sums by triangulation',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
