import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'sr-latch',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'Two gates that remember (the SR latch)',
  description:
    'An SR latch built from two cross-coupled NOR gates rather than shown as a box, so the reason it remembers is visible: with both inputs low, each gate is held by the other. The outputs are drawn against gate delays, which shows that a set is a chain (Q̅ falls, and only then does Q rise) and turns the forbidden release of S and R together into a square wave that never settles. The prediction question asks for Q with both inputs low, which has two correct answers depending on history.',
  schema: z.object({
    startSet: z.boolean().default(false),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12', 'undergraduate'],
    outcomes: ['digital-logic', 'sequential-logic', 'latch', 'feedback'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'gate',
    prerequisites: ['logic-gate'],
    related: ['logic-gate', 'logic-builder', 'truth-table'],
    starter: false,
  },
  experience: {
    objectives: [
      'Explain why a latch can give different outputs for the same inputs',
      'Trace a set through the two gates one gate delay at a time',
      'Say which wire is holding the stored bit when both inputs are low',
      'Explain why S and R must never be released together from both high',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
