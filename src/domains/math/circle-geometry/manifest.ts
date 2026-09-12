import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { pointSchema, labAskSchema } from '../schemas.js';

export default defineLab({
  id: 'circle-geometry',
  tag: 'CircleLab',
  domain: 'math',
  group: 'Math',
  title: 'Circle ((x−a)² + (y−b)² = r², tangent)',
  description:
    'Drag the centre and rim; live standard + expanded equation, optional tangent (⊥ to the radius). Optional graded answer.',
  schema: z.object({
    center: pointSchema.optional(),
    radius: z.number().optional(),
    showTangent: z.boolean().optional(),
    showExpanded: z.boolean().optional(),
    tangentAngleDeg: z.number().optional(),
    snap: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    ask: labAskSchema.optional(),
    activity: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Relate a circle equation to its centre and radius',
      'Construct a tangent perpendicular to the radius at the contact point',
      'Translate between standard and expanded equation forms',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['math', 'coordinate-geometry', 'circle'],
    durationMinutes: 12,
    interaction: 'build',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
