import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps, controlConfig } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'thermal-expansion',
  domain: 'physics',
  group: 'Physics',
  title: 'Thermal expansion, length / area / volume / bimetallic',
  description:
    "Heat a solid and it grows: ΔL=αLΔT, ΔA=2αAΔT, ΔV=3αVΔT, plus a bimetallic-strip thermostat. Author one case (e.g. mode:'area', controlConfig.hide=['what expands']) or the full set.",
  schema: z.object({
    mode: z.enum(['length', 'area', 'volume', 'bimetallic']).optional(),
    controlConfig,
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['10', '11'],
    outcomes: ['heat', 'expansion'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Relate temperature change to expansion',
      'Compare linear, area, and volume expansion',
      'Explain bimetallic bending from unequal coefficients',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
