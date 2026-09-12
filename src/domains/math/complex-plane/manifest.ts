import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'complex-plane',
  domain: 'math',
  group: 'Math',
  title: 'Complex plane (Argand)',
  description:
    'Drag a + bi on the Argand plane: read the modulus and argument (deg & rad). Modes: point, multiply (×i rotates 90°), power (De Moivre spiral), or roots (the nth-roots of unity 1, i, −1, −i, ω).',
  schema: z.object({
    start: z.object({ re: z.number(), im: z.number() }).optional(),
    mode: z.enum(['point', 'multiply', 'power', 'roots']).default('point'),
    rootsN: z.number().default(4),
    powerN: z.number().default(3),
    snap: z.number().default(1),
    range: z.number().default(6),
    target: z.object({ re: z.number(), im: z.number() }).optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Connect Cartesian and polar descriptions of a complex number',
      'Interpret multiplication as scaling and rotation on the Argand plane',
      'Use De Moivre’s theorem to predict powers and roots including roots of unity',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['math', 'complex-numbers'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
