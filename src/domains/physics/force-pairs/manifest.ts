import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'force-pairs',
  domain: 'physics',
  group: 'Physics',
  title: "Newton's third law (force pairs)",
  description:
    'Action and reaction drawn as two SEPARATE bodies, each inside its own dashed system boundary, so the two forces of the pair can never be added together. The force arrows are driven by the force slider alone and stay equal however different the masses are; the acceleration arrows below are normalised so their lengths sit in the exact ratio F/m_A : F/m_B. This is the horse-and-cart resolution, plus the counter-example that weight and a table’s push act on the SAME body and are therefore not a pair. Three frictionless scenarios: skaters on ice, an astronaut and a crate, a rocket and its exhaust.',
  schema: z.object({
    scenario: z.enum(['skaters', 'push', 'rocket']).optional().describe('which interaction opens first'),
    forceN: z
      .number()
      .finite()
      .min(10)
      .max(400)
      .optional()
      .describe('size of the interaction force, N (both members of the pair have this size)'),
    massAKg: z.number().finite().min(1).max(120).optional().describe('mass of body A, kg'),
    massBKg: z.number().finite().min(1).max(120).optional().describe('mass of body B, kg'),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['forces', 'newton-laws'],
    durationMinutes: 10,
    interaction: 'predict',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Name the two bodies a force pair acts on',
      'Keep the pair equal while the masses differ',
      'Explain why equal forces do not cancel',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
