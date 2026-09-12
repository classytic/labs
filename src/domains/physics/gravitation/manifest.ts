import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps, controlConfig } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'gravitation',
  domain: 'physics',
  group: 'Physics',
  title: 'Universal gravitation, the inverse-square law',
  description:
    'Newton’s F = G·M·m / r². Drag the satellite and the pull tracks 1/r²: double the distance and the force drops to a quarter (not a half). A live F–r curve marks your spot on the steep fall-off; the same law thins weight with altitude (g = GM/r²) and sets orbital speed v = √(GM/r).',
  schema: z.object({
    planetMass: z.number().finite().min(1).max(9).default(5),
    satMass: z.number().finite().min(1).max(5).default(1),
    controlConfig,
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['gravitation', 'inverse-square'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Predict inverse-square scaling',
      'Connect distance to field strength',
      'Transfer the law to mass and altitude changes',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
