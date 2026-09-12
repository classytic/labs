import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { deckSchema } from '../../../schemas/index.js';
import { DEMO_DECK } from '../shared.js';
import { commonLabProps } from '../../../shared/fields.js';

const practiceDeck = deckSchema.extend({ items: deckSchema.shape.items.min(2).max(40) });

export default defineLab({
  id: 'listening',
  tag: 'Listening',
  domain: 'language',
  group: 'Language',
  title: 'Listening (hear & choose)',
  description:
    'Play a word or phrase and pick what you hear (options show the word, its meaning, or a picture). Reads a vocab deck.',
  schema: z.object({
    deck: practiceDeck.default(DEMO_DECK),
    mode: z.enum(['word', 'meaning', 'picture']).default('word'),
    choices: z.number().int().min(2).max(6).default(4),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['3', '4', '5', '6'],
    outcomes: ['esl', 'listening', 'vocabulary'],
    durationMinutes: 8,
    interaction: 'build',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Listen before committing to a written, semantic, or visual choice',
      'Use corrective feedback to compare confusable sounds or meanings',
      'Generalize recognition across multiple authored deck items and representations',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
