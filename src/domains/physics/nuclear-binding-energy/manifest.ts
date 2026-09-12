import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'nuclear-binding-energy',
  tag: 'NuclearBindingEnergyLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'Nuclear binding energy',
  description:
    'Connect mass defect, binding energy, and the stability curve that explains fusion and fission.',
  schema: z.object({
    nuclide: z
      .enum(['deuterium', 'helium4', 'carbon12', 'iron56', 'uranium235', 'uranium238'])
      .default('iron56'),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['physics', 'modern-physics', 'nuclear', 'mass-defect', 'binding-energy', 'fission', 'fusion'],
    durationMinutes: 18,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: ['relativity-light-clock'],
    related: ['muon-survival'],
  },
  experience: {
    objectives: [
      'Interpret mass defect as binding energy',
      'Read binding energy per nucleon',
      'Explain why light nuclei fuse and heavy nuclei fission toward the iron region',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
