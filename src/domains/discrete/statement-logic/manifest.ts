import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

const base = {
  id: z.string().min(1),
  statement: z.string().min(1),
  explanation: z.string().min(1),
};

const choice = z.object({ value: z.string().min(1), label: z.string().min(1) });
const round = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('classify'), answer: z.enum(['proposition', 'open-sentence', 'non-statement']) }),
  z.object({ ...base, kind: z.literal('truth'), context: z.string().optional(), answer: z.boolean() }),
  z.object({ ...base, kind: z.literal('negate'), choices: z.array(choice).min(2).max(4), answer: z.string().min(1) }),
  z.object({
    ...base,
    kind: z.literal('implication'),
    conclusion: z.string().min(1),
    worlds: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      premiseTrue: z.boolean(),
      conclusionTrue: z.boolean(),
      evidence: z.string().optional(),
    })).min(2).max(4),
    answer: z.string().min(1),
  }),
]);

export default defineLab({
  id: 'statement-logic',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'StatementLogic',
  title: 'Statement logic puzzles',
  description: 'A localizable puzzle deck for classifying claims, testing truth, negating statements, and finding implication counterexamples.',
  schema: z.object({ rounds: z.array(round).min(1).optional(), startAt: z.number().int().min(0).optional(), ...commonLabProps }),
  taxonomy: {
    grades: ['4', '5', '6', '7', '8'],
    outcomes: ['logical-statements', 'counterexamples', 'reasoning'],
    durationMinutes: 10,
    interaction: 'guided',
    authorability: 'advanced',
    representation: 'boolean',
    related: ['truth-table', 'proof-builder'],
  },
  experience: {
    objectives: ['Distinguish statements from open sentences', 'Use evidence to test truth', 'Find counterexamples to implications'],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
