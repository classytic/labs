import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'function-machine',
  domain: 'math',
  group: 'Math',
  tag: 'FunctionMachine',
  title: 'Function machine (find the rule)',
  description:
    'Inputs go in, outputs come out; the learner picks the rule that produces the outputs. The classic "guess my function" for building the idea of a mapping.',
  schema: z.object({
    title: z.string().optional(),
    prompt: z.string().optional(),
    inputs: z.array(z.union([z.string(), z.number()])).default([1, 2, 3, 4]),
    outputs: z.array(z.union([z.string(), z.number()])).default([3, 5, 7, 9]),
    choices: z.array(z.string()).default(['2x + 1', 'x + 2', '3x']),
    answer: z.string().default('2x + 1'),
    height: z.number().optional(),
  }),
  experience: {
    objectives: [
      'Treat a function as one rule mapping every input to an output',
      'Test candidate rules against multiple input-output pairs',
      'Use counterexamples to reject a rule that only fits some pairs',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['6', '7', '8'],
    outcomes: ['math', 'functions', 'mapping'],
    durationMinutes: 8,
    interaction: 'predict',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
