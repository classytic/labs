import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps, controlConfig } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'shm',
  domain: 'physics',
  group: 'Physics',
  tag: 'SimpleHarmonic',
  title: 'Simple harmonic motion, spring & pendulum',
  description:
    'One a = −ω²x kernel, two skins. A restoring force ∝ displacement gives x(t) = A·cos(ωt), and a pen traces it out as a sine, the bridge to waves. Spring: ω=√(k/m). Small-angle pendulum: ω=√(g/L), with period independent of mass.',
  schema: z.object({
    mode: z.enum(['spring', 'pendulum']).optional().describe('Choose the physical representation'),
    k: z.number().finite().min(2).max(30).optional().describe('Spring stiffness in N/m'),
    length: z.number().finite().min(1).max(3.2).optional().describe('Pendulum length in metres'),
    mass: z.number().finite().min(0.5).max(5).optional().describe('Oscillating mass in kilograms'),
    amplitude: z
      .number()
      .finite()
      .min(0.8)
      .max(12)
      .optional()
      .describe(
        'Spring displacement in metres, or pendulum angle in degrees (kept within the small-angle model)',
      ),
    controlConfig,
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['shm', 'oscillations'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Locate maximum speed and stored energy',
      'Relate system parameters to period',
      'Connect a displacement-time trace to a wave',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
