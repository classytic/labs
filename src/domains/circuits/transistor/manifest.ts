import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'transistor',
  domain: 'circuits',
  group: 'Circuits',
  title: 'Transistor: a small input controls a big current',
  description:
    'Turn the gate voltage of an NMOS: below threshold the channel is shut, past it the gate steers a much larger drain current up the square-law transfer curve. The switch (and amplifier) at the heart of every chip.',
  schema: z.object({
    supply: z.number().optional(),
    // vth is drawn inside a FIXED transfer-curve view box (VGS 0–5 V, the gate slider's range),
    // so a threshold outside it lands off-plot.
    vth: z.number().min(0).max(5).optional(),
    loadK: z.number().min(0.5).max(5).optional(),
    show: z.enum(['both', 'circuit', 'graph']).optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['electronics', 'transistor', 'mosfet'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'schematic',
    related: ['mosfet-inside', 'cmos-inverter'],
  },
  experience: {
    objectives: [
      'Predict channel state below threshold',
      'Relate gate drive to the transfer curve',
      'Explain how load resistance changes the operating point',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
