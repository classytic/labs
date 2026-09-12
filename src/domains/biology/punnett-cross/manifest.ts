import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'punnett-cross',
  domain: 'biology',
  group: 'Biology',
  title: 'Punnett square (monohybrid cross)',
  description:
    "Pick each parent's alleles; gametes drop onto the grid edges, the 2×2 fills, and the 1:2:1 genotype + 3:1 phenotype ratios read off as tally bars. Predict-before-reveal; click a cell to highlight matches.",
  schema: z
    .object({
      parent1: z
        .string()
        .regex(/^[A-Za-z]{2}$/)
        .default('Aa'),
      parent2: z
        .string()
        .regex(/^[A-Za-z]{2}$/)
        .default('Aa'),
      alleleLetter: z
        .string()
        .regex(/^[A-Z]$/)
        .default('A'),
      dominantLabel: z.string().trim().min(1).max(40).default('tall'),
      recessiveLabel: z.string().trim().min(1).max(40).default('short'),
      predictFirst: z.literal(true).default(true),
      ...commonLabProps,
    })
    .superRefine((props, context) => {
      const allowed = new Set([props.alleleLetter, props.alleleLetter.toLowerCase()]);
      for (const key of ['parent1', 'parent2'] as const)
        if ([...props[key]].some((symbol) => !allowed.has(symbol)))
          context.addIssue({
            code: 'custom',
            path: [key],
            message: `Use only ${props.alleleLetter} or ${props.alleleLetter.toLowerCase()}`,
          });
      if (props.dominantLabel === props.recessiveLabel)
        context.addIssue({
          code: 'custom',
          path: ['recessiveLabel'],
          message: 'Dominant and recessive phenotypes need distinct labels',
        });
    }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['biology', 'genetics', 'punnett-square'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict an offspring phenotype ratio before revealing a Punnett square',
      'Connect parental alleles to gametes and offspring genotypes',
      'Explain how dominance turns a 1:2:1 genotype ratio into a 3:1 phenotype ratio',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
