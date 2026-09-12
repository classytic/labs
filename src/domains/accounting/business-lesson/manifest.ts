import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { sceneSchema, bizStateSchema } from './schema.js';

export default defineLab({
  id: 'business-lesson',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Run a business (story lesson)',
  description:
    'A Quantic-style "run a business" story: the learner makes one decision at a time (invest, buy stock, price a product, sell, pay costs) and a live set of books responds, cash, income statement, and a balance sheet that always balances. The SCENARIO is authored by the creator as a scene script (narrate / decide / predict / report), so any business (stall, shop, startup) can be built. Powered by the bizsim engine; scales to full financial analysis.',
  schema: z.object({
    scenes: z
      .array(sceneSchema)
      .min(1)
      .optional()
      .describe('the authored scene script (narrate / decide / predict / report steps)'),
    init: bizStateSchema.optional().describe('starting books, e.g. { cash: 0 }'),
    currency: z.string().trim().min(1).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['finance', 'business-simulation'],
    durationMinutes: 25,
    interaction: 'guided',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Connect business decisions to cash, profit and financial position',
      'Read reports generated from balanced authored transactions',
      'Transfer accounting reasoning across an authored business story',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
