import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

/** A series-loop component, discriminated on `type` (mirrors CircuitComponent in
 *  src/circuits/circuit-builder.tsx). Edited via the custom loadAuthoring list. */
const circuitComponentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('resistor'),
    ohms: z.number().positive().max(1_000_000).finite(),
    label: z.string().trim().min(1).optional(),
  }),
  z.object({
    type: z.literal('bulb'),
    ohms: z.number().positive().max(1_000_000).finite(),
    label: z.string().trim().min(1).optional(),
  }),
  z.object({
    type: z.literal('switch'),
    closed: z.boolean().optional(),
    label: z.string().trim().min(1).optional(),
  }),
]);

export default defineLab({
  id: 'circuit-builder',
  domain: 'circuits',
  group: 'Circuits',
  title: 'Circuit builder (play)',
  description: 'Build a loop, battery, bulbs, switches, resistors. Flip switches, watch current & the bulb.',
  schema: z.object({
    battery: z.number().min(1).max(24).finite().optional(),
    components: z.array(circuitComponentSchema).min(1).max(16).optional(),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    height: z.number().int().min(240).max(720).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['electronics', 'circuits'],
    durationMinutes: 12,
    interaction: 'build',
    authorability: 'moderate',
    representation: 'schematic',
    prerequisites: ['circuit'],
    related: ['circuit-scene', 'circuit-lab'],
  },
  experience: {
    objectives: [
      'Complete a conductive loop from an authored component set',
      'Observe how resistance and source voltage change current',
      'Transfer series-circuit reasoning to a changed component',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
