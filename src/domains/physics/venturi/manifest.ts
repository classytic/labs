import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'venturi',
  tag: 'Venturi',
  domain: 'physics',
  group: 'Physics',
  title: 'Where the pipe narrows',
  description:
    'Bernoulli’s equation and continuity in a Venturi tube. Water flows through a pipe that narrows; three open tubes show the pressure, and the learner predicts which column stands lowest before they are revealed. Streaks spaced equally in time show the water speeding up (A₁v₁ = A₂v₂), the narrow part’s column falls by (v₂² − v₁²)/2g, and a tight enough throat drops below atmospheric pressure, as in a spray.',
  schema: z.object({
    inletSpeed: z.number().min(0.2).max(1.6).optional().describe('water speed in the wide pipe, m/s'),
    throatRatio: z
      .number()
      .min(0.3)
      .max(1)
      .optional()
      .describe('throat radius as a fraction of the pipe radius'),
    inletHead: z.number().min(0.2).max(1.2).optional().describe('water height in the first tube, m'),
    predict: z.boolean().optional().describe('hide the columns until the learner predicts'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Predict where the pressure is lowest in a narrowing pipe',
      'Use continuity to relate the speed to the cross-sectional area',
      'Explain the pressure drop with P + ½ρv² = constant',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['fluids', 'bernoulli', 'continuity', 'pressure'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
