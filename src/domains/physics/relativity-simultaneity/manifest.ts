import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'relativity-simultaneity',
  tag: 'RelativitySimultaneityLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'Relativity of simultaneity',
  description: 'Transform the same pair of separated flash events between platform and train frames.',
  schema: z.object({
    beta: z.number().min(-0.995).max(0.995).default(0.6),
    separationM: z.number().positive().max(1e7).default(300),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['physics', 'modern-physics', 'special-relativity', 'simultaneity', 'lorentz-transform'],
    durationMinutes: 16,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: ['relativity-light-clock'],
    related: ['relativity-light-clock', 'muon-survival'],
  },
  experience: {
    objectives: [
      'Define simultaneity using synchronized clocks',
      'Transform separated events between frames',
      'Distinguish emission time from light-arrival time',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
