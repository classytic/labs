import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps, vec2, ask } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

const boundedPoint = vec2.refine(
  ({ x, y }) => Math.abs(x) <= 10 && Math.abs(y) <= 10,
  'point must remain inside the authored scene',
);

export default defineLab({
  id: 'work-potential',
  domain: 'physics',
  group: 'Physics',
  title: 'Potential & work, equipotentials and W = qΔV',
  description:
    'Electric potential made visible through equipotential rings (V = kQ/r) with field lines at right angles. Drag points A and B: the work to move a charge A → B is W = qΔV and depends only on the endpoints, never the path. Slide a point around a ring (same V) and the work is zero.',
  schema: z.object({
    charge: z
      .number()
      .finite()
      .min(-10)
      .max(10)
      .refine((value) => value !== 0, 'charge cannot be zero')
      .optional()
      .describe('source charge Q (sign + magnitude); rings scale with it'),
    movingCharge: z
      .number()
      .finite()
      .min(-10)
      .max(10)
      .refine((value) => value !== 0, 'movingCharge cannot be zero')
      .optional()
      .describe('the moving test charge q in W = q·ΔV'),
    a: boundedPoint.optional().describe('start point A'),
    b: boundedPoint.optional().describe('end point B'),
    sourceAt: boundedPoint.optional().describe('source charge position'),
    rings: z
      .array(z.number().finite().min(0.3).max(6))
      .min(1)
      .max(8)
      .optional()
      .describe('equipotential ring radii'),
    lockSource: z.boolean().optional().describe('fix the source so the learner moves only A and B'),
    ask: ask.describe('an attached graded question (MCQ or typed)'),
    height: z.number().int().min(280).max(720).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['12'],
    outcomes: ['electrostatics', 'potential', 'work'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Interpret electric potential using equipotential lines',
      'Calculate work from charge and potential difference',
      'Explain why work is path independent',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
