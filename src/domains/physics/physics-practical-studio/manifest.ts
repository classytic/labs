import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'physics-practical-studio',
  tag: 'PhysicsPracticalStudio',
  domain: 'physics',
  group: 'Physics',
  title: 'Physics Practical Studio',
  description:
    'Plan a fair pendulum test, select apparatus, collect repeated measurements, prepare graph evidence and evaluate uncertainty.',
  schema: z.object({
    title: z.string().optional(),
    prompt: z.string().optional(),
    gravity: z
      .number()
      .finite()
      .min(1)
      .max(30)
      .default(9.81)
      .describe('local gravitational field strength in N/kg'),
  }),
  taxonomy: {
    grades: ['9', '10'],
    outcomes: ['physics', 'practical-skills', 'measurement', 'evaluation'],
    durationMinutes: 15,
    interaction: 'guided',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Plan a fair test with suitable apparatus and variables.',
      'Collect repeated measurements and interpret a graph-ready table.',
      'Evaluate uncertainty and propose a practical improvement.',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
