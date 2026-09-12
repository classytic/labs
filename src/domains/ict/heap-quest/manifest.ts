import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'heap-quest',
  domain: 'ict',
  group: 'Algorithms & Data Structures',
  title: 'Heap Quest',
  description:
    'Synchronized tree and array views for building, inserting into, and extracting from min/max heaps with decision checkpoints.',
  schema: z.object({
    values: z.array(z.number().int()).min(1).max(15).default([7, 2, 9, 1, 5, 8, 3]),
    kind: z.enum(['min', 'max']).default('min'),
    operation: z.enum(['build', 'insert', 'extract']).default('build'),
    value: z.number().int().default(0),
    predict: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['algorithms', 'heap', 'priority-queue', 'array-tree-representation'],
    durationMinutes: 15,
    interaction: 'predict',
    authorability: 'simple',
    representation: 'graph',
    prerequisites: ['tree-quest'],
    related: ['graph-algorithm'],
  },
  experience: {
    objectives: [
      'Predict swap and child-priority decisions',
      'Connect synchronized tree and array representations',
      'Distinguish heap order from global sorted order',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
