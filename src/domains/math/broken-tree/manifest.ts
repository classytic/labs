import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'broken-tree',
  tag: 'BrokenTreeLab',
  domain: 'math',
  group: 'Trigonometry',
  title: 'The broken tree (Pythagoras in a word problem)',
  description:
    'A tree snaps and the top bends over until its tip touches the ground. Drag the break point and watch the tip slide: break lower and the fallen piece is longer, so it lands further away. The standard "find the original height" question, made a thing you move.',
  schema: z.object({
    originalHeight: z.number().positive().max(100).optional().describe('the full height before it snaps'),
    target: z
      .number()
      .positive()
      .max(100)
      .optional()
      .describe('ground distance to hit; omit for free play with no goal'),
    breakHeight: z.number().positive().max(100).optional().describe('where the trunk starts broken'),
    height: z.number().int().min(200).max(560).optional(),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Recognise the right triangle hidden in a word problem',
      'See that breaking lower makes the fallen piece longer and its reach greater',
      'Solve h² + d² = (H − h)², where the squared terms cancel to leave a linear equation',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['trigonometry', 'pythagoras', 'problem-solving'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
