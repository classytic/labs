import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { flatVecSchema } from '../../../schemas/index.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'vector-board',
  domain: 'physics',
  group: 'Physics',
  title: 'Vector board (resultant / relative)',
  description:
    'Drag vector heads; live resultant (sum) or relative velocity (diff, the rain case) + angle. Optional drag-to-match goal.',
  schema: z.object({
    vectors: z.array(flatVecSchema).max(12).default([]),
    combine: z.enum(['sum', 'diff', 'none']).default('sum'),
    goalX: z.union([z.number(), z.string()]).optional(),
    goalY: z.union([z.number(), z.string()]).optional(),
    components: z.boolean().optional(),
    angle: z.boolean().default(true),
    objectives: z.array(z.string().trim().min(1)).min(1).optional(),
    hints: z.array(z.string().trim().min(1)).max(8).optional(),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['vectors', 'resultant'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Resolve vectors into components',
      'Construct a vector sum or difference',
      'Interpret resultant magnitude and direction',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
