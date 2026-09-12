import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'trig-explorer',
  domain: 'math',
  group: 'Math',
  title: 'Trig explorer',
  description: 'Unit circle ↔ wave, drag the angle; sin & cos trace out. (tan/cot: use Graph)',
  schema: z.object({
    functions: z.array(z.enum(['sin', 'cos'])).optional(),
    startDeg: z.number().optional(),
  }),
  experience: {
    objectives: [
      'Connect unit-circle coordinates to sine and cosine values',
      'Trace circular motion into periodic wave graphs',
      'Compare phase, sign and extrema across a full rotation',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['math', 'trigonometry', 'unit-circle'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
