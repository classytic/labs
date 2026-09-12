import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'induction-ladder',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'InductionLadder',
  title: 'Induction ladder',
  description:
    'Build and sabotage the base case and k→k+1 bridge so proof by induction becomes reachable structure rather than a memorized script.',
  schema: z.object({
    first: z.number().int().min(0).max(20).optional(),
    last: z.number().int().min(1).max(30).optional(),
    claim: z.string().min(1).max(180).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['proof-by-induction', 'mathematical-reasoning'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Separate the base case from the inductive step',
      'Explain why each obligation is necessary',
      'Diagnose a broken induction argument',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
