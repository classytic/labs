import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'sample-space',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'SampleSpaceBoard',
  title: 'Sample space (equally-likely)',
  description:
    'Dice/coins/cards as a grid of equally-likely outcomes: select an event → favourable ÷ total = P, as a reduced fraction. Real dice glyphs.',
  schema: z
    .object({
      dims: z
        .union([
          z.tuple([z.number().int().min(1).max(12)]),
          z.tuple([z.number().int().min(1).max(12), z.number().int().min(1).max(12)]),
        ])
        .optional(),
      faces: z.array(z.array(z.number().finite()).min(1).max(12)).min(1).max(2).optional(),
      outcomes: z
        .array(z.string().trim().min(1).max(40))
        .min(1)
        .max(64)
        .refine((items) => new Set(items).size === items.length, 'Outcome labels must be unique')
        .optional(),
      event: z
        .object({
          reduce: z.enum(['sum', 'diff', 'max', 'min', 'product', 'same']).optional(),
          cmp: z.enum(['eq', 'lt', 'gt', 'le', 'ge']).optional(),
          value: z.number().finite().optional(),
          favorable: z.array(z.string().trim().min(1).max(40)).max(64).optional(),
          label: z.string().trim().min(1).max(80).optional(),
        })
        .refine(
          (event) => !event.reduce || event.reduce === 'same' || (event.cmp != null && event.value != null),
          'A reduced event needs a comparison and value',
        )
        .optional(),
      dice: z.boolean().optional(),
      showValue: z.boolean().optional(),
      mode: z.enum(['explore', 'target']).optional(),
      ...commonLabProps,
    })
    .refine((props) => !(props.dims && props.outcomes), 'Choose dimensions or explicit outcomes, not both')
    .refine((props) => !props.faces || !!props.dims, 'Custom faces require dimensions')
    .refine(
      (props) => !props.faces || props.faces.every((face, index) => face.length === props.dims?.[index]),
      'Each face list must match its dimension',
    ),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['probability', 'sample-space'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Represent an equally likely sample space without omissions',
      'Calculate probability as favourable outcomes over total outcomes',
      'Transfer the part-to-whole rule to a newly defined event',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
