import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'wire-a-chip',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'Wire a real logic chip (74-series on a breadboard)',
  description:
    'A 14-pin 74HC chip on a breadboard, with red and blue supply rails, the notch and pin-1 dot, and every pin labelled with its datasheet name. The learner picks a lead (a switch, +5 V, ground, the LED or a jumper) and clicks pins to connect it, and the wiring is evaluated as a real netlist: the chip works only with +5 V on pin 14 and ground on pin 7, and reversed supply, a switch driving an output, an LED on an input and floating inputs are all caught and named. Six chips are available with their true pinouts, including the 7402 NOR whose outputs come first. The challenge is AND from a single 7400, which needs a jumper between two gates.',
  schema: z.object({
    chip: z
      .enum(['7400', '7402', '7404', '7408', '7432', '7486'])
      .default('7400')
      .describe(
        'The chip on the board. The prediction question describes an unpowered 7400, so keep 7400 in any lesson that runs it; learners can switch chips themselves.',
      ),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12', 'undergraduate'],
    outcomes: ['digital-logic', 'breadboard', 'pinout', 'lab-skills'],
    durationMinutes: 18,
    interaction: 'build',
    authorability: 'simple',
    representation: 'device',
    prerequisites: ['logic-gate'],
    related: ['logic-builder', 'logic-gate', 'binary-display'],
    starter: false,
  },
  experience: {
    objectives: [
      'Power a 74-series chip correctly: +5 V on pin 14, ground on pin 7',
      'Count pins from the notch and read a pinout to find a gate’s inputs and output',
      'Recognise the wiring faults that stop a circuit from working',
      'Build a function that needs two gates, using a jumper between pins',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
