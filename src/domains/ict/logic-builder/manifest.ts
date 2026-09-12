import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'logic-builder',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'Logic builder (drag-and-drop gate circuit)',
  description:
    'A Logisim-style canvas: drag sources, gates and LEDs from the palette, wire output dots to input slots, flip switches and watch the signal glow. Leave the goal on "sandbox" for open building, or pick a target (half-adder, NAND→AND…) to grade the learner against its truth table.',
  schema: z.object({
    goal: z
      .enum(['sandbox', 'and', 'or', 'xor', 'nand-not', 'nand-and', 'nand-or', 'half-adder', 'full-adder'])
      .default('sandbox'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Construct a valid digital circuit by placing and wiring gates',
      'Test a circuit across input combinations using visible signal propagation',
      'Synthesize an authored target such as a universal-gate form or binary adder',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['ict', 'digital-logic', 'circuit-building'],
    durationMinutes: 20,
    interaction: 'build',
    authorability: 'moderate',
    representation: 'gate',
    prerequisites: ['logic-gate'],
  },
  loadRuntime: () => import('./runtime.js'),
});
