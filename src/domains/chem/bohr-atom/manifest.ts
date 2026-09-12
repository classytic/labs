import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'bohr-atom',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Bohr atom',
  description: 'Animated shell model, drag Z to walk the first 20 elements; shells fill 2, 8, 8.',
  schema: z.object({ protons: z.number().optional(), title: z.string().optional() }),
  experience: {
    objectives: [
      'Relate atomic number to proton and electron count in a neutral atom',
      'Distribute the first twenty electrons across simplified Bohr shells',
      'Connect outer-shell occupancy to periodic position and likely ion formation',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['chemistry', 'atomic-structure', 'bohr-model'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
