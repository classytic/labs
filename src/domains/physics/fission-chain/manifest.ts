import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'fission-chain',
  tag: 'FissionChainLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'Fission chain reaction',
  description: 'Balance a conceptual neutron-generation model with an absorbing control rod.',
  schema: z.object({
    baseK: z.number().positive().max(2).default(1.35),
    controlInsertion: z.number().min(0).max(1).default(0.36),
    generations: z.number().int().min(3).max(10).default(7),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['physics', 'nuclear', 'fission', 'chain-reaction', 'criticality', 'energy'],
    durationMinutes: 18,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: ['nuclear-binding-energy'],
    related: ['nuclear-binding-energy'],
  },
  experience: {
    objectives: [
      'Interpret effective multiplication k',
      'Explain neutron absorption by control rods',
      'Connect fission count to released binding energy',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
