import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'reaction-lab',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Reaction lab',
  description: 'Atoms collide and bond, A + B → A–B, with a temperature/kinetics knob.',
  schema: z.object({
    prompt: z.string().optional(), a: z.string().optional(), b: z.string().optional(), title: z.string().optional() }),
  experience: {
    objectives: [
      'Distinguish particle collision from successful bond-forming collision',
      'Relate temperature to collision frequency and energy in the simplified model',
      'Track conservation of authored particles from reactants to products',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['chemistry', 'reactions', 'bonding'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
