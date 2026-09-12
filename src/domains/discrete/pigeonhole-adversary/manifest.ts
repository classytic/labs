import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'pigeonhole-adversary',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'PigeonholeAdversary',
  title: 'Pigeonhole adversary',
  description:
    'Distribute cards, birthdays, socks, or hash keys against a worst-case adversary and discover when a repeated category becomes guaranteed.',
  schema: z.object({
    holes: z.number().int().min(2).max(8).optional(),
    targetOccupancy: z.number().int().min(2).max(5).optional(),
    labels: z.array(z.string().min(1).max(24)).max(8).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['8', '9', '10', '11', '12'],
    outcomes: ['pigeonhole-principle', 'extremal-reasoning'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Distinguish a guarantee from a probability',
      'Construct the worst-case balanced distribution',
      'Transfer the occupancy bound to a new story',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
