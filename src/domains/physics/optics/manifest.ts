import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'optics',
  domain: 'physics',
  group: 'Physics',
  title: 'Optics (reflect the ray)',
  description: 'Drag the source / mirrors so the light ray reflects into the target.',
  schema: z.object({
    height: z.number().int().min(280).max(720).optional(),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['optics', 'reflection'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Apply the law of reflection',
      'Aim a beam by changing a mirror normal',
      'Explain a multi-bounce light path',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
