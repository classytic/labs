import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { sentenceTileSchema, languageTagSchema } from '../../../schemas/index.js';
import { DEMO_SENTENCE } from '../shared.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'sentence-builder',
  tag: 'SentenceBuilder',
  domain: 'language',
  group: 'Language',
  title: 'Sentence builder (word order)',
  description:
    'Order colour-coded word tiles into a correct sentence, visualizes word order (great for SOV→SVO).',
  schema: z.object({
    tiles: z.array(sentenceTileSchema).min(2).max(40).default(DEMO_SENTENCE),
    promptDir: z.enum(['ltr', 'rtl']).default('ltr'),
    targetDir: z.enum(['ltr', 'rtl']).default('ltr'),
    lang: languageTagSchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['6', '7', '8', '9'],
    outcomes: ['esl', 'grammar', 'word-order'],
    durationMinutes: 8,
    interaction: 'build',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Construct an authored sentence from reversible word tiles',
      'Use grammatical and semantic cues to revise word order',
      'Transfer the target word-order pattern to a new sentence',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['ordering'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
