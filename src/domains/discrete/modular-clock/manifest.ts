import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
export default defineLab({
  id: 'modular-clock',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'ModularClock',
  title: 'Modular clock',
  description:
    'Walk positive and negative steps around an authorable modulus to connect congruence, residue classes, divisibility, clocks, cycles, and cryptography.',
  schema: z.object({
    modulus: z.number().int().min(2).max(16).optional(),
    start: z.number().int().min(-20).max(30).optional(),
    step: z.number().int().min(-12).max(12).optional(),
    turns: z.number().int().min(1).max(8).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['7', '8', '9', '10', '11', '12'],
    outcomes: ['modular-arithmetic', 'congruence'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Normalize positive and negative integers to residues',
      'Explain congruence through divisible differences',
      'Transfer modular reasoning to a changed cycle',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['numeric', 'choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
