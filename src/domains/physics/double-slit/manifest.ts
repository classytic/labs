import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'double-slit',
  tag: 'DoubleSlitLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'Single-particle double slit',
  description:
    'Accumulate localized detections into an interference distribution and test which-path information.',
  schema: z.object({
    wavelengthNm: z.number().min(100).max(2000).default(550),
    slitSeparationUm: z.number().positive().max(1000).default(120),
    detections: z.number().int().min(1).max(5000).default(80),
    whichPath: z.boolean().default(false),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['physics', 'quantum', 'double-slit', 'interference', 'probability', 'which-path'],
    durationMinutes: 18,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: [],
    related: ['photoelectric-effect'],
  },
  experience: {
    objectives: [
      'Distinguish individual detections from the probability distribution',
      'Relate fringe spacing to wavelength and slit separation',
      'Explain why available path information removes interference',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
