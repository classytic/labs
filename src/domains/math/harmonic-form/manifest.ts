import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'harmonic-form',
  tag: 'HarmonicForm',
  domain: 'math',
  group: 'Trigonometry',
  title: 'Harmonic form: a cos x + b sin x = R cos(x − α)',
  description:
    'Two waves of the same period add to ONE wave of that period, shifted. Drag the coefficients and watch the two phasors add tip to tail: R is the length of the resultant and α is its direction, which is why the R-formula is Pythagoras and arctan rather than anything new.',
  schema: z.object({
    a: z.number().finite().min(-8).max(8).optional().describe('coefficient of cos x'),
    b: z.number().finite().min(-8).max(8).optional().describe('coefficient of sin x'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'See that a cos x + b sin x is a single shifted wave of the same period',
      'Read R as the length of the resultant phasor and α as its direction',
      'Use the form to find a maximum, a minimum, or to solve an equation',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['trigonometry', 'harmonic-form', 'wave-addition'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
