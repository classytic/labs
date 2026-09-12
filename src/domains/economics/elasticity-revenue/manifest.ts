import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

const presetSchema = z.object({
  label: z.string().trim().min(1),
  slope: z.number().min(0.2).max(2.4).finite(),
});

export default defineLab({
  id: 'elasticity-revenue',
  domain: 'economics',
  group: 'Economics',
  title: 'Elasticity & total revenue',
  description:
    'Rotate the demand line (substitutes) from steep (inelastic) to flat (elastic); drag the price and watch the total-revenue rectangle + the point-elasticity flip elastic→unit→inelastic down a single straight line.',
  schema: z.object({
    pivotP: z.number().positive().finite().default(5).describe('price coordinate of the demand-line pivot'),
    pivotQ: z
      .number()
      .positive()
      .finite()
      .default(5)
      .describe('quantity coordinate of the demand-line pivot'),
    // The pivot and the axis maxima drive no slider (the only slider rotates the demand line,
    // seeded from a constant): the plot window is BUILT from priceMax/qtyMax, so it scales with them.
    priceMax: z.number().positive().finite().optional(),
    qtyMax: z.number().positive().finite().optional(),
    anchorPresets: z
      .array(presetSchema)
      .min(1)
      .optional()
      .describe('authored substitute cases shown beside the curve control'),
    height: z.number().int().min(240).max(720).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['economics', 'elasticity', 'revenue'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Distinguish point elasticity from demand-curve slope',
      'Connect elastic and inelastic demand to total-revenue changes',
      'Transfer elasticity reasoning across authored substitute cases',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
