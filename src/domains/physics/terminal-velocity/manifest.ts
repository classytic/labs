import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps, controlConfig } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'terminal-velocity',
  domain: 'physics',
  group: 'Physics',
  title: 'Terminal velocity, the skydiver (air drag)',
  description:
    'A fall with air resistance: drag grows with speed (∝v²) until it balances gravity, so the speed levels off at v_t = √(mg/b). The weight arrow stays fixed while the drag arrow rises to meet it and the v–t curve flattens onto its asymptote (exact tanh solution). Pop the parachute and v_t collapses to a survivable speed.',
  schema: z.object({
    mass: z.number().finite().min(40).max(120).optional(),
    drag: z.number().finite().min(0.2).max(1.2).optional(),
    parachute: z.boolean().optional(),
    controlConfig,
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['dynamics', 'air-resistance'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Relate drag force to speed',
      'Identify terminal velocity as force balance',
      'Explain how a parachute changes terminal speed',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
