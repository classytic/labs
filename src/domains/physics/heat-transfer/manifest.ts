import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps, controlConfig } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'heat-transfer',
  domain: 'physics',
  group: 'Physics',
  title: 'Heat transfer, conduction / convection / radiation',
  description:
    "The three ways heat moves, each with its rate law and animation. Author a survey (all three) OR a focused lesson: set mode + controlConfig.hide=['mechanism'] to show conduction (or convection / radiation) on its own.",
  schema: z.object({
    mode: z.enum(['conduction', 'convection', 'radiation']).optional(),
    controlConfig,
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['heat', 'thermal-transfer'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Distinguish conduction, convection, and radiation',
      'Relate transfer rate to material and geometry',
      'Explain thermal transfer using an energy mechanism',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
