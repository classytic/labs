import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'stoichiometry',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Stoichiometry (limiting reagent)',
  description:
    'A balanced reaction as a recipe: reactants are trays of molecule tokens, the consumed part solid and the leftover faded, so the limiting reagent is the tray that empties (highlighted) and excess shows as faded tokens. The product tray fills with what forms. Backed by solveStoichiometry (extent, limiting reagent, moles/grams, leftovers). Pick a reaction (water/ammonia/methane/rust) or author your own; drag the amounts.',
  schema: z.object({
    reaction: z.enum(['water', 'ammonia', 'methane', 'rust']).optional(),
    amounts: z.array(z.number()).optional().describe('reactant amounts in mol (aligned with the reaction)'),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['chemistry', 'stoichiometry', 'limiting-reagent'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict the rule that identifies the limiting reagent',
      'Account for consumed and leftover reactants',
      'Transfer mole-ratio reasoning to another reaction',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
