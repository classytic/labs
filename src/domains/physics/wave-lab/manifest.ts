import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../blocks/lab-block.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'wave-lab',
  domain: 'physics',
  group: 'Physics',
  title: 'Waves (travelling / superposition / standing)',
  description:
    'One waves playground: shape a travelling wave (v=fλ), add a second for interference/beats, or lock two opposite waves into a standing wave with nodes/antinodes. Optional sound.',
  schema: z.object({
    mode: z.enum(['travelling', 'superpose', 'standing']).default('travelling'),
    amplitude: z.number().finite().min(0.5).max(2.5).default(2),
    wavelength: z.number().finite().min(1).max(8).default(4),
    frequency: z.number().finite().min(0.2).max(3).default(1),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['waves', 'superposition'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Relate wave speed, frequency, and wavelength',
      'Compare constructive and destructive interference',
      'Identify nodes and antinodes in a standing wave',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
