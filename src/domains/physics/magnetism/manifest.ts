import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'magnetism',
  domain: 'physics',
  group: 'Physics',
  title: 'Magnetism, field lines & compass',
  description:
    'Drag a bar magnet (or switch to a current-carrying wire); the field lines retrace live and a draggable compass needle aligns to the field.',
  schema: z.object({
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['magnetism', 'field-lines'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Read magnetic field direction',
      'Use a compass as a local field probe',
      'Relate current direction to circular field direction',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
