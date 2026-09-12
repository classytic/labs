import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'combination-studio',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'CombinationStudio',
  title: 'Combination studio (rule of product, felt)',
  description:
    'The multiplication principle made tactile: pick from each rack, assemble each outcome (a dressed character or an emoji card), fill a rows × columns wall, then add a variable and watch the total multiply. Predict-first. Any authored scenario (outfits, sundaes, plates, routes).',
  schema: z
    .object({
      scenario: z.string().trim().min(1).max(50).optional(),
      categories: z
        .array(
          z.object({
            id: z.string().trim().min(1).max(30),
            label: z.string().trim().min(1).max(40),
            slot: z.enum(['top', 'bottom', 'hat', 'hold', 'none']).optional(),
            options: z
              .array(
                z.object({
                  id: z.string().trim().min(1).max(30),
                  label: z.string().trim().min(1).max(40),
                  emoji: z.string().max(12).optional(),
                  color: z.string().max(40).optional(),
                }),
              )
              .min(1)
              .max(8)
              .refine(
                (options) => new Set(options.map((option) => option.id)).size === options.length,
                'Option ids must be unique within a category',
              ),
          }),
        )
        .min(1)
        .max(5)
        .refine(
          (categories) => new Set(categories.map((category) => category.id)).size === categories.length,
          'Category ids must be unique',
        )
        .optional(),
      figure: z.enum(['character', 'card']).optional(),
      startActive: z.number().int().min(1).max(5).optional(),
      maxWall: z.number().int().min(4).max(120).optional(),
      ...commonLabProps,
    })
    .refine(
      (props) =>
        !props.categories ||
        (props.startActive ?? Math.min(2, props.categories.length)) <= props.categories.length,
      'Starting categories cannot exceed the authored categories',
    ),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['counting', 'multiplication-principle'],
    durationMinutes: 15,
    interaction: 'predict',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Predict the number of combinations before listing them',
      'Construct every outcome as one choice from each category',
      'Transfer the rule of product when another independent variable is added',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
