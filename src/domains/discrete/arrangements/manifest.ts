import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'arrangements',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'Arrangements',
  title: 'Arrange with repeats (multiset)',
  description:
    'Arrangements when some items are identical (MISSISSIPPI): n! ÷ (n₁!·n₂!…), derived from the swap-overcount.',
  schema: z
    .object({
      word: z
        .string()
        .trim()
        .min(1)
        .max(20)
        .refine((word) => /[A-Za-z]/.test(word), 'The word must contain at least one letter')
        .optional(),
      items: z
        .array(
          z.object({
            title: z.string().optional(),
            prompt: z.string().optional(),
            label: z.string().trim().min(1).max(12),
            count: z.number().int().min(1).max(8),
            color: z.string().max(40).optional(),
          }),
        )
        .min(1)
        .max(8)
        .refine(
          (items) => new Set(items.map((item) => item.label)).size === items.length,
          'Item labels must be unique',
        )
        .refine(
          (items) => items.reduce((sum, item) => sum + item.count, 0) <= 20,
          'Keep the arrangement to at most 20 items',
        )
        .optional(),
      ...commonLabProps,
    })
    .refine((props) => !(props.word && props.items), 'Choose a word or explicit item groups, not both'),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['permutations', 'multiset'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict the number of distinct arrangements with repeated items',
      'Explain why identical-copy swaps create overcounting',
      'Transfer the multinomial correction to a changed multiset',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['numeric', 'choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
