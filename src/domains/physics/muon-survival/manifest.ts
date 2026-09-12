import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'muon-survival',
  tag: 'MuonSurvivalLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'Muon survival and time dilation',
  description:
    'Resolve the atmospheric-muon mystery by comparing classical decay with relativistic proper time.',
  schema: z.object({
    beta: z.number().min(0.8).max(0.995).default(0.995),
    altitudeKm: z.number().positive().max(100).default(10),
    population: z.number().int().positive().max(100000).default(1000),
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
      'radioactive-decay',
      'evidence',
    ],
    durationMinutes: 16,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: ['relativity-light-clock'],
    related: ['relativity-light-clock', 'decay-cooling'],
  },
  experience: {
    objectives: [
      'Connect unstable-particle decay to time dilation',
      'Compare classical and relativistic predictions',
      'Explain survival using proper time',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
