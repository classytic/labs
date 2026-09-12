import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'membrane-transport',
  tag: 'MembraneTransportLab',
  domain: 'biology',
  group: 'Cell biology',
  title: 'Cell membrane transport',
  description:
    'Compare diffusion, facilitated diffusion, osmosis, and active transport across one membrane model.',
  schema: z.object({
    mode: z.enum(['diffusion', 'facilitated', 'osmosis', 'active']).default('diffusion'),
    outside: z.number().min(0).max(10).default(8),
    inside: z.number().min(0).max(10).default(2),
    permeability: z.number().min(0).max(1).default(0.8),
    atp: z.boolean().default(true),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['9', '10', '11', '12'],
    outcomes: ['biology', 'cell', 'membrane', 'diffusion', 'osmosis', 'active-transport'],
    durationMinutes: 18,
    interaction: 'guided',
    authorability: 'moderate',
    prerequisites: [],
    related: ['mitosis-explorer'],
  },
  experience: {
    objectives: [
      'Use concentration gradients to predict net movement',
      'Distinguish channels from pumps',
      'Explain osmosis as net water movement',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
