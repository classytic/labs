import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'monte-carlo',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'MonteCarlo',
  title: 'Monte Carlo (law of large numbers)',
  description:
    'Estimate a probability by sampling: π-darts (scatter) or a convergence run-chart (Monty Hall, dice-sum, Bernoulli) homing onto the true value.',
  schema: z.object({
    experiment: z
      .discriminatedUnion('kind', [
        z.object({ kind: z.literal('piDarts') }),
        z.object({ kind: z.literal('montyHall'), doors: z.number().int().min(3).max(20).optional() }),
        z
          .object({
            kind: z.literal('diceSum'),
            dice: z.number().int().min(1).max(6).optional(),
            target: z.number().int().min(1),
          })
          .superRefine((value, ctx) => {
            const dice = value.dice ?? 2;
            if (value.target < dice || value.target > 6 * dice)
              ctx.addIssue({
                code: 'custom',
                path: ['target'],
                message: `target must be between ${dice} and ${6 * dice}`,
              });
          }),
        z.object({
          kind: z.literal('bernoulli'),
          p: z.number().min(0).max(1),
          label: z.string().min(1).max(60).optional(),
        }),
      ])
      .default({ kind: 'piDarts' }),
    viz: z.enum(['runchart', 'scatter']).optional(),
    seed: z.number().int().min(0).max(4294967295).optional(),
    batch: z.number().int().min(1).max(2000).optional(),
    maxTrials: z.number().int().min(300).max(200000).optional(),
    height: z.number().int().min(220).max(640).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['probability', 'simulation'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Predict how sample size changes typical estimation error',
      'Compare an empirical estimate with a theoretical target',
      'Transfer Monte Carlo reasoning across geometric and event-based experiments',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
