import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'slide-rule',
  tag: 'SlideRule',
  domain: 'math',
  group: 'Logarithms',
  title: 'The slide rule: multiplication as addition',
  description:
    'Every number sits at a distance equal to its logarithm, so sliding one scale along another lays two lengths end to end and multiplies the values they mark. Predict where the answer will land, then slide and see why log(ab) = log a + log b is a statement about distance.',
  schema: z.object({
    a: z.number().finite().min(1).max(10).optional().describe('value the upper 1 is set over'),
    b: z.number().finite().min(1).max(10).optional().describe('value read on the upper scale'),
    aligned: z.boolean().optional().describe('start already lined up'),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['logarithms', 'laws-of-logarithms', 'number-sense'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
