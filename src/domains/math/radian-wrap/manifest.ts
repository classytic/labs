import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'radian-wrap',
  tag: 'RadianWrap',
  domain: 'math',
  group: 'Trigonometry',
  title: 'The radian, measured by laying the radius along the rim',
  description:
    'A radian is usually introduced as a conversion factor, which teaches the arithmetic and hides the idea. Here the learner lays the radius round the circumference one length at a time and counts: six whole ones and a short stub. The count IS the angle, so 2π stops being a number to memorise and the definition angle = arc / radius is the thing they watched happen.',
  schema: z.object({
    startRadians: z.number().min(0).max(6.29).optional().describe('radii of arc laid at the start'),
    radius: z.number().min(40).max(120).optional().describe('drawn radius; the count does not depend on it'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Measure an angle in radii of arc rather than in degrees',
      'Derive 2π radians in a full turn by counting, not by recall',
      'Read angle = arc / radius as a definition rather than a formula',
    ],
    phases: ['predict', 'act', 'observe', 'explain'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['trigonometry', 'radian-measure', 'circular-motion'],
    durationMinutes: 6,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
