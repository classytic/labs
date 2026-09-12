import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'pascal',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'PascalTriangle',
  title: "Pascal's triangle",
  description:
    'Each cell = the two above added = C(n,k); a row = (a+b)ⁿ; odd/even cells reveal the Sierpiński fractal.',
  schema: z.object({
    rows: z.number().int().min(3).max(14).optional(),
    view: z.enum(['build', 'binomial', 'parity']).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['combinations', 'binomial-theorem'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Inspect Pascal’s recurrence through parent cells',
      'Connect a cell to combinations and binomial coefficients',
      'Recognize parity structure and transfer a counting value',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
