import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'mirror-imaging',
  domain: 'physics',
  group: 'Physics',
  title: 'Mirror imaging (concave & convex)',
  description:
    'Curved-mirror images by reflecting the three principal rays back to the object side. Concave: object beyond C → real inverted diminished (telescope); between F and C → enlarged; inside F → virtual upright magnified (shaving mirror). Convex: always a small virtual upright image behind the mirror (car wing-mirror, shop security). Author focal length / object distance / mirror type for any "describe the image" quiz. Predict-first, on the shared thinOptic kernel.',
  schema: z.object({
    focalLength: z.number().finite().min(3).max(16).optional().describe('focal length magnitude (cm)'),
    objectDistance: z
      .number()
      .finite()
      .min(3)
      .max(36)
      .optional()
      .describe('object distance from the mirror (cm)'),
    mirror: z.enum(['concave', 'convex']).optional().describe('concave (converging) or convex (diverging)'),
    objectHeight: z.number().finite().positive().max(10).optional(),
    height: z.number().int().min(280).max(720).optional(),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['optics', 'mirrors', 'imaging'],
    durationMinutes: 15,
    interaction: 'predict',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Trace the principal mirror rays',
      'Classify concave- and convex-mirror images',
      'Relate focal landmarks to image size and orientation',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
