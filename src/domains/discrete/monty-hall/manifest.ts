import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'monty-hall',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'MontyHall',
  title: 'Monty Hall game',
  description:
    'Play the paradox: pick a door, Monty opens a goat, stay or switch, every game grows the switch/stay win-rate bars to 2/3 vs 1/3.',
  schema: z.object({
    doors: z.number().int().min(3).max(6).optional(),
    seed: z.number().int().min(0).max(4294967295).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['probability', 'conditional-probability'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Predict whether staying or switching wins more often',
      'Connect the first-pick error rate to the switching advantage',
      'Use repeated trials to distinguish evidence from short-run luck',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
