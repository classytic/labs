import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'depreciation',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Depreciation (straight-line vs reducing-balance)',
  description:
    'How an asset loses value: straight-line writes off an equal slice each year (a straight fall to residual), reducing-balance takes a fixed % of the shrinking book value (front-loaded). Both book-value paths are drawn together, with yearly charge bars and a fading asset. Author cost, residual, rate, life, method, currency; predict-first. Curriculum-neutral.',
  schema: z
    .object({
      cost: z.number().positive().finite().optional(),
      residual: z.number().nonnegative().finite().optional().describe('scrap/residual value'),
      ratePct: z.number().positive().max(100).finite().optional().describe('reducing-balance rate, %'),
      life: z.number().int().min(1).max(50).optional().describe('useful life, years'),
      method: z.enum(['straight', 'reducing']).optional(),
      currency: z.string().trim().min(1).optional(),
      assetLabel: z.string().trim().min(1).optional().describe('what the asset is, e.g. van'),
      ...commonLabProps,
    })
    .refine(({ cost, residual }) => cost == null || residual == null || residual < cost, {
      message: 'residual must be less than cost',
      path: ['residual'],
    }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['finance', 'depreciation'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Compare straight-line and reducing-balance book-value paths',
      'Choose a depreciation method from its profit impact',
      'Transfer the comparison across an authored asset life',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
