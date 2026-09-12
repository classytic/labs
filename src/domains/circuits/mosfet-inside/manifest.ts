import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'mosfet-inside',
  domain: 'circuits',
  group: 'Circuits',
  title: 'Inside the transistor (NMOS channel)',
  description:
    'Cross-section of an NMOS: raise the gate and watch a depletion region, then an electron channel, form between source and drain. Carriers move; engine-solved.',
  schema: z.object({
    pmos: z.boolean().default(false),
    vth: z.number().positive().max(5).finite().default(1.5),
    k: z.number().positive().max(1).finite().default(0.02),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['electronics', 'mosfet', 'transistor'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'device',
    prerequisites: ['silicon-lattice'],
    related: ['transistor', 'cmos-inverter'],
  },
  experience: {
    objectives: [
      'Distinguish surface depletion from an inversion channel',
      'Relate gate threshold and drain drive to channel current',
      'Transfer the device model between NMOS and PMOS',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
