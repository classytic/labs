import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'proof-builder',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'ProofBuilder',
  title: 'Proof strategy studio',
  description:
    'Construct a justified finite argument using direct proof, contrapositive, or contradiction and receive feedback at the exact invalid inference.',
  schema: z.object({
    strategy: z.enum(['direct', 'contrapositive', 'contradiction']).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['proof-strategies', 'logical-argument'],
    durationMinutes: 12,
    interaction: 'build',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Choose a proof strategy that matches the claim',
      'Build an argument from justified transitions',
      'Explain why an invalid inference does not follow',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'ordering'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
