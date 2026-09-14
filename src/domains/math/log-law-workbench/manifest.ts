import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'log-law-workbench',
  tag: 'LogLawWorkbench',
  domain: 'math',
  group: 'Mathematics',
  title: 'Log Law Workbench',
  description: 'Combine and split logarithms, move powers, change base and solve an exponential equation.',
  schema: z.object({ title: z.string().optional(), prompt: z.string().optional() }),
  taxonomy: {
    grades: ['9', '10'],
    outcomes: ['logarithms', 'exponentials', 'change-of-base'],
    durationMinutes: 10,
    interaction: 'guided',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Choose the logarithm law that matches the operation.',
      'Move powers to coefficients without changing the value.',
      'Use change of base to evaluate or solve an exponential equation.',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
