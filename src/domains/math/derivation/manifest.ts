import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { answerSchema, derivationStepSchema } from '../schemas.js';

/** Steps are a string|{tex,note} union the auto-form can't build, so it ships a step editor. */
export default defineLab({
  id: 'derivation',
  domain: 'math',
  group: 'Math',
  title: 'Derivation (steps)',
  description: 'A step-by-step equation derivation in LaTeX, revealed one line at a time.',
  schema: z.object({
    steps: z.array(derivationStepSchema).optional(),
    title: z.string().optional(),
    showAll: z.boolean().optional().describe('reveal every line at once, for print or review'),
    answer: answerSchema.optional().describe('withhold the LAST line and make the learner produce it'),
    unit: z.string().trim().max(20).optional(),
  }),
  experience: {
    objectives: [
      'Predict the next valid transformation in an authored derivation',
      'Follow how each line preserves or advances the mathematical argument',
      'Explain and reuse a derivation strategy in a related problem',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11', '12'],
    outcomes: ['math', 'proof', 'derivation'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
