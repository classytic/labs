import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'hall-effect',
  domain: 'circuits',
  group: 'Circuits',
  title: 'The Hall effect (electrons vs holes)',
  description:
    'A current in a magnetic field deflects carriers to one edge; the sign of the Hall voltage reveals whether they are electrons (n) or holes (p). How carrier type is measured.',
  schema: z.object({ title: z.string().optional(), prompt: z.string().optional() }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['electronics', 'hall-effect', 'carriers'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'carrier',
  },
  experience: {
    objectives: [
      'Predict Hall-voltage polarity for electron conduction',
      'Connect edge charge to the measured voltage sign',
      'Identify carrier type from Hall polarity',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
