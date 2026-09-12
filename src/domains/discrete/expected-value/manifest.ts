import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'expected-value',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'ExpectedValue',
  title: 'Expected value (is the game fair?)',
  description:
    'E[X] = Σ value·prob as a balance point of the payouts; cost marker shows the house edge; spin to watch the average converge.',
  schema: z.object({
    outcomes: z
      .array(
        z.object({
          label: z.string().optional(),
          value: z.number().finite(),
          prob: z.number().finite().nonnegative(),
        }),
      )
      .min(1)
      .refine((outcomes) => outcomes.some((outcome) => outcome.prob > 0), {
        message: 'at least one outcome must have positive probability',
      })
      .optional(),
    cost: z.number().finite().optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['probability', 'expected-value'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict whether a game has positive expected net value',
      'Calculate expected payout as a probability-weighted balance point',
      'Relate simulated long-run average to theoretical expectation',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
