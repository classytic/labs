import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'trig-signs',
  domain: 'math',
  group: 'Math',
  title: 'Unit circle, signs (CAST)',
  description:
    'Drag the angle on the unit circle: the quadrant lights up with its CAST letter (which of sin/cos/tan are +), cos and sin draw green/red by sign, and special angles show their exact value (½, √3⁄2 …).',
  schema: z.object({
    startDeg: z.number().default(30),
    snapDeg: z.number().default(15),
    targetDeg: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Determine trigonometric signs from the terminal quadrant',
      'Connect sine and cosine signs to unit-circle coordinates',
      'Combine a reference angle with quadrant information to recover exact values',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['math', 'trigonometry', 'unit-circle'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
