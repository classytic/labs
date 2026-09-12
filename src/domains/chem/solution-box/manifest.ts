import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'solution-box',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Solution box (molarity = n/V)',
  description:
    'Solute as dots in a box: add solute (more dots) or water (same dots, bigger box), M=n/V shows as a number AND colour intensity. Draggable probe proves molarity is a local density.',
  schema: z.object({
    moles: z.number().min(0.1).max(1).default(0.5),
    volume: z.number().min(0.2).max(1).default(0.5),
    showProbe: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Interpret molarity as amount of solute per solution volume',
      'Distinguish adding solute from adding solvent at the particle level',
      'Use a local probe to connect uniform particle density with bulk concentration',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['chemistry', 'molarity', 'solutions'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
