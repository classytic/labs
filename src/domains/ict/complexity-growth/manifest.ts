import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'complexity-growth',
  domain: 'ict',
  group: 'Algorithms & Data Structures',
  title: 'Growth rates (Big-O as a number)',
  description:
    'Move the input size and read what each growth class actually costs, with every class named after an algorithm from this course. Opens with a prediction students reliably get wrong, then shows that the classes are almost indistinguishable at n = 8 and separated by orders of magnitude at n = 1000.',
  schema: z.object({
    sizes: z.array(z.number().int().positive()).min(2).max(12).default([8, 16, 32, 64, 128, 256, 512, 1000]),
    start: z.number().int().min(0).default(0),
    predict: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12', 'undergraduate'],
    outcomes: ['algorithms', 'complexity', 'big-o'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'graph',
    prerequisites: ['sorting-quest'],
    related: ['binary-search', 'grid-path-dp'],
  },
  experience: {
    objectives: [
      'Estimate how much more work a quadratic method does than an n log n one',
      'Read operation counts for each growth class at a chosen input size',
      'Explain why a small example hides the difference between growth rates',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
