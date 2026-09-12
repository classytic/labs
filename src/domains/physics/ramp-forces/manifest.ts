import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { controlConfigSchema } from '../../../schemas/index.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'ramp-forces',
  domain: 'physics',
  group: 'Physics',
  title: 'Ramp forces (F = ma on an incline)',
  description:
    'Tilt the incline: the weight vector splits into mg sinθ (down-slope) + mg cosθ (into-slope), the normal force shrinks as you tilt (N = mg cosθ), a friction slider spans frictionless→sticky, and the crate slides at a = g(sinθ − μcosθ).',
  schema: z
    .object({
      angleDeg: z.number().min(0).max(75).finite().default(25),
      mass: z.number().min(1).max(10).finite().default(2),
      friction: z.number().min(0).max(1).finite().default(0.4),
      frictionKinetic: z.number().min(0).max(1).finite().default(0.3),
      appliedN: z.number().min(-30).max(30).finite().default(0),
      g: z.number().positive().max(30).finite().default(9.8),
      showComponents: z.boolean().default(false),
      title: z.string().trim().min(1).optional(),
      prompt: z.string().trim().min(1).optional(),
      objectives: z.array(z.string().trim().min(1)).min(1).optional(),
      controls: controlConfigSchema.optional(),
      activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
    })
    .refine(({ friction, frictionKinetic }) => frictionKinetic <= friction, {
      message: 'kinetic friction must not exceed static friction',
      path: ['frictionKinetic'],
    }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['dynamics', 'friction', 'inclined-plane'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Resolve weight into ramp-aligned components',
      'Distinguish static and kinetic friction',
      'Use the force sum to predict acceleration',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
