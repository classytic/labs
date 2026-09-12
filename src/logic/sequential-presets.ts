import type { SequentialLogicDoc } from './sequential.js';

export interface SequentialPreset {
  title: string;
  description: string;
  clock?: string;
  doc: SequentialLogicDoc;
}

const input = (id: string, label: string, value = false) => ({ id, label, value });

export const SEQUENTIAL_PRESETS = {
  'sr-latch': {
    title: 'The bit that remembers',
    description: 'Set a bit, release the input, and see the cross-coupled latch retain it.',
    doc: {
      inputs: [input('set', 'Set'), input('reset', 'Reset')],
      gates: [],
      cells: [{ id: 'q', kind: 'sr-latch', set: 'set', reset: 'reset' }],
      outputs: [
        { id: 'q-out', in: 'q', label: 'Q' },
        { id: 'not-q', in: 'q.notQ', label: 'Q̅' },
      ],
    },
  },
  'd-flip-flop': {
    title: 'Capture one bit on an edge',
    description: 'Change D freely. Q updates only when the clock rises.',
    clock: 'clock',
    doc: {
      inputs: [input('d', 'Data'), input('clock', 'Clock')],
      gates: [],
      cells: [{ id: 'q', kind: 'd-flip-flop', d: 'd', clock: 'clock' }],
      outputs: [{ id: 'q-out', in: 'q', label: 'Q' }],
    },
  },
  counter: {
    title: 'Build a binary counter',
    description: 'Each rising clock edge advances the stored binary number.',
    clock: 'clock',
    doc: {
      inputs: [input('clock', 'Clock'), input('enable', 'Enable', true), input('reset', 'Reset')],
      gates: [],
      cells: [{ id: 'count', kind: 'counter', width: 4, clock: 'clock', enable: 'enable', reset: 'reset' }],
      outputs: Array.from({ length: 4 }, (_, bit) => ({
        id: `q${bit}`,
        in: `count[${bit}]`,
        label: `Q${bit}`,
      })),
    },
  },
  'shift-register': {
    title: 'Move a bit through memory',
    description: 'Choose the serial input, then pulse the clock to shift it through four stages.',
    clock: 'clock',
    doc: {
      inputs: [input('serial', 'Serial in'), input('clock', 'Clock'), input('enable', 'Enable', true)],
      gates: [],
      cells: [
        {
          id: 'shift',
          kind: 'shift-register',
          width: 4,
          clock: 'clock',
          serialIn: 'serial',
          enable: 'enable',
        },
      ],
      outputs: Array.from({ length: 4 }, (_, bit) => ({
        id: `q${bit}`,
        in: `shift[${bit}]`,
        label: `Q${bit}`,
      })),
    },
  },
  'traffic-light': {
    title: 'A traffic light is memory plus rules',
    description: 'Advance one clock edge at a time and inspect the state transition.',
    clock: 'clock',
    doc: {
      inputs: [input('clock', 'Clock'), input('timer', 'Timer elapsed', true), input('reset', 'Reset')],
      gates: [],
      cells: [
        {
          id: 'controller',
          kind: 'fsm',
          clock: 'clock',
          reset: 'reset',
          initial: 'red',
          states: ['red', 'red-amber', 'green', 'amber'],
          transitions: [
            { from: 'red', to: 'red-amber', when: { timer: true } },
            { from: 'red-amber', to: 'green', when: { timer: true } },
            { from: 'green', to: 'amber', when: { timer: true } },
            { from: 'amber', to: 'red', when: { timer: true } },
          ],
        },
      ],
      outputs: [
        { id: 'red', in: 'controller.red', label: 'Red' },
        { id: 'red-amber', in: 'controller.red-amber', label: 'Red + amber' },
        { id: 'green', in: 'controller.green', label: 'Green' },
        { id: 'amber', in: 'controller.amber', label: 'Amber' },
      ],
    },
  },
} satisfies Record<string, SequentialPreset>;

export type SequentialPresetKey = keyof typeof SEQUENTIAL_PRESETS;

export function sequentialPreset(key: SequentialPresetKey): SequentialPreset {
  return structuredClone(SEQUENTIAL_PRESETS[key]);
}
