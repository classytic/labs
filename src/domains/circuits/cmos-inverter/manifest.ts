import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'cmos-inverter',
  domain: 'circuits',
  group: 'Circuits',
  title: 'CMOS inverter (NOT gate)',
  description:
    'A PMOS pull-up and an NMOS pull-down share one input and output: low in → high out, high in → low out. The output voltage is engine-solved, so the transfer curve shows the real sharp transition near VDD/2.',
  schema: z
    .object({
      vdd: z.number().positive().max(24).finite().default(5),
      vth: z.number().positive().max(10).finite().default(2),
      show: z.enum(['both', 'circuit', 'graph']).optional(),
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
    prerequisites: ['logic-gate', 'mosfet-inside'],
    related: ['cmos-nand', 'cmos-nor', 'brownout'],
  },
  experience: {
    objectives: [
      'Predict inverter output from its input level',
      'Connect complementary pull networks to the transfer curve',
      'Locate and explain the switching transition',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
