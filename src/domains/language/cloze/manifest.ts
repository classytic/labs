import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { clozeItemSchema, languageTagSchema } from '../../../schemas/index.js';
import { DEMO_CLOZE } from '../shared.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'cloze',
  tag: 'Cloze',
  domain: 'language',
  group: 'Language',
  title: 'Cloze (fill the gap)',
  description:
    'Complete a sentence by tapping words into its blanks (grammar/vocab in context). Mark each blank with ___ in the text.',
  schema: z.object({
    items: z.array(clozeItemSchema).min(1).max(40).default(DEMO_CLOZE),
    lang: languageTagSchema.optional().describe("sentence language for audio, e.g. 'en-US'"),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['6', '7', '8', '9'],
    outcomes: ['esl', 'grammar', 'cloze'],
    durationMinutes: 8,
    interaction: 'build',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Complete contextual blanks using a constrained word bank',
      'Revise misplaced choices through reversible slot interaction',
      'Transfer grammar and vocabulary patterns across authored sentences',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['ordering'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
