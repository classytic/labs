import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
export default defineLab({
  id: 'modulus-cases',
  tag: 'ModulusCases',
  domain: 'math',
  group: 'Mathematics',
  title: 'Modulus Cases',
  description: 'Link distance, signed algebraic cases, graph intersections and inequality intervals.',
  schema: z.object({ title: z.string().optional(), prompt: z.string().optional() }),
  taxonomy: {
    grades: ['9', '10'],
    outcomes: ['modulus', 'equations', 'inequalities', 'graphs'],
    durationMinutes: 10,
    interaction: 'guided',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Interpret modulus as distance.',
      'Split an equation into valid algebraic cases.',
      'Check roots and inequality intervals on the folded graph.',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
