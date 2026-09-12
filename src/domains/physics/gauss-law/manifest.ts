import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'gauss-law',
  domain: 'physics',
  group: 'Physics',
  tag: 'GaussLaw',
  title: 'Gauss’s law, flux depends only on charge inside',
  description:
    'A Gaussian loop (drag its centre, drag the rim to resize) sits in the field of two charges. Green markers show field leaving, red show field entering. The net flux Φ = Q/ε₀ depends only on the charge ENCLOSED, not the loop’s size or shape, and a charge outside adds zero.',
  schema: z.object({
    height: z.number().int().min(240).max(720).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    objectives: z.array(z.string().trim().min(1)).min(1).optional(),
  }),
  taxonomy: {
    grades: ['12'],
    outcomes: ['electrostatics', 'gauss-law'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Determine enclosed charge',
      'Relate signed flux to net enclosed charge',
      'Explain why external charges add zero net flux',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
