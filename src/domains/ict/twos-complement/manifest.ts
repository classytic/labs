import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'twos-complement',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'Negative numbers without a minus sign (two’s complement)',
  description:
    'The sixteen 4-bit patterns round a wheel, with the top half read as −8 to −1, beside a bit-by-bit ripple adder’s working. Adding is walking clockwise; the line between 7 and −8 is drawn in red, and an arc that crosses it is overflow, detected the way hardware does it (carry into the top bit differing from carry out). Negation is a mirror across the wheel, which derives "invert and add one" and shows why −8 has no partner. Subtraction runs on the same adder by adding the negation.',
  schema: z.object({
    // The prediction asks about 0111 + 0001, so a lesson that runs it should leave a, b and
    // operation at their defaults; learners change them on the wheel.
    a: z
      .number()
      .int()
      .min(-8)
      .max(7)
      .default(7)
      .describe('Keep at 7 while the lab asks its 7 + 1 prediction.'),
    b: z.number().int().min(-8).max(7).default(1),
    operation: z.enum(['add', 'subtract', 'negate']).default('add'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12', 'undergraduate'],
    outcomes: ['digital-logic', 'number-systems', 'twos-complement', 'overflow'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'number',
    prerequisites: ['place-value-dial'],
    related: ['bit-grouper', 'place-value-dial', 'logic-gate'],
    starter: false,
  },
  experience: {
    objectives: [
      'Read a 4-bit pattern as a two’s complement value from −8 to 7',
      'Explain overflow as crossing the line between 7 and −8',
      'Derive "invert and add one" as the mirror image on the wheel',
      'Subtract by adding the negation on the same adder',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
