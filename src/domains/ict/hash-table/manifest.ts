import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'hash-table',
  domain: 'ict',
  group: 'Algorithms & Data Structures',
  title: 'Hash table (buckets, collisions, load factor)',
  description:
    'Insert keys one at a time, predicting each collision before it happens, and watch the load factor climb. Chaining appends to a bucket and grows its chain; linear probing walks to the next free slot and can run out of room entirely. The panel reports what the collisions cost a later lookup, so O(1) is shown as a condition rather than a promise.',
  schema: z.object({
    keys: z
      .array(z.string().trim().min(1))
      .min(1)
      .max(16)
      .default(['mango', 'guava', 'lychee', 'jackfruit', 'papaya', 'banana']),
    buckets: z.number().int().min(1).max(16).default(7),
    strategy: z.enum(['chaining', 'linear-probing']).default('chaining'),
    predict: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12', 'undergraduate'],
    outcomes: ['algorithms', 'hashing', 'data-structures'],
    durationMinutes: 14,
    interaction: 'predict',
    authorability: 'simple',
    representation: 'table',
    prerequisites: [],
    related: ['array-vs-list', 'complexity-growth'],
  },
  experience: {
    objectives: [
      'Predict whether a key will collide from the state of the table',
      'Relate load factor to the number of collisions and the cost of a lookup',
      'Contrast chaining with linear probing, including the case where probing runs out of room',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
