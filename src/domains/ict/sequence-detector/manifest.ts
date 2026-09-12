import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'sequence-detector',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'A machine that finds a pattern (Moore sequence detector)',
  description:
    'A Moore state machine generated from the pattern it detects, so choosing four bits produces a new machine with its own arrows. States sit in a row ordered by how much of the pattern they have matched: a match moves right, a loop above changes nothing, and an arc below lands on whatever part of the pattern is still usable, drawn deeper the further back it goes. The learner feeds bits, follows the highlighted arrow, and sees every detection marked on an input tape, with a switch between overlapping and non-overlapping detection on the same input.',
  schema: z.object({
    pattern: z
      .string()
      .regex(/^[01]{2,4}$/, 'two to four bits, for example 101')
      .default('101'),
    overlap: z.boolean().default(true),
    machine: z.enum(['moore', 'mealy']).default('moore'),
    // No default on purpose: when absent, the lab opens on exactly one match of the pattern, which
    // is the moment its prediction question asks about. A schema default of '' would erase that.
    input: z
      .string()
      .regex(/^[01]{0,18}$/, 'up to 18 bits of starting input')
      .optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12', 'undergraduate'],
    outcomes: ['digital-logic', 'state-machine', 'sequence-detector', 'moore-machine'],
    durationMinutes: 18,
    interaction: 'build',
    authorability: 'simple',
    representation: 'graph',
    prerequisites: ['binary-counter'],
    related: ['binary-counter', 'latch-vs-flip-flop', 'switch-learning'],
    starter: false,
  },
  experience: {
    objectives: [
      'Build the states of a sequence detector from the pattern it detects',
      'Explain where a wrong bit sends the machine, and why it is not always the start',
      'Distinguish overlapping from non-overlapping detection on the same input',
      'Design and test a detector for a pattern of your own',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
