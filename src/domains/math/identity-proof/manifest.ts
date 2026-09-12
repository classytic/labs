import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

const move = z.object({
  id: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(120),
});

export default defineLab({
  id: 'identity-proof',
  tag: 'IdentityProof',
  domain: 'math',
  group: 'Trigonometry',
  title: 'Prove an identity (choose the move)',
  description:
    'The learner picks the next move from a menu instead of watching it. The menu holds moves that are legal algebra and go nowhere, each answered with the reason it goes nowhere, because in a proof the difficulty is choosing the step rather than executing it.',
  schema: z.object({
    proof: z
      .object({
        claim: z.string().trim().min(1).max(240).describe('the identity to prove, as LaTeX'),
        start: z.enum(['lhs', 'rhs']).describe('which side the working starts from'),
        target: z.string().trim().min(1).max(240).describe('the expression the chain must reach'),
        steps: z
          .array(
            z.object({
              from: z.string().trim().min(1).max(240),
              move: z.string().trim().min(1).max(40),
              to: z.string().trim().min(1).max(240),
              why: z.string().trim().min(1).max(400),
              detours: z
                .array(
                  z.object({
                    move: z.string().trim().min(1).max(40),
                    why: z.string().trim().min(1).max(400),
                  }),
                )
                .max(4)
                .optional()
                .describe('legal moves that lead nowhere; give every step at least one'),
            }),
          )
          .min(1)
          .max(10),
      })
      .optional()
      .describe('each step must start where the previous one ended, and the last must reach target'),
    moves: z
      .array(move)
      .min(2)
      .max(20)
      .optional()
      .describe('the menu vocabulary; phrase each as the ACTION it performs, not the identity name'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Choose which identity to apply, and say why that one',
      'Recognise moves that are legal but lead nowhere, such as squaring both sides',
      'Work one side only, starting from the messier side',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['trigonometry', 'identities', 'proof'],
    durationMinutes: 12,
    interaction: 'guided',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
