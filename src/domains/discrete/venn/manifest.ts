import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'venn',
  tag: 'VennSetBoard',
  domain: 'discrete',
  group: 'Discrete',
  title: 'Venn diagram & inclusion–exclusion',
  description:
    '2–3 sets from real members: region counts + the inclusion–exclusion breakdown, or shade-to-match a set expression (graded on the logic kernel).',
  schema: z.object({
    sets: z
      .array(
        z.object({
          name: z
            .string()
            .trim()
            .regex(/^[A-Za-z][A-Za-z0-9_]*$/)
            .max(20),
          members: z
            .array(z.union([z.number().finite(), z.string().trim().min(1).max(30)]))
            .max(40)
            .refine(
              (members) => new Set(members.map(String)).size === members.length,
              'Members must be unique within a set',
            ),
        }),
      )
      .min(2)
      .max(3)
      .refine((sets) => new Set(sets.map((set) => set.name)).size === sets.length, 'Set names must be unique')
      .default([
        { name: 'A', members: [1, 2, 3, 4] },
        { name: 'B', members: [3, 4, 5, 6] },
      ])
      .describe('The sets and their members'),
    mode: z
      .enum(['explore', 'shade'])
      .default('shade')
      .describe('explore = region counts; shade = match a set expression'),
    target: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .default('A ∩ B')
      .describe('Shade mode: the set expression to match, e.g. A ∪ B'),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['sets', 'inclusion-exclusion'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Translate a set expression into Venn regions',
      'Check a region selection against the shared logic engine',
      'Explain the inclusion–exclusion overlap correction',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
