import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'shift-register',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'A stream in, a word out (shift registers)',
  description:
    'A four-stage serial-in, parallel-out shift register on the sequential engine. The chain shows each stage, its parallel output and the bit falling off the far end; underneath, a grid keeps one row per clock edge so every bit draws a diagonal as it moves along. The prediction is about order (the first bit sent ends up furthest away), the challenge is to load a pattern chosen so that sending it in reading order fails, and the transfer question is how three microcontroller pins can drive eight LEDs.',
  schema: z.object({
    target: z
      .string()
      .regex(/^[01]{4}$/, 'four bits, for example 1100')
      .default('1100'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12', 'undergraduate'],
    outcomes: ['digital-logic', 'sequential-logic', 'shift-register', 'serial-communication'],
    durationMinutes: 14,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'device',
    prerequisites: ['latch-vs-flip-flop'],
    related: ['latch-vs-flip-flop', 'binary-counter', 'jk-flip-flop'],
    starter: false,
  },
  experience: {
    objectives: [
      'Trace bits through a serial-in, parallel-out shift register one clock edge at a time',
      'Explain why the first bit sent ends up at the far end of the register',
      'Load a chosen pattern by sending its bits in the right order',
      'Explain how a shift register lets a few pins control many outputs',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
