import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'gravity-drop',
  domain: 'physics',
  group: 'Physics',
  title: 'Gravity drop',
  description: 'Drop balls on three worlds, compare how gravity changes the fall.',
  schema: z.object({
    height: z.number().min(10).max(100).finite().default(50),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    objectives: z.array(z.string().trim().min(1)).min(1).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['gravity', 'free-fall'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Rank fall times from gravitational field strength',
      'Connect acceleration to changing speed',
      'Transfer the comparison to a new drop height',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['ordering'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
