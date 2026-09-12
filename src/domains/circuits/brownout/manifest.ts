import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'brownout',
  domain: 'circuits',
  group: 'Circuits',
  title: 'Brown-out (supply too low → logic invalid)',
  description:
    'Drag the battery EMF down and the CMOS gate stops working: as VDD falls toward the transistor threshold the output loses its swing and drifts to mid-rail. Connects EMF and supply voltage to whether logic works at all.',
  schema: z
    .object({
      vth: z.number().positive().max(5).finite().default(2),
      vmax: z.number().positive().max(24).finite().default(6),
      title: z.string().trim().min(1).optional(),
      prompt: z.string().trim().min(1).optional(),
      activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
    })
    .refine(({ vth, vmax }) => vmax >= 1.5 * vth, {
      message: 'vmax must include a healthy rail above the threshold',
      path: ['vmax'],
    }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['electronics', 'cmos', 'power-supply'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'schematic',
    prerequisites: ['cmos-inverter'],
  },
  experience: {
    objectives: [
      'Predict how insufficient supply voltage affects a logic output',
      'Connect output swing and rail voltage to noise margin',
      'Recover a valid operating point after a brownout',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
