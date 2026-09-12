import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../blocks/lab-block.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'doppler',
  domain: 'physics',
  group: 'Physics',
  title: 'Doppler effect',
  description:
    'A moving source bunches wavefronts ahead (higher pitch) and stretches them behind; past Mach 1 a shock cone forms. Drive-by siren via Web Audio.',
  schema: z.object({
    mach: z.number().finite().min(0).max(1.6).default(0.6),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['waves', 'doppler'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Predict pitch ahead of and behind a moving source',
      'Connect wavefront spacing to observed frequency',
      'Explain the formation of a shock cone',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
