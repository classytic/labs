import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'mitosis-explorer',
  tag: 'MitosisExplorerLab',
  domain: 'biology',
  group: 'Cell biology',
  title: 'Mitosis chromosome explorer',
  description:
    'Follow duplicated chromosomes from the nucleus through alignment and sister-chromatid separation.',
  schema: z.object({
    checkpoint: z.enum(['cell', 'nucleus', 'prophase', 'metaphase', 'anaphase']).default('cell'),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['9', '10', '11', '12'],
    outcomes: ['biology', 'cell-division', 'mitosis', 'chromosome', 'spindle'],
    durationMinutes: 18,
    interaction: 'guided',
    authorability: 'moderate',
    prerequisites: [],
    related: ['central-dogma'],
  },
  experience: {
    objectives: [
      'Track chromosome and chromatid identity',
      'Connect spindle attachment to equal segregation',
      'Place DNA replication before mitosis',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
