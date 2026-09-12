import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'quantum-gates',
  tag: 'QuantumGateJourneyLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'Quantum gate journey',
  description: 'Build short quantum programs and watch unitary gates transform one shared qubit state.',
  schema: z.object({
    targetSequence: z
      .array(z.enum(['x', 'z', 'h', 's']))
      .max(12)
      .default(['h', 'z', 'h']),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['physics', 'quantum', 'qubit', 'quantum-gates', 'unitary', 'amplitude'],
    durationMinutes: 20,
    interaction: 'build',
    authorability: 'moderate',
    prerequisites: ['bloch-sphere'],
    related: ['bloch-sphere'],
  },
  experience: {
    objectives: [
      'Interpret gates as reversible state transformations',
      'Connect H to superposition and phase gates to longitude',
      'Predict a short gate sequence',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: {
      keyboard: true,
      textAlternative: true,
      reducedMotion: true,
    },
  },
  loadRuntime: () => import('./runtime.js'),
});
