import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../blocks/lab-block.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'string-reflection',
  domain: 'physics',
  group: 'Physics',
  title: 'Reflection & standing waves on a string',
  description:
    'A pulse reflects (fixed end inverts, free end upright); a continuous wave + its reflection lock into a standing wave at the resonant harmonics fₙ=n·c/2L.',
  schema: z.object({
    mode: z.enum(['pulse', 'resonance']).default('pulse'),
    end: z.enum(['fixed', 'free']).default('fixed'),
    frequency: z.number().finite().min(0.1).max(1.6).default(0.4),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['waves', 'standing-waves', 'resonance'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Compare reflection at fixed and free boundaries',
      'Locate nodes and antinodes',
      'Tune a string to a resonant harmonic',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
