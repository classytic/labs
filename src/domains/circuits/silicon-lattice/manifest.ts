import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'silicon-lattice',
  domain: 'circuits',
  group: 'Circuits',
  title: 'What is a semiconductor? (Si lattice + doping)',
  description:
    'Silicon covalent lattice: switch between pure / n-type / p-type doping and raise temperature to free electron-hole pairs. The conceptual intro to diodes, MOSFETs and BJTs.',
  schema: z.object({
    mode: z.enum(['intrinsic', 'n', 'p']).default('intrinsic'),
    temperature: z.number().min(0).max(1).finite().default(0.2),
    lockDoping: z.boolean().default(false),
    showTemperature: z.boolean().default(true),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['electronics', 'semiconductors', 'doping'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'carrier',
    prerequisites: ['conduction'],
    related: ['pn-junction'],
  },
  experience: {
    objectives: [
      'Distinguish intrinsic, n-type and p-type carrier populations',
      'Trace a majority carrier to a donor or acceptor bond',
      'Compare doping with thermally generated electron-hole pairs',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
