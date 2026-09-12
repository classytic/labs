import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'grid-path-dp',
  domain: 'ict',
  group: 'Algorithms & Data Structures',
  title: 'Dynamic programming grid paths',
  description:
    'Build a dynamic-programming table one state at a time and see which earlier answers each cell reuses.',
  schema: z.object({
    rows: z.number().int().min(2).max(8).default(4),
    cols: z.number().int().min(2).max(8).default(5),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['algorithms', 'dynamic-programming', 'complexity'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'table',
    prerequisites: [],
    related: ['graph-algorithm'],
  },
  experience: {
    objectives: [
      'Predict a state from already-solved subproblems',
      'Trace reuse through a dynamic-programming table',
      'Adapt the recurrence when allowed transitions change',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
  omit: ['rows', 'cols', 'title', 'prompt'],
});
