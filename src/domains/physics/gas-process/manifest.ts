import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'gas-process',
  domain: 'physics',
  group: 'Physics',
  title: 'Gas processes, work = area under P–V',
  description:
    'Expand/compress an ideal gas isothermally, adiabatically, isobarically or isochorically. The shaded area under the P–V curve is the work; the first law ΔU = Q − W balances every term. A faint reference isotherm shows the adiabatic falling steeper.',
  schema: z.object({
    kind: z.enum(['isothermal', 'adiabatic', 'isobaric', 'isochoric']).optional(),
    gas: z.enum(['monatomic', 'diatomic']).optional(),
    moles: z.number().finite().min(0.1).max(10).optional(),
    tempK: z.number().finite().min(100).max(1200).optional(),
    volumeL: z.number().finite().min(1).max(100).optional(),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['thermodynamics', 'first-law'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Read work as area on a pressure-volume diagram',
      'Compare constrained gas processes',
      'Apply the first law to heat, work, and internal energy',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
