import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'rc-charging',
  domain: 'circuits',
  group: 'Circuits',
  tag: 'RCCharging',
  title: 'RC charging (fill the capacitor)',
  description:
    'A capacitor fills through a resistor like a bucket through a pipe; the V(t) curve is the real Backward-Euler transient solve. Drag R and C to change τ = R·C, or flip to discharge.',
  schema: z.object({
    volts: z.number().min(1).max(12).optional(),
    resistanceK: z.number().min(1).max(100).optional(),
    capacitanceU: z
      .number()
      .min(1)
      .max(1000)
      .optional()
      .describe(
        'capacitance in microfarads; 100 uF is a common component, so combination lessons need headroom above it',
      ),
    show: z.enum(['both', 'circuit', 'graph']).optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['electronics', 'capacitor', 'rc'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict capacitor voltage after one time constant',
      'Connect the circuit state to its exponential curve',
      'Redesign the time constant by changing resistance or capacitance',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
