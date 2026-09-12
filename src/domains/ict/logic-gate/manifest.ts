import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'logic-gate',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'Logic gate circuit (propagation / predict)',
  description:
    'A data-driven gate network: wires glow where the signal is HIGH so learners watch it propagate. Pick a preset (AND…NAND universality, half/full adder), let them toggle inputs (explore) or predict the output, with a live truth table.',
  schema: z.object({
    preset: z
      .enum(['and', 'or', 'xor', 'nand-not', 'nand-and', 'nand-or', 'xor-nand', 'half-adder', 'full-adder'])
      .default('and'),
    mode: z.enum(['explore', 'predict']).default('explore'),
    steps: z.boolean().default(false),
    showTable: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Predict a preset gate network’s outputs from its inputs',
      'Follow HIGH and LOW signals through each stage',
      'Connect circuit behavior to truth tables, NAND universality and adder outputs',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['ict', 'digital-logic', 'logic-gates'],
    durationMinutes: 15,
    interaction: 'predict',
    authorability: 'moderate',
    representation: 'gate',
    prerequisites: ['binary-display'],
    related: ['truth-table', 'cmos-inverter'],
  },
  loadRuntime: () => import('./runtime.js'),
});
