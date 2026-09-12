import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'binary-counter',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'Counting is dividing (binary and mod-N counters)',
  description:
    'A 4-bit counter drawn twice: as a register of four flip-flops holding the count now, and as four waveforms filled in one clock edge at a time as the learner pulses the clock. Each row changes half as often as the one above, which makes counting and frequency division visibly the same circuit. Sliding the counter length adds a real reset gate on the sequential engine that reads only the 1 bits of the last count, so a decade counter is designed rather than memorised, and every reset is marked through all the rows.',
  schema: z.object({
    modulus: z.number().int().min(2).max(16).default(16),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12', 'undergraduate'],
    outcomes: ['digital-logic', 'sequential-logic', 'counter', 'frequency-divider'],
    durationMinutes: 16,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'graph',
    prerequisites: ['latch-vs-flip-flop'],
    related: ['latch-vs-flip-flop', 'binary-display', 'sr-latch'],
    starter: false,
  },
  experience: {
    objectives: [
      'Read a count off four flip-flop outputs, and read it off their waveforms',
      'Explain why each bit of a counter changes half as often as the bit before it',
      'Design the reset logic for a counter of any length up to 16',
      'Use the halving pattern to work out how many stages divide a frequency down',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
