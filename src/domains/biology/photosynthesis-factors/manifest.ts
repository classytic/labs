import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'photosynthesis-factors',
  domain: 'biology',
  group: 'Biology',
  title: 'Photosynthesis: limiting factors',
  description:
    'Sliders for light, CO₂ and temperature; the rate climbs then plateaus at the factor in shortest supply (raise it → higher plateau), while temperature gives a peak (denaturation). Freeze curves to compare.',
  schema: z.object({
    light: z.number().finite().min(0).max(100).default(70),
    co2: z.number().finite().min(0).max(100).default(50),
    temperature: z.number().finite().min(0).max(50).default(25),
    tempOptimum: z.number().finite().min(1).max(49).default(28),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['biology', 'photosynthesis', 'limiting-factors'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict why a photosynthesis rate curve plateaus',
      'Compare light, carbon dioxide, and temperature as limiting factors',
      'Explain why temperature above the optimum causes a decline rather than a plateau',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
