import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { deckSchema } from '../../../schemas/index.js';
import { DEMO_DECK } from '../shared.js';
import { commonLabProps } from '../../../shared/fields.js';

const practiceDeck = deckSchema.extend({ items: deckSchema.shape.items.max(40) });

export default defineLab({
  id: 'dictation',
  tag: 'Dictation',
  domain: 'language',
  group: 'Language',
  title: 'Dictation (hear & type)',
  description:
    'Play a word or phrase and type what you hear (listening + spelling). Reads a vocab deck; checking is case/punctuation-forgiving.',
  schema: z.object({
    deck: practiceDeck.default(DEMO_DECK),
    showMeaning: z.boolean().default(false),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['4', '5', '6', '7'],
    outcomes: ['esl', 'listening', 'spelling'],
    durationMinutes: 8,
    interaction: 'build',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Decode an authored word or phrase from audio before relying on spelling',
      'Type and revise the heard form using language-aware normalization',
      'Apply the listening-and-spelling strategy across multiple unseen deck items',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['text'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
