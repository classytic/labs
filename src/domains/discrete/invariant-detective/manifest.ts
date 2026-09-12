import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
export default defineLab({
  id: 'invariant-detective',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'InvariantDetective',
  title: 'Invariant detective',
  description:
    'Try legal moves, identify a conserved residue, and prove a target impossible without exhausting every move sequence.',
  schema: z.object({
    start: z.number().int().min(0).max(20).optional(),
    target: z.number().int().min(0).max(24).optional(),
    modulus: z.number().int().min(2).max(8).optional(),
    moves: z
      .array(
        z.object({
          id: z.string().min(1).max(24),
          label: z.string().min(1).max(40),
          delta: z.number().int().min(-12).max(12),
        }),
      )
      .min(1)
      .max(6)
      .optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['8', '9', '10', '11', '12'],
    outcomes: ['invariants', 'proof-of-impossibility'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Detect a quantity preserved by every legal move',
      'Use an invariant to rule out a target',
      'Recognize when an invariant is inconclusive',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
