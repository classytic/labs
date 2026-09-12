import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { agreementItemSchema, languageTagSchema } from '../../../schemas/index.js';
import { DEMO_AGREE } from '../shared.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'agreement',
  tag: 'Agreement',
  domain: 'language',
  group: 'Language',
  title: 'Agreement (subject ↔ verb)',
  description: 'Pick the verb form that matches the subject, covers 3rd-sg -s and the dropped copula.',
  schema: z.object({
    items: z.array(agreementItemSchema).min(1).max(40).default(DEMO_AGREE),
    lang: languageTagSchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['6', '7', '8', '9'],
    outcomes: ['esl', 'grammar', 'subject-verb-agreement'],
    durationMinutes: 10,
    interaction: 'build',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Choose a verb form that agrees with an authored subject',
      'Use targeted feedback to distinguish number and person patterns',
      'Apply agreement across multiple sentence contexts',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
