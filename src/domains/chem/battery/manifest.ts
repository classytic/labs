import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'battery',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Battery (galvanic cell)',
  description: 'Trace electrons through the load and ions through the salt bridge; connect half-reactions, EMF, and ideal load current.',
  schema: z.object({ emf: z.number().optional(), title: z.string().optional() }),
  experience: {
    objectives: [
      'Identify oxidation at the anode and reduction at the cathode',
      'Trace electron flow through the external circuit',
      'Connect paired half-reactions to the overall cell reaction and EMF',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['chemistry', 'electrochemistry', 'galvanic-cell'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
