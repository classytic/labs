import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'graph-algorithm',
  domain: 'ict',
  group: 'Algorithms & Data Structures',
  title: 'Graph algorithm explorer',
  description:
    'A traceable BFS, DFS, and Dijkstra lesson with frontier, visited order, weights, and tentative distances.',
  schema: z.object({
    algorithm: z.enum(['bfs', 'dfs', 'dijkstra']).default('dijkstra'),
    graph: z
      .object({
        nodes: z
          .array(
            z.object({
              id: z.string().min(1),
              label: z.string().optional(),
              x: z.number().min(0).max(100),
              y: z.number().min(0).max(100),
            }),
          )
          .min(1)
          .max(40),
        edges: z
          .array(
            z.object({
              id: z.string().min(1),
              from: z.string().min(1),
              to: z.string().min(1),
              weight: z.number().min(0).optional(),
              directed: z.boolean().optional(),
            }),
          )
          .max(100),
      })
      .optional(),
    source: z.string().default('A'),
    target: z.string().default('F'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['9', '10', '11', '12'],
    outcomes: ['algorithms', 'graphs', 'shortest-path'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'graph',
    prerequisites: [],
    related: ['packet-journey'],
  },
  experience: {
    objectives: [
      'Predict the next frontier decision',
      'Trace visited and tentative state',
      'Transfer the invariant to changed weights or neighbour order',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
  omit: ['graph', 'source', 'target', 'algorithm'],
});
