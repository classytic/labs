import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'counting-tree',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'CountingTree',
  title: 'Counting / probability tree',
  description:
    'Sequential counting + probability trees: multiplication principle, permutations (shrinking pool), with-replacement, ÷k! collapse, or weighted probability paths. Best for small cases.',
  schema: z
    .object({
      stages: z
        .array(
          z.object({
            title: z.string().optional(),
            prompt: z.string().optional(),
            label: z.string().trim().min(1).max(60).optional(),
            branches: z
              .array(
                z.object({
                  label: z.string().trim().min(1).max(30),
                  weight: z.number().finite().positive().optional(),
                }),
              )
              .min(2)
              .max(8),
          }),
        )
        .min(1)
        .max(5)
        .optional(),
      pool: z
        .array(z.string().trim().min(1).max(30))
        .min(2)
        .max(8)
        .refine((items) => new Set(items).size === items.length, 'Pool labels must be unique')
        .optional(),
      draws: z.number().int().min(1).max(5).optional(),
      replacement: z.boolean().optional(),
      mode: z.enum(['count', 'probability']).optional(),
      ask: z.enum(['ordered', 'unordered']).optional(),
      height: z.number().int().min(220).max(640).optional(),
      ...commonLabProps,
    })
    .refine((props) => !(props.stages && props.pool), 'Choose authored stages or a draw pool, not both')
    .refine(
      (props) => props.replacement || !props.pool || (props.draws ?? 2) <= props.pool.length,
      'Draws cannot exceed the pool without replacement',
    )
    .refine((props) => props.ask !== 'unordered' || !!props.pool, 'Unordered counting requires a draw pool'),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['counting', 'probability'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Predict a sequential count before enumerating paths',
      'Trace a complete path and connect it to the multiplication principle',
      'Transfer multiplication or probability-path reasoning to a changed tree',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'numeric'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
