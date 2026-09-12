import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'carnot',
  domain: 'physics',
  group: 'Physics',
  title: 'Carnot cycle, P–V loop + T–S rectangle',
  description:
    'The most efficient heat engine, shown as a P–V loop (enclosed area = net work) and the same cycle as a T–S rectangle (heat in at Th, out at Tc). Efficiency η = 1 − Tc/Th, with the entropy bookkeeping ΔS = Qh/Th = Qc/Tc → net 0.',
  schema: z
    .object({
      hotK: z.number().finite().min(360).max(800).optional(),
      coldK: z.number().finite().min(250).max(600).optional(),
      gas: z.enum(['monatomic', 'diatomic']).optional(),
      expansionRatio: z.number().finite().min(1.3).max(3).optional(),
      ...commonLabProps,
      activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
    })
    .refine((value) => value.hotK == null || value.coldK == null || value.coldK < value.hotK, {
      message: 'coldK must be below hotK',
      path: ['coldK'],
    }),
  taxonomy: {
    grades: ['12'],
    outcomes: ['thermodynamics', 'carnot', 'entropy'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Interpret the Carnot cycle on P–V and T–S diagrams',
      'Relate enclosed area to net work',
      'Determine the maximum efficiency from reservoir temperatures',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
