import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

const cvec = z.object({ x: z.number().finite(), y: z.number().finite() });
const pinRef = z.object({ partId: z.string().trim().min(1), pin: z.string().trim().min(1) });
const cPart = z.object({
  id: z.string().trim().min(1),
  kind: z.string().trim().min(1),
  at: cvec,
  orient: z.enum(['h', 'v']).optional(),
  props: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).optional(),
  pins: z.record(z.string(), z.string().trim().min(1)),
});
const cDoc = z.object({
  parts: z.array(cPart).default([]),
  nodes: z.array(z.object({ id: z.string().trim().min(1), at: cvec })).default([]),
  wires: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        a: pinRef,
        b: pinRef,
        mid: z.array(cvec).optional(),
      }),
    )
    .optional(),
  size: z
    .object({ w: z.number().finite().min(240).max(2400), h: z.number().finite().min(160).max(1600) })
    .optional(),
});

/** The circuit is a placed-parts CircuitDoc built on a canvas, so it ships the drag/wire
 *  CircuitEditor via loadAuthoring; learners operate the stored doc through a CircuitPlayer. */
export default defineLab({
  id: 'circuit-scene',
  tag: 'CircuitScene',
  domain: 'circuits',
  group: 'Circuits',
  title: 'Circuit builder (canvas)',
  description:
    'Place parts on a canvas, drag to arrange, click pins to wire. Any topology (Kirchhoff), solved live. Learners tap switches to operate it.',
  schema: z.object({
    doc: cDoc.optional(),
    title: z.string().trim().min(1).optional(),
    flow: z.boolean().optional(),
    ariaLabel: z.string().trim().min(1).optional(),
  }),
  experience: {
    objectives: [
      'Interpret an authored circuit document as components, nodes and wires',
      'Operate switches and trace current through a solved topology',
      'Apply Kirchhoff reasoning to explain voltages and currents after a circuit change',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['electronics', 'circuits', 'kirchhoff'],
    durationMinutes: 20,
    interaction: 'build',
    authorability: 'advanced',
    representation: 'schematic',
    prerequisites: ['circuit'],
    related: ['circuit-builder', 'circuit-lab'],
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
