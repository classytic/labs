import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'jk-flip-flop',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'What to do with both inputs high (JK and T flip-flops)',
  description:
    'A positive-edge JK flip-flop on the sequential engine, drawn as a timing diagram whose J and K rows the learner draws on. Under the waves, each rising edge is labelled with what happened there (set, hold, reset or toggle), so the characteristic table is read off the diagram rather than memorised beside it. Tying K to J turns it into a T flip-flop. The challenge is to make Q change at every edge, which reveals a divide-by-two counter stage, and the transfer question is the excitation table asked the way a designer uses it.',
  schema: z.object({
    tied: z.boolean().default(false),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12', 'undergraduate'],
    outcomes: ['digital-logic', 'sequential-logic', 'flip-flop', 'timing-diagram'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'graph',
    prerequisites: ['latch-vs-flip-flop'],
    related: ['sr-latch', 'latch-vs-flip-flop', 'binary-counter'],
    starter: false,
  },
  experience: {
    objectives: [
      'Read set, reset, hold and toggle off a JK timing diagram',
      'Explain how the JK flip-flop gives the SR latch’s forbidden input a use',
      'Make a flip-flop change state on every clock edge, and recognise it as a divide-by-two',
      'Use the excitation table to choose J and K for a required change',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
