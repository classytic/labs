import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'diode',
  domain: 'circuits',
  group: 'Circuits',
  title: 'Diode: a one-way valve',
  description:
    'Drive a diode through a resistor. Forward, past the ~0.6 V knee, the valve opens; reverse it and it blocks. The operating point is the real nonlinear (Shockley) solve. Flip orientation and predict.',
  schema: z.object({
    volts: z.number().min(0).max(5).optional(),
    resistanceK: z.number().min(0.2).max(10).optional(),
    show: z.enum(['both', 'circuit', 'graph']).optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['electronics', 'diode'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'moderate',
    representation: 'schematic',
    related: ['pn-junction'],
  },
  experience: {
    objectives: [
      'Predict the effect of reverse bias',
      'Relate lamp state and current to the I–V operating point',
      'Control forward current with series resistance',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
