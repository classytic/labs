import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'rnmos-not',
  domain: 'circuits',
  group: 'Circuits',
  tag: 'RNmosNot',
  title: 'NOT from one transistor (+ pull-up)',
  description:
    'One NMOS and a pull-up resistor already invert: HIGH pulls the output to ground, LOW lets the resistor pull it up. Engine-solved. It also shows the static-power "catch" that motivated CMOS.',
  schema: z
    .object({
      vdd: z.number().positive().max(24).finite().default(5),
      vth: z.number().positive().max(10).finite().default(2),
      rpull: z.number().positive().max(1_000_000).finite().default(2000),
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
    outcomes: ['electronics', 'logic-gates', 'nmos'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'schematic',
    prerequisites: ['mosfet-inside'],
    related: ['cmos-inverter', 'brownout'],
  },
  experience: {
    objectives: [
      'Predict the resistor-load inverter output',
      'Trace its steady supply-to-ground current path',
      'Explain why complementary CMOS reduces static power',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
