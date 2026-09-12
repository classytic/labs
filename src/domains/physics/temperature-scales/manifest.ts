import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'temperature-scales',
  domain: 'physics',
  group: 'Physics',
  title: 'Temperature scales, °C / °F / K',
  description:
    'One mercury column read against Celsius, Fahrenheit and Kelvin at once (F = 9⁄5·C + 32, K = C + 273.15). Fixed points marked; jump to absolute zero, ice, body, boiling. Shows why Kelvin starts at absolute zero.',
  schema: z.object({
    initialC: z.number().finite().min(-273.15).max(120).optional(),
    presets: z
      .array(
        z.object({ c: z.number().finite().min(-273.15).max(120), label: z.string().trim().min(1).max(40) }),
      )
      .min(1)
      .max(12)
      .optional(),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['temperature', 'unit-conversion'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Convert between Celsius, Fahrenheit, and Kelvin',
      'Compare fixed points on three scales',
      'Explain why Kelvin begins at absolute zero',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
