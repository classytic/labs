import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'fluid-pressure',
  domain: 'physics',
  group: 'Physics',
  title: 'Hydrostatic pressure (p = ρgh)',
  description:
    'Pressure in a fluid depends on DEPTH and density, never on the shape or width of the container. A wide tank, a narrow tube and a flaring cone are joined at the base so they settle to one common level; a single draggable depth line sweeps all three at once and every gauge reads the same. Fluid chips (water, seawater, oil, mercury) supply the contrast that shape does not, and an optional atmosphere toggle turns gauge pressure into absolute pressure.',
  schema: z.object({
    fluid: z
      .enum(['water', 'seawater', 'oil', 'mercury'])
      .optional()
      .describe('which fluid the vessels open filled with'),
    depthM: z
      .number()
      .finite()
      .min(0)
      .max(2.5)
      .optional()
      .describe('opening probe depth below the surface, m'),
    includeAtmosphere: z
      .boolean()
      .optional()
      .describe('open showing absolute pressure (fluid column + 101.3 kPa of air)'),
    gravityMs2: z
      .number()
      .finite()
      .min(1)
      .max(25)
      .optional()
      .describe('gravitational field strength, m/s², lower it to pose the same lab on the Moon'),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['pressure', 'fluids'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Predict that pressure at a given depth is independent of the vessel shape',
      'Use p = ρgh to calculate the pressure at a depth in a fluid',
      'Explain why a denser fluid raises the pressure at the same depth',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
