import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'bit-grouper',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'Bit grouper (nibbles → hex/octal)',
  description:
    'Tappable bits auto-slice into groups from the right, 4 per hex digit, 3 per octal, translating live; shows why a byte = two clean hex digits but a wasteful octal top.',
  schema: z.object({
    width: z.number().default(8),
    groupSize: z.number().default(4),
    start: z.number().default(0),
    showColor: z.boolean().default(false),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Group binary digits from the least-significant side',
      'Translate three-bit groups to octal and four-bit groups to hexadecimal',
      'Explain why one byte maps cleanly to two hexadecimal digits',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['ict', 'number-bases', 'hexadecimal'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'number',
  },
  loadRuntime: () => import('./runtime.js'),
});
