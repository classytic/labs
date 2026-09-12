import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'frequency-density',
  tag: 'FrequencyDensity',
  domain: 'statistics',
  group: 'Statistics',
  title: 'Frequency density (unequal class widths)',
  description:
    'The same grouped data drawn twice: once with bar height set to the frequency, which is the standard mistake, and once with height set to frequency divided by width, which is what a histogram is. Switching between them shows a wide class deflate, so a class holding more values can be the shorter bar.',
  schema: z.object({
    classes: z
      .array(
        z.object({
          from: z.number().finite(),
          to: z.number().finite(),
          frequency: z.number().min(0),
        }),
      )
      .min(2)
      .max(10)
      .optional()
      .describe('contiguous classes of UNEQUAL width; equal widths make the two pictures identical'),
    unit: z.string().trim().max(20).optional().describe('what one value is, e.g. "day"'),
    measure: z.string().trim().max(40).optional().describe('what the horizontal axis measures'),
    startMode: z
      .enum(['density', 'frequency'])
      .optional()
      .describe('which picture to open on; defaults to the wrong one, which is the belief to displace'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Plot frequency density, not frequency, when class widths differ',
      'Read the frequency of a class as the AREA of its bar',
      'Identify the modal class from density rather than from the raw count',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11', '12'],
    outcomes: ['statistics', 'data-display', 'histogram'],
    durationMinutes: 9,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
