import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'photoelectric-effect',
  tag: 'PhotoelectricEffectLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'Photoelectric effect',
  description:
    'Discover threshold wavelength, photon energy, photocurrent, and stopping potential at a virtual experiment bench.',
  schema: z.object({
    metal: z.enum(['sodium', 'aluminium', 'zinc', 'copper', 'platinum']).default('sodium'),
    wavelengthNm: z.number().min(100).max(2000).default(400),
    intensity: z.number().positive().max(1).default(0.6),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['physics', 'modern-physics', 'quantum', 'photoelectric-effect', 'photon', 'work-function'],
    durationMinutes: 18,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: [],
    related: ['nuclear-binding-energy'],
  },
  experience: {
    objectives: [
      'Discover the threshold frequency',
      'Separate photon energy from photon rate',
      'Measure maximum kinetic energy with stopping potential',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
