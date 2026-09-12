import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { articleItemSchema, languageTagSchema } from '../../../schemas/index.js';
import { DEMO_ARTICLES } from '../shared.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'article-lens',
  tag: 'ArticleLens',
  domain: 'language',
  group: 'Language',
  title: 'Article lens (a / an / the)',
  description: 'Pick the right article (a/an/the/none), built for the "Bangla has no articles" gap.',
  schema: z.object({
    items: z.array(articleItemSchema).min(1).max(40).default(DEMO_ARTICLES),
    lang: languageTagSchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['6', '7', '8', '9'],
    outcomes: ['esl', 'grammar', 'articles'],
    durationMinutes: 10,
    interaction: 'build',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Choose a, an, the, or no article from sentence meaning and sound',
      'Use corrective feedback to distinguish specificity, countability, and initial sound',
      'Transfer article selection across multiple authored noun phrases',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
