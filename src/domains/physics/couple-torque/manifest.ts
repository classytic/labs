import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'couple-torque',
  domain: 'physics',
  group: 'Physics',
  title: 'The torque of a couple',
  description:
    'Two equal, antiparallel forces on one body: zero resultant force, real turning effect. The pivot is draggable anywhere (including off the bar, where none of the object is) and the two individual moments are shown live, so the learner watches them trade size, one even reversing sign, while their total sits fixed at F d. Unlike the single-pivot lever, nothing here hinges, so d reads as what it is: the perpendicular gap between the two lines of action.',
  schema: z.object({
    forceN: z
      .number()
      .finite()
      .min(2)
      .max(14)
      .optional()
      .describe('size of EACH force, N. The two are always equal and opposite'),
    separationM: z
      .number()
      .finite()
      .min(0.1)
      .max(0.5)
      .optional()
      .describe('perpendicular separation of the two lines of action, m'),
    pivotX: z
      .number()
      .finite()
      .min(-0.55)
      .max(0.55)
      .optional()
      .describe('where the pivot starts along the bar, m from the centre (may start off the bar)'),
    pivotY: z
      .number()
      .finite()
      .min(-0.22)
      .max(0.22)
      .optional()
      .describe(
        'where the pivot starts across the bar, m. Both forces are vertical, so this changes nothing',
      ),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['moments', 'torque'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
    related: ['lever'],
  },
  experience: {
    objectives: [
      'Show that two equal, opposite forces have zero resultant but a real turning effect',
      'Take moments about any point, on the body or off it, and still get F d',
      'Measure d as the perpendicular gap between the two lines of action',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
