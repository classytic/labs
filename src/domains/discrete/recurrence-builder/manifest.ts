import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
export default defineLab({
  id: 'recurrence-builder',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'RecurrenceBuilder',
  title: 'Recurrence builder',
  description:
    'Build each term from its dependency edges and see why a recurrence needs both a transition rule and enough base cases.',
  schema: z.object({
    base: z.array(z.number().finite()).min(1).max(4).optional(),
    coefficients: z.array(z.number().finite()).min(1).max(4).optional(),
    count: z.number().int().min(3).max(14).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['9', '10', '11', '12'],
    outcomes: ['recurrences', 'dynamic-programming'],
    durationMinutes: 10,
    interaction: 'guided',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Identify base cases and recursive dependencies',
      'Construct terms from already-solved cases',
      'Transfer a recurrence to a changed rule',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['numeric', 'choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
