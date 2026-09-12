import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'binary-search',
  domain: 'ict',
  group: 'Algorithms & Data Structures',
  title: 'Binary search (halving a sorted array)',
  description:
    'Probe the middle of a sorted array, predict which half survives, and watch the window collapse. The probe count sits beside what a left-to-right scan would have cost on the same data, so halving is measured rather than asserted, and the closing question asks why sorting is what makes it legal.',
  schema: z.object({
    values: z.array(z.number().int()).min(1).max(24).default([1, 3, 5, 7, 9, 11, 13, 15]),
    target: z.number().int().default(13),
    predict: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12', 'undergraduate'],
    outcomes: ['algorithms', 'searching', 'complexity'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'simple',
    representation: 'table',
    prerequisites: [],
    related: ['sorting-quest', 'tree-quest'],
  },
  experience: {
    objectives: [
      'Predict which half of a sorted array survives each probe',
      'Compare the probe count against a linear scan on the same array',
      'Explain why binary search requires sorted input',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
