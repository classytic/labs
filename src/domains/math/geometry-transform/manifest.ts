import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'geometry-transform',
  tag: 'GeoTransform',
  domain: 'math',
  group: 'Math',
  title: 'Transformations (translate / reflect / rotate / enlarge)',
  description:
    'Send a shape onto ghost targets by filling the transform from a tile tray; on a correct fill the shape flies to the targets. One lab, four transformation types.',
  schema: z.object({
    kind: z.enum(['translate', 'reflect', 'rotate', 'enlarge']).default('translate'),
    byX: z.number().default(5),
    byY: z.number().default(1),
    axis: z.enum(['x', 'y', 'y=x', 'y=-x']).default('y'),
    deg: z.number().default(90),
    k: z.number().default(2),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  omit: ['activity'],
  experience: {
    objectives: [
      'Predict the image of a shape under a named transformation',
      'Construct translations, reflections, rotations and enlargements from parameters',
      'Identify the quantities each transformation preserves',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['math', 'geometry', 'transformations'],
    durationMinutes: 12,
    interaction: 'build',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
