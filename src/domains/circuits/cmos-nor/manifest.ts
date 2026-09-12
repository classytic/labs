import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'cmos-nor',
  domain: 'circuits',
  group: 'Circuits',
  title: 'CMOS NOR (the De Morgan twin)',
  description:
    'The NAND with each network swapped: series PMOS pull-up, parallel NMOS pull-down, giving Y = (A+B)′. NOR is the other universal gate, so series-vs-parallel is AND-logic-vs-OR-logic in silicon.',
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
    related: ['cmos-nand', 'logic-builder'],
  },
  experience: {
    objectives: [
      'Identify the only HIGH row of a NOR gate',
      'Relate series PMOS and parallel NMOS networks to the truth table',
      'Transfer De Morgan reasoning across changed inputs',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
