import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'base-odometer',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'Base odometer (every base at once)',
  description:
    'Stacked odometer rows driven by one shared integer, binary/octal/decimal/hex roll in lockstep (binary fastest), proving base is a representation, not a different number. Race toggle animates the cascade.',
  schema: z.object({
    max: z.number().default(255),
    start: z.number().default(0),
    race: z.boolean().default(false),
    speed: z.number().default(2),
    highlightBase: z.number().optional(),
    target: z.number().optional(),
    /**
     * Which bases to show, and how many digits each wheel gets.
     *
     * The component has always accepted both, and the runtime re-exports it directly, so the props
     * reach it. The SCHEMA did not declare them, and an undeclared prop is dropped before it gets
     * that far. So a lesson authoring `bases={[2, 10]}` to contrast two bases was silently handed
     * all four, and a junior lesson that wants base 10 alone could not have it.
     */
    bases: z.array(z.number().int().min(2).max(36)).min(1).max(6).default([2, 8, 10, 16]),
    width: z.union([z.number().int().min(1).max(16), z.literal('auto')]).default('auto'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Recognize binary, octal, decimal and hexadecimal as representations of one value',
      'Predict when carries occur in different bases',
      'Convert an authored value by matching synchronized odometer states',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['ict', 'number-bases'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'number',
  },
  loadRuntime: () => import('./runtime.js'),
});
