import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'sex-linked-cross',
  domain: 'biology',
  group: 'Biology',
  title: 'Sex-linked cross (X-linked traits)',
  description:
    'An X-linked gene cross (colour blindness, haemophilia): the Y carries no allele, so males are hemizygous and a single recessive X shows. A carrier mother passes the trait to half her sons. Reuses the Punnett grid + predict-before-reveal.',
  schema: z
    .object({
      allele: z
        .string()
        .regex(/^[A-Z]$/)
        .default('B'),
      dominant: z.string().trim().min(1).max(50).default('normal'),
      recessive: z.string().trim().min(1).max(50).default('colour-blind'),
      mother: z.tuple([z.string().regex(/^[A-Za-z]$/), z.string().regex(/^[A-Za-z]$/)]).optional(),
      father: z
        .string()
        .regex(/^[A-Za-z]$/)
        .optional(),
      predictFirst: z.literal(true).default(true),
      ...commonLabProps,
    })
    .superRefine((props, context) => {
      const allowed = new Set([props.allele, props.allele.toLowerCase()]);
      props.mother?.forEach((symbol, index) => {
        if (!allowed.has(symbol))
          context.addIssue({
            code: 'custom',
            path: ['mother', index],
            message: `Use only ${props.allele} or ${props.allele.toLowerCase()}`,
          });
      });
      if (props.father && !allowed.has(props.father))
        context.addIssue({
          code: 'custom',
          path: ['father'],
          message: `Use only ${props.allele} or ${props.allele.toLowerCase()}`,
        });
      if (props.dominant === props.recessive)
        context.addIssue({ code: 'custom', path: ['recessive'], message: 'Phenotype labels must differ' });
    }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['biology', 'genetics', 'sex-linkage'],
    durationMinutes: 15,
    interaction: 'predict',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict offspring phenotype and sex ratios for an X-linked trait',
      'Explain why a recessive allele is expressed in hemizygous sons',
      'Trace how carrier mothers transmit an X-linked allele',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
