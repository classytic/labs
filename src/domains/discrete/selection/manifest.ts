import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'selection',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'Selection',
  title: 'Draw from the bag (cards & colored balls)',
  description:
    'Selecting from groups: ways = ∏ C(group,want), P = ways ÷ C(N,k). Colored-ball urns and card hands from one model.',
  schema: z
    .object({
      groups: z
        .array(
          z.object({
            title: z.string().optional(),
            prompt: z.string().optional(),
            label: z.string().trim().min(1).max(30),
            count: z.number().int().min(1).max(40),
            color: z.string().max(40).optional(),
          }),
        )
        .min(2)
        .max(8)
        .refine(
          (groups) => new Set(groups.map((group) => group.label)).size === groups.length,
          'Group labels must be unique',
        )
        .refine(
          (groups) => groups.reduce((sum, group) => sum + group.count, 0) <= 50,
          'Keep the population to at most 50 objects',
        )
        .optional(),
      draw: z.number().int().min(1).max(50).optional(),
      want: z.array(z.number().int().min(0).max(40)).min(2).max(8).optional(),
      mode: z.enum(['count', 'probability']).optional(),
      ...commonLabProps,
    })
    .refine(
      (props) =>
        !props.groups || (props.draw ?? 3) <= props.groups.reduce((sum, group) => sum + group.count, 0),
      'Draw size cannot exceed the population',
    )
    .refine((props) => !props.want || !!props.groups, 'Authored target counts require authored groups')
    .refine(
      (props) => !props.want || !props.groups || props.want.length === props.groups.length,
      'Target counts must match the group list',
    )
    .refine(
      (props) =>
        !props.want ||
        !props.groups ||
        props.want.every((count, index) => count <= props.groups![index]!.count),
      'A target count cannot exceed its group',
    )
    .refine(
      (props) => !props.want || props.want.reduce((sum, count) => sum + count, 0) === (props.draw ?? 3),
      'Target counts must add to the draw size',
    ),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['combinations', 'probability'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict favourable unordered selections from grouped objects',
      'Connect per-group combinations to the multiplication principle',
      'Convert favourable selections into probability using the full sample space',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['numeric', 'choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
