import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'lens-imaging',
  domain: 'physics',
  group: 'Physics',
  title: 'Lens imaging (three rays & 1/f = 1/u + 1/v)',
  description:
    'Form an image with a thin lens by tracing the three principal rays (parallel→focus, straight through the centre, focus→parallel) to where they cross. Object beyond 2F → real inverted diminished (camera); between F and 2F → enlarged (projector); inside F → virtual upright magnified (magnifying glass); diverging → small virtual upright. Author focal length / object distance / lens type for any "where and what is the image?" quiz. Predict-first, on the shared thinOptic kernel.',
  schema: z.object({
    focalLength: z.number().finite().min(3).max(16).optional().describe('focal length magnitude (cm)'),
    objectDistance: z
      .number()
      .finite()
      .min(3)
      .max(34)
      .optional()
      .describe('object distance from the lens (cm)'),
    lens: z
      .enum(['converging', 'diverging'])
      .optional()
      .describe('converging (convex) or diverging (concave)'),
    objectHeight: z.number().finite().positive().max(10).optional(),
    height: z.number().int().min(280).max(720).optional(),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['optics', 'lenses', 'imaging'],
    durationMinutes: 15,
    interaction: 'predict',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Trace the principal lens rays',
      'Classify real and virtual images',
      'Relate object distance to image distance and magnification',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
