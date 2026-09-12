import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'bjt-inside',
  domain: 'circuits',
  group: 'Circuits',
  title: 'Inside the BJT (NPN / PNP)',
  description:
    'Cross-section of a bipolar transistor: carriers stream emitter→thin base→collector, and a small base current controls a large collector current (β).',
  schema: z.object({
    pnp: z.boolean().default(false),
    beta: z.number().min(1).max(1000).finite().default(100),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['electronics', 'bjt', 'transistor'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'device',
    prerequisites: ['silicon-lattice'],
    related: ['mosfet-inside', 'transistor'],
  },
  experience: {
    objectives: [
      'Identify the forward-biased junction that injects carriers',
      'Relate thin-base transport to collector and base current',
      'Transfer the carrier model between NPN and PNP',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
