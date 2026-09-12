import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps, controlConfig } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'energy-skate',
  domain: 'physics',
  group: 'Physics',
  title: 'Energy skate park, KE ⇄ PE (+ heat)',
  description:
    'A skater released on a ramp: potential, kinetic and thermal bars always sum to the same total. Friction off → it returns to the same height forever; friction on → the heat bar grows and every peak is lower. Energy conservation and conversion, animated (the LOL bar chart).',
  schema: z.object({
    startHeight: z.number().finite().min(1).max(5).optional(),
    friction: z.boolean().optional(),
    mass: z.number().finite().positive().max(20).optional(),
    controlConfig,
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['energy', 'conservation'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Track potential, kinetic, and thermal energy',
      'Apply conservation of total energy',
      'Explain how friction changes the mechanical-energy account',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
