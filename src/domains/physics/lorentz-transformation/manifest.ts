import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'lorentz-transformation',
  tag: 'LorentzTransformationLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'Lorentz transformation explorer',
  description: 'Drag spacetime events, transform coordinates, and verify the invariant interval.',
  schema: z.object({
    event: z.object({ x: z.number().default(1), ct: z.number().default(3) }).default({ x: 1, ct: 3 }),
    beta: z.number().min(-0.995).max(0.995).default(0.6),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['physics', 'modern-physics', 'special-relativity', 'lorentz-transform', 'spacetime-interval'],
    durationMinutes: 20,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: ['relativity-simultaneity'],
    related: ['length-contraction', 'relativity-light-clock'],
  },
  experience: {
    objectives: [
      'Transform spacetime coordinates',
      'Classify timelike, lightlike, and spacelike intervals',
      'Verify the invariant interval',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
