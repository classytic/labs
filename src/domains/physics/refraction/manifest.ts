import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'refraction',
  domain: 'physics',
  group: 'Physics',
  title: 'Refraction & total internal reflection (Snell’s law)',
  description:
    'A ray crossing between two media bends per n₁sinθ₁ = n₂sinθ₂: toward the normal into a denser medium, away out of it. Past the critical angle (dense → rare) it can’t escape — total internal reflection (optical fibres). Author the two indices (or material presets) and the angle to spin up air→glass, glass→water, diamond… endless quiz variants. Predict-first.',
  schema: z.object({
    n1: z.number().finite().positive().max(5).optional().describe('refractive index of the top medium'),
    n2: z.number().finite().positive().max(5).optional().describe('refractive index of the bottom medium'),
    angle: z
      .number()
      .finite()
      .min(0)
      .max(89)
      .optional()
      .describe('angle of incidence, degrees from the normal'),
    materials: z
      .array(z.object({ label: z.string().trim().min(1), n: z.number().finite().positive().max(5) }))
      .min(2)
      .optional()
      .describe('material presets offered as chips'),
    height: z.number().int().min(280).max(720).optional(),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['optics', 'refraction', 'snells-law'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Apply Snell’s law',
      'Predict whether light bends toward or away from the normal',
      'Identify the critical angle and total internal reflection',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
