import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { typePanelSchema } from '../../../schemas/index.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'vector-types',
  domain: 'physics',
  group: 'Physics',
  title: 'Vector types (reference figure)',
  description:
    'Labeled gallery: equal, negative, null, unit, parallel, position. The vectors-chapter opener.',
  schema: z.object({
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    objectives: z.array(z.string().trim().min(1)).min(1).optional(),
    types: z.array(typePanelSchema).min(1).max(12).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['vectors'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Distinguish vectors from scalars',
      'Compare vector magnitude and direction',
      'Recognize common vector relationships',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
