import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'cmos-nand',
  domain: 'circuits',
  group: 'Circuits',
  title: 'CMOS NAND (the universal gate)',
  description:
    'Four transistors: a parallel PMOS pull-up and a series NMOS pull-down make Y = (A·B)′, solved for all four inputs. NAND alone is universal, so this is the brick every gate and CPU is built from.',
  schema: z
    .object({
      vdd: z.number().positive().max(24).finite().default(5),
      vth: z.number().positive().max(10).finite().default(2),
      title: z.string().trim().min(1).optional(),
      prompt: z.string().trim().min(1).optional(),
      activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
    })
    .refine(({ vdd, vth }) => vth < vdd, {
      message: 'threshold must be below the supply rail',
      path: ['vth'],
    }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['electronics', 'cmos', 'logic-gates'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'schematic',
    prerequisites: ['cmos-inverter'],
    related: ['cmos-nor', 'logic-builder'],
  },
  experience: {
    objectives: [
      'Predict the NAND output for an authored input pair',
      'Relate parallel PMOS and series NMOS networks to the truth table',
      'Transfer current-path reasoning across all four rows',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
