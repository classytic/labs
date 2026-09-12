import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'meiosis-explorer',
  tag: 'MeiosisExplorerLab',
  domain: 'biology',
  group: 'Cell biology',
  title: 'Meiosis inheritance explorer',
  description:
    'Track homolog pairing, crossing over, independent orientation, and two divisions into four haploid products.',
  schema: z.object({
    checkpoint: z
      .enum(['pairing', 'crossing-over', 'metaphase-i', 'anaphase-i', 'metaphase-ii', 'products'])
      .default('pairing'),
    crossover: z.boolean().default(true),
    orientation: z.enum(['maternal-left', 'paternal-left']).default('maternal-left'),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['biology', 'cell-division', 'meiosis', 'inheritance', 'variation'],
    durationMinutes: 20,
    interaction: 'guided',
    authorability: 'moderate',
    prerequisites: ['mitosis-explorer'],
    related: ['mitosis-explorer', 'punnett-cross'],
  },
  experience: {
    objectives: [
      'Distinguish homologs from sister chromatids',
      'Connect crossing over to recombinant chromatids',
      'Connect independent assortment to product combinations',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
