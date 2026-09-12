import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

const gateType = z.enum(['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR']);

/** A digital-system lab (gate-level computation), so it lives in ICT — not discrete maths. The id
 *  + tag (BooleanCircuit) are unchanged, so existing <BooleanCircuit> lesson content keeps working.
 *  It renders through the ONE shared digital-logic engine (src/logic), not a private evaluator. */
export default defineLab({
  id: 'logic-circuit',
  tag: 'BooleanCircuit',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'Logic circuit (gates → lamps)',
  description:
    'Author a netlist (switches, typed gates, output LEDs); learners flip switches and watch power flow light the outputs. Optional goal = a puzzle.',
  schema: z.object({
    inputs: z
      .array(z.union([z.string(), z.object({ id: z.string(), label: z.string().optional() })]))
      .default([])
      .describe('Input switches'),
    gates: z
      .array(z.object({ id: z.string(), type: gateType, in: z.array(z.string()) }))
      .default([])
      .describe('Logic gates and their wiring'),
    outputs: z
      .array(
        z.object({
          id: z.string(),
          in: z.string(),
          label: z.string().optional(),
          color: z.string().optional(),
          goal: z.boolean().optional(),
        }),
      )
      .default([])
      .describe('Output LEDs'),
    initial: z.record(z.string(), z.boolean()).optional().describe('Initial switch states'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Trace Boolean values through an authored gate netlist',
      'Predict output lamps before changing input switches',
      'Verify a circuit’s behavior across the relevant truth-table rows',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['digital-logic', 'logic-gates'],
    durationMinutes: 20,
    interaction: 'build',
    authorability: 'advanced',
    representation: 'gate',
    prerequisites: ['binary-display'],
    related: ['truth-table', 'cmos-inverter'],
  },
  loadRuntime: () => import('./runtime.js'),
});
