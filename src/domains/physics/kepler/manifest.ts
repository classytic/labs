import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps, controlConfig } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'kepler',
  domain: 'physics',
  group: 'Physics',
  title: 'Kepler’s laws, orbits & equal areas',
  description:
    'A planet on a true ellipse with the star at a focus (Kepler 1). Solving Kepler’s equation makes it genuinely speed up at perihelion, and the equal-time wedges it sweeps come out equal in area (Kepler 2), fat-and-short near the star, thin-and-long far out. Stretch the orbit and the period grows as T² ∝ a³ (Kepler 3).',
  schema: z.object({
    semiMajor: z.number().finite().min(2.5).max(5).default(4),
    eccentricity: z.number().finite().min(0).max(0.7).default(0.5),
    wedges: z.boolean().default(true),
    controlConfig,
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['orbits', 'kepler-laws'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Locate a star at an ellipse focus',
      'Explain equal areas in equal times',
      'Relate semi-major axis to orbital period',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
