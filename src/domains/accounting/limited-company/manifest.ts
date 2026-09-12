import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'limited-company',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Limited liability (sole trader vs limited company)',
  description:
    'Why people incorporate: a business fails owing money, sells its assets to pay creditors, and the shortfall is where structure matters. A sole trader is personally liable (the shortfall reaches their home and savings); a limited company is a separate legal person, so shareholders lose only their investment. Toggle the structure and watch personal exposure switch between "at risk" and "protected". Author the amounts + currency. Predict-first, curriculum-neutral.',
  schema: z.object({
    businessAssets: z.number().nonnegative().finite().min(0).max(100000).optional(),
    businessDebt: z.number().nonnegative().finite().min(0).max(100000).optional(),
    personalAssets: z.number().nonnegative().finite().min(0).max(150000).optional(),
    structure: z.enum(['sole', 'ltd']).optional(),
    currency: z.string().trim().min(1).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['finance', 'business-structure'],
    durationMinutes: 10,
    interaction: 'predict',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Trace creditor recovery from business assets to a shortfall',
      'Compare personal exposure under sole trader and limited-company structures',
      'Transfer limited-liability reasoning to changed debt and asset values',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
