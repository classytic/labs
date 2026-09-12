import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'array-vs-list',
  domain: 'ict',
  group: 'Algorithms & Data Structures',
  title: 'Array against linked list',
  description:
    'Run one operation on both structures at once and count every cell moved and every pointer followed. The learner commits to a winner first, then watches an array read in one touch while the list hops, and an insert at the front reverse the result completely. Search ties, which is the outcome students least expect.',
  schema: z.object({
    values: z.array(z.number().int()).min(1).max(12).default([4, 8, 15, 16, 23, 42]),
    operation: z
      .enum(['get', 'search', 'insert-front', 'insert-end', 'delete-front'])
      .default('insert-front'),
    argument: z.number().int().default(99),
    predict: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12', 'undergraduate'],
    outcomes: ['algorithms', 'data-structures', 'complexity'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'simple',
    representation: 'table',
    prerequisites: [],
    related: ['hash-table', 'complexity-growth'],
  },
  experience: {
    objectives: [
      'Predict which structure does less work for a given operation',
      'Explain why an array reads in one touch and a list has to walk',
      'Explain why an insert at the front reverses that result',
      'Choose a structure from the operations a program performs most',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
