import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../blocks/lab-block.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'ripple-tank',
  domain: 'physics',
  group: 'Physics',
  title: 'Ripple tank (2-D interference)',
  description:
    'Two draggable sources → live circular ripples or the static bright/dark interference fringes (Δ=nλ vs (n+½)λ).',
  schema: z.object({
    wavelength: z.number().finite().min(0.05).max(0.2).default(0.1),
    view: z.enum(['ripples', 'fringes']).default('ripples'),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['waves', 'interference'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Predict where two coherent sources reinforce',
      'Relate path difference to bright and dark fringes',
      'Compare patterns as wavelength and source separation change',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
