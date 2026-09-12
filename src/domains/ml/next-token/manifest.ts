import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'next-token',
  domain: 'ml',
  group: 'Machine learning',
  title: 'Next-token prediction (how a model continues anything)',
  description:
    'Count what followed what, and you have a model that predicts the next item in a sequence. Extend a viewing history token by token, watch the probability bars change as the context changes, and move the temperature to see invention and repetition come from one number. This is the mechanism behind both language models and the foundation model Netflix moved its recommendations onto, at a size a learner can check by hand.',
  schema: z.object({
    corpus: z
      .array(z.array(z.string().trim().min(1)).min(2).max(24))
      .max(24)
      .optional(),
    start: z.array(z.string().trim().min(1)).min(1).max(6).default(['heist']),
    order: z.number().int().min(1).max(2).default(2),
    temperature: z.number().min(0.1).max(3).default(1),
    title: z.string().optional(),
    prompt: z.string().optional(),
    objectives: z.array(z.string()).optional(),
    height: z.number().int().min(200).max(600).optional(),
  }),
  taxonomy: {
    grades: ['12', 'undergraduate'],
    outcomes: ['machine-learning', 'language-models', 'sequence-prediction'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'table',
    prerequisites: ['embedding-space'],
    related: ['embedding-space', 'monte-carlo', 'classifier-threshold'],
  },
  experience: {
    objectives: [
      'Compute a next-token probability from counts in a small corpus',
      'Explain why a longer context predicts better, and what backoff does when it has not been seen',
      'Explain temperature as a reshaping of the distribution rather than a change in knowledge',
      'Connect autoregressive prediction to both language models and modern recommendation',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
