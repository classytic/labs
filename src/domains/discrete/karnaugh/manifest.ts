import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'karnaugh',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'KarnaughMap',
  title: 'Karnaugh map',
  description:
    'Boolean minimisation by circling: Gray-coded map of a formula/minterms; show the minimal SOP cover or let learners draw their own groups (wrap-aware).',
  schema: z
    .object({
      formula: z.string().trim().min(1).max(160).optional(),
      minterms: z
        .array(z.number().int().min(0).max(15))
        .max(16)
        .refine((values) => new Set(values).size === values.length, 'Minterms must be unique')
        .optional(),
      dontCares: z
        .array(z.number().int().min(0).max(15))
        .max(16)
        .refine((values) => new Set(values).size === values.length, 'Don’t-cares must be unique')
        .optional(),
      vars: z
        .array(
          z
            .string()
            .trim()
            .regex(/^[A-Za-z][A-Za-z0-9_]*$/),
        )
        .min(2)
        .max(4)
        .refine((values) => new Set(values).size === values.length, 'Variable names must be unique')
        .optional(),
      mode: z.enum(['show', 'simplify']).default('simplify'),
      ...commonLabProps,
    })
    .superRefine((props, context) => {
      if (props.formula && (props.minterms || props.vars))
        context.addIssue({
          code: 'custom',
          path: ['formula'],
          message: 'Choose a formula or explicit minterms and variables, not both',
        });
      const size = 2 ** (props.vars?.length ?? 2);
      for (const [key, values] of [
        ['minterms', props.minterms],
        ['dontCares', props.dontCares],
      ] as const)
        if (values?.some((value) => value >= size))
          context.addIssue({
            code: 'custom',
            path: [key],
            message: `Values must be below ${size} for the authored variables`,
          });
      if (props.minterms?.some((value) => props.dontCares?.includes(value)))
        context.addIssue({
          code: 'custom',
          path: ['dontCares'],
          message: 'A cell cannot be both a minterm and a don’t-care',
        });
    }),
  taxonomy: {
    grades: ['12'],
    outcomes: ['logic', 'boolean-minimisation'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Construct legal power-of-two Karnaugh groups',
      'Cover every asserted minterm with a compact implicant set',
      'Explain how grouping eliminates changing variables',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
