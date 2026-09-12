import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { prepItemSchema, languageTagSchema } from '../../../schemas/index.js';
import { DEMO_PREP } from '../shared.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'preposition',
  tag: 'Preposition',
  domain: 'language',
  group: 'Language',
  title: 'Preposition scene (in / on / at)',
  description:
    'Pick the preposition that matches a spatial picture, teaches "before the noun" vs Bangla postpositions.',
  schema: z.object({
    items: z.array(prepItemSchema).min(1).max(40).default(DEMO_PREP),
    lang: languageTagSchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['5', '6', '7', '8'],
    outcomes: ['esl', 'grammar', 'prepositions'],
    durationMinutes: 10,
    interaction: 'build',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Infer a spatial relation from an authored accessible scene',
      'Place the matching English preposition before its noun phrase',
      'Transfer spatial language across multiple figures and landmarks',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
