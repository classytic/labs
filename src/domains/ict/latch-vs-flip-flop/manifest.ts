import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'latch-vs-flip-flop',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'When does it look at D? (D latch against D flip-flop)',
  description:
    'The classic timing-diagram question as something to push on. One D waveform and one clock drive a D latch and a positive-edge-triggered D flip-flop side by side, both simulated by the same sequential engine. Rising edges are drawn through every row, the latch row is tinted wherever it is transparent, and the slots where the two outputs disagree are shaded: that shading is the exam answer. The outputs stay hidden until the learner predicts, the D row is drawn by tapping slots, and the challenge is to draw a D both circuits read identically, which can only be done by changing D while the clock is low.',
  schema: z.object({
    d: z
      .array(z.boolean())
      .max(24)
      .optional()
      .describe(
        'Starting D waveform, one entry per slot. The prediction question describes the default waveform (a pulse at 13 to 14), so leave this unset in any lesson that runs the prediction.',
      ),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12', 'undergraduate'],
    outcomes: ['digital-logic', 'sequential-logic', 'flip-flop', 'timing-diagram'],
    durationMinutes: 16,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'graph',
    prerequisites: ['sr-latch'],
    related: ['sr-latch', 'logic-gate'],
    starter: false,
  },
  experience: {
    objectives: [
      'Draw Q for a D latch and for a positive-edge-triggered D flip-flop from the same D and clock',
      'Explain why a pulse inside a clock-high window reaches one output and not the other',
      'Design a D waveform for which the two circuits agree everywhere',
      'Explain why registers are built from flip-flops rather than latches',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
