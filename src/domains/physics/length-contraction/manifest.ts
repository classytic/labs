import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'length-contraction',
  tag: 'LengthContractionLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'Length contraction',
  description: 'Measure simultaneous endpoints and connect contracted length to relativity of simultaneity.',
  schema: z.object({
    beta: z.number().min(0).max(0.995).default(0.8),
    properLengthM: z.number().positive().max(1e7).default(100),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['physics', 'modern-physics', 'special-relativity', 'length-contraction', 'simultaneity'],
    durationMinutes: 16,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: ['relativity-simultaneity'],
    related: ['relativity-light-clock', 'relativity-simultaneity'],
  },
  experience: {
    objectives: [
      'Distinguish proper length from contracted length',
      'Explain why endpoint measurements must be simultaneous',
      'Connect length contraction to the Lorentz transformation',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
