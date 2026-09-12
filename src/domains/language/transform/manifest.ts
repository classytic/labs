import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { transformTileSchema, languageTagSchema } from '../../../schemas/index.js';
import { DEMO_TRANSFORM_FROM, DEMO_TRANSFORM_TO } from '../shared.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'transform',
  tag: 'Transform',
  domain: 'language',
  group: 'Language',
  title: 'Transform (statement → question / tense)',
  description:
    'Rebuild a sentence into its transformed form; the changed words are highlighted (do-support, tense…).',
  schema: z.object({
    from: z.array(transformTileSchema).min(1).max(40).default(DEMO_TRANSFORM_FROM),
    to: z.array(transformTileSchema).min(1).max(40).default(DEMO_TRANSFORM_TO),
    instruction: z.string().optional(),
    note: z.string().optional(),
    lang: languageTagSchema.optional(),
    targetDir: z.enum(['ltr', 'rtl']).default('ltr'),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['7', '8', '9', '10'],
    outcomes: ['esl', 'grammar', 'transformation'],
    durationMinutes: 10,
    interaction: 'build',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Rebuild an authored sentence under a grammatical transformation',
      'Identify the words introduced or changed by the transformation',
      'Transfer the transformation rule to a new sentence form',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['ordering'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
