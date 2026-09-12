import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'counting-slots',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'CountingSlots',
  title: 'Counting by filling slots',
  description:
    'The multiplication principle as filling positions: pool shrinks, product builds (nPr, n!, nᵏ); "choose" mode collapses orderings ÷k! → nCr. Derives the formula.',
  schema: z
    .object({
      items: z
        .array(z.string().trim().min(1).max(20))
        .min(2)
        .max(10)
        .refine((items) => new Set(items).size === items.length, 'Item labels must be unique')
        .optional(),
      slots: z.number().int().min(1).max(6).optional(),
      positions: z.array(z.string().trim().min(1).max(20)).min(1).max(6).optional(),
      mode: z.enum(['arrange', 'choose']).optional(),
      replacement: z.boolean().optional(),
      ...commonLabProps,
    })
    .superRefine((props, context) => {
      const itemCount = props.items?.length ?? 4;
      const slotCount = props.slots ?? 3;
      if (!props.replacement && slotCount > itemCount)
        context.addIssue({
          code: 'custom',
          path: ['slots'],
          message: 'Slots cannot exceed items without replacement',
        });
      if (props.mode === 'choose' && props.replacement)
        context.addIssue({
          code: 'custom',
          path: ['replacement'],
          message: 'Choose mode currently models selection without replacement',
        });
      if (props.positions && props.positions.length < slotCount)
        context.addIssue({
          code: 'custom',
          path: ['positions'],
          message: 'Provide a label for every authored slot',
        });
    }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['counting', 'permutations', 'combinations'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict a permutation or combination count',
      'Build the multiplication principle one slot at a time',
      'Explain the k! overcount correction',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['numeric', 'choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
