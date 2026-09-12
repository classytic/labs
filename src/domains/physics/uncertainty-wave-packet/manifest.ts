import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'uncertainty-wave-packet',
  tag: 'UncertaintyWavePacketLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'Position–momentum uncertainty',
  description: 'Link Gaussian position and momentum distributions to reveal their reciprocal Fourier widths.',
  schema: z.object({
    positionSpread: z.number().positive().max(10).default(1.25),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['physics', 'quantum', 'uncertainty', 'wave-packet', 'fourier-transform'],
    durationMinutes: 16,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: [],
    related: ['double-slit', 'photoelectric-effect'],
  },
  experience: {
    objectives: [
      'Interpret spread as quantum uncertainty',
      'Connect position and momentum as Fourier-paired descriptions',
      'Recognize a Gaussian minimum-uncertainty state',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
