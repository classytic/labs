import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

const symbol = z.string().trim().min(1).max(6);
const safeColor = z.string().regex(/^(#[0-9a-fA-F]{3,8}|var\(--[a-z0-9-]+\))$/);
const model = z.object({
  trait: z.string().trim().min(1).max(50).optional(),
  alleles: z
    .array(
      z.object({
        symbol,
        rank: z.number().finite().min(-100).max(100),
        trait: z.string().trim().min(1).max(50),
      }),
    )
    .min(2)
    .max(6),
  blends: z
    .array(
      z.object({
        pair: z.tuple([symbol, symbol]),
        label: z.string().trim().min(1).max(50),
        color: safeColor.optional(),
      }),
    )
    .max(12)
    .optional(),
  colors: z.record(z.string().trim().min(1).max(50), safeColor).optional(),
});

export default defineLab({
  id: 'genetic-cross',
  domain: 'biology',
  group: 'Biology',
  title: 'Genetic cross (dominance / codominance / blood groups)',
  description:
    'The general cross tool: pick a pattern, simple dominance, ABO blood groups (multiple alleles + codominance → AB), or incomplete dominance (red × white → pink), or author your own allele model. Gametes drop onto the 2×2 grid; genotype + phenotype ratios read off as tally bars. Predict-before-reveal.',
  schema: z
    .object({
      preset: z.enum(['monohybrid', 'blood-type', 'incomplete', 'dihybrid', 'custom']).default('blood-type'),
      spec: model.optional(),
      parent1: z.array(symbol).length(2).optional(),
      parent2: z.array(symbol).length(2).optional(),
      predictFirst: z.literal(true).default(true),
      ...commonLabProps,
    })
    .superRefine((props, context) => {
      if (props.preset === 'custom' && !props.spec)
        context.addIssue({
          code: 'custom',
          path: ['spec'],
          message: 'Custom crosses require an allele model',
        });
      if (props.preset === 'dihybrid' && (props.parent1 || props.parent2))
        context.addIssue({
          code: 'custom',
          path: ['parent1'],
          message: 'Dihybrid parent overrides are not supported by this authoring shape',
        });
      const builtInSymbols: Partial<Record<typeof props.preset, string[]>> = {
        monohybrid: ['A', 'a'],
        'blood-type': ['A', 'B', 'O'],
        incomplete: ['R', 'W'],
      };
      const allowed = builtInSymbols[props.preset];
      if (allowed) {
        for (const key of ['parent1', 'parent2'] as const)
          props[key]?.forEach((value, index) => {
            if (!allowed.includes(value))
              context.addIssue({
                code: 'custom',
                path: [key, index],
                message: `Parent alleles for ${props.preset} must be one of ${allowed.join(', ')}`,
              });
          });
      }
      if (props.spec) {
        const symbols = props.spec.alleles.map((allele) => allele.symbol);
        if (new Set(symbols).size !== symbols.length)
          context.addIssue({
            code: 'custom',
            path: ['spec', 'alleles'],
            message: 'Allele symbols must be unique',
          });
        props.spec.blends?.forEach((blend, index) =>
          blend.pair.forEach((value, pairIndex) => {
            if (!symbols.includes(value))
              context.addIssue({
                code: 'custom',
                path: ['spec', 'blends', index, 'pair', pairIndex],
                message: 'Blend pairs must reference declared alleles',
              });
          }),
        );
        for (const key of ['parent1', 'parent2'] as const)
          props[key]?.forEach((value, index) => {
            if (!symbols.includes(value))
              context.addIssue({
                code: 'custom',
                path: [key, index],
                message: 'Parent alleles must exist in the custom model',
              });
          });
      }
    }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['biology', 'genetics', 'codominance'],
    durationMinutes: 15,
    interaction: 'predict',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Predict phenotype ratios before revealing a genetic cross',
      'Compare dominance, codominance, incomplete dominance, and independent assortment',
      'Explain offspring ratios by tracing equally likely gamete combinations',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
