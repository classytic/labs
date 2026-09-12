import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { errorItemSchema } from '../../../schemas/index.js';
import { DEMO_ERRORS } from '../shared.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'error-correct',
  tag: 'ErrorCorrect',
  domain: 'language',
  group: 'Language',
  title: 'Error correction (spot the mistake)',
  description:
    'A sentence with one mistake: tap the wrong word to see it corrected. Proofreading / meta-grammar (great for "He go", "a apple", "the childs").',
  schema: z.object({
    items: z.array(errorItemSchema).min(1).max(40).default(DEMO_ERRORS),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['7', '8', '9', '10'],
    outcomes: ['esl', 'grammar', 'error-correction'],
    durationMinutes: 10,
    interaction: 'build',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Identify one authored error within a complete sentence',
      'Compare functioning words with the corrected form in context',
      'Transfer proofreading attention across multiple grammatical patterns',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
