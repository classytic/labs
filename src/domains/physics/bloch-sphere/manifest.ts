import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'bloch-sphere',
  tag: 'BlochSphereLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'Qubit Bloch sphere',
  description: 'Construct pure qubit states and compare measurement probabilities in three bases.',
  schema: z.object({
    preset: z.enum(['zero', 'one', 'plus', 'minus', 'plusI']).default('plus'),
    measurementAxis: z.enum(['x', 'y', 'z']).default('z'),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['physics', 'quantum', 'qubit', 'bloch-sphere', 'superposition', 'measurement'],
    durationMinutes: 20,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: [],
    related: ['double-slit'],
  },
  experience: {
    objectives: [
      'Map amplitudes to a Bloch vector',
      'Predict measurements in X, Y, and Z bases',
      'Distinguish a superposition from a classical mixture',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
