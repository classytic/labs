import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { deckSchema } from '../../../schemas/index.js';
import { DEMO_DECK } from '../shared.js';
import { commonLabProps } from '../../../shared/fields.js';

const matchDeck = deckSchema.extend({ items: deckSchema.shape.items.min(2).max(40) });

export default defineLab({
  id: 'word-match',
  tag: 'WordMatch',
  domain: 'language',
  group: 'Language',
  title: 'Word match (vocab pairs)',
  description: 'Tap to pair each word with its meaning, or its picture (kids/concrete). Reads a vocab deck.',
  schema: z.object({
    deck: matchDeck.default(DEMO_DECK),
    count: z.number().int().min(2).max(12).optional(),
    show: z.enum(['translation', 'icon']).default('translation'),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['3', '4', '5', '6'],
    outcomes: ['esl', 'vocabulary'],
    durationMinutes: 8,
    interaction: 'build',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Recall authored word meanings before selecting a pair',
      'Revise mismatched pairs using immediate non-revealing feedback',
      'Complete and transfer a vocabulary set across text or image representations',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
