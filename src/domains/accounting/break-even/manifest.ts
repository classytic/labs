import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'break-even',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Break-even chart',
  description:
    'The classic break-even chart: revenue rises from zero, total cost from the fixed cost, and where they cross is break-even, loss before (red), profit after (green). Drag price / cost / fixed cost to move the point, and the output marker to read profit and margin of safety. Author fixed cost, price, variable cost, currency, unit label; predict-first. Curriculum-neutral.',
  schema: z.object({
    fixedCost: z.number().min(500).max(8000).optional(),
    price: z.number().min(1).max(50).optional().describe('selling price per unit'),
    variableCost: z.number().min(0).max(40).optional().describe('variable cost per unit'),
    currency: z.string().optional(),
    unitLabel: z.string().optional().describe('what a unit is, e.g. meals'),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['finance', 'break-even'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict profit or loss below break-even',
      'Connect contribution per unit to the chart crossing',
      'Stress-test viability under changed price and cost assumptions',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
