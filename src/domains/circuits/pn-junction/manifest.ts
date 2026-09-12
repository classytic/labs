import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'pn-junction',
  domain: 'circuits',
  group: 'Circuits',
  title: 'Inside the diode (PN junction)',
  description:
    'Cross-section of a PN junction: n and p regions, the depletion region of fixed ions, and carriers flooding across under forward bias. Engine-solved diode current.',
  schema: z.object({
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    bias: z.number().min(-3).max(0.9).optional(),
    showCarriers: z.boolean().optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['electronics', 'diode', 'pn-junction'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'device',
    prerequisites: ['silicon-lattice'],
    related: ['diode'],
  },
  experience: {
    objectives: [
      'Predict how bias changes depletion width',
      'Connect carrier crossing and recombination to forward current',
      'Transfer junction reasoning from forward to reverse bias',
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
