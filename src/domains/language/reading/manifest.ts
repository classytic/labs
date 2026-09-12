import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { readingQuestionSchema, glossEntrySchema } from '../../../schemas/index.js';
import { DEMO_READING_PASSAGE, DEMO_READING_Q } from '../shared.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'reading',
  tag: 'Reading',
  domain: 'language',
  group: 'Language',
  title: 'Reading (passage + questions)',
  description:
    'A short passage with comprehension questions (multiple choice), plus an optional L1 glossary. Blank lines separate paragraphs.',
  schema: z.object({
    passage: z.string().trim().min(1).max(12000).default(DEMO_READING_PASSAGE),
    questions: z.array(readingQuestionSchema).min(1).max(20).default(DEMO_READING_Q),
    gloss: z.array(glossEntrySchema).max(80).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['6', '7', '8', '9'],
    outcomes: ['esl', 'reading', 'comprehension'],
    durationMinutes: 12,
    interaction: 'build',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Read an authored passage for meaning before answering',
      'Support each answer with evidence from the passage',
      'Transfer the reading strategy across multiple comprehension questions',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
