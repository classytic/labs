import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps, controlConfig } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'orbit-lab',
  domain: 'physics',
  group: 'Physics',
  title: 'Orbit lab',
  description: 'Interactive orbit, launch a satellite: crash, orbit, or escape.',
  schema: z.object({
    launchSpeedRatio: z.number().finite().min(0.5).max(1.5).default(1),
    controlConfig,
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['orbits', 'gravitation'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Predict trajectory from launch speed',
      'Connect orbital energy to bound and unbound paths',
      'Tune a launch into a sustained orbit',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
