import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'relativity-light-clock',
  tag: 'RelativityLightClockLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'Light clocks and time dilation',
  description:
    'Link a moving light-clock experiment, clock ledger, and spacetime diagram through one relativistic event model.',
  schema: z.object({
    beta: z.number().min(0).max(0.995).default(0.6),
    properTick: z.number().positive().max(100).default(2),
    view: z.enum(['experiment', 'spacetime', 'linked']).default('linked'),
    betaMin: z.number().min(0).max(0.99).default(0),
    betaMax: z.number().positive().max(0.995).default(0.95),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: [
      'physics',
      'modern-physics',
      'special-relativity',
      'time-dilation',
      'proper-time',
      'spacetime',
    ],
    durationMinutes: 18,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: ['vector-types'],
    related: ['spatial-lorentz'],
  },
  experience: {
    objectives: [
      'Distinguish proper time from coordinate time',
      'Derive time dilation from a longer light path',
      'Read the same events in a spacetime diagram',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
