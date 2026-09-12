import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'market-equilibrium',
  domain: 'economics',
  group: 'Economics',
  title: 'Supply & demand equilibrium',
  description:
    'Drag the price across fixed demand + supply lines; the lab shades the surplus (amber, above eq) or shortage (red, below eq) gap and marks where the market clears. Shift sliders move both P* and Q*. Author the curve parameters.',
  schema: z.object({
    // The lab draws on a FIXED price axis (priceMax = 10 in the runtime, not authorable here)
    // and clamps the draggable price to 0.4–9.6, so both intercepts are prices on that axis.
    // The slopes drive no slider and no clamp: they only tilt the lines, so they stay open.
    demandIntercept: z.number().min(0).max(10).default(9),
    demandSlope: z.number().default(0.8),
    supplyIntercept: z.number().min(0).max(10).default(1),
    supplySlope: z.number().default(0.7),
    shiftDemand: z.boolean().default(true),
    shiftSupply: z.boolean().default(true),
    goodLabel: z.string().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['economics', 'supply-demand'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict price pressure from surplus or shortage',
      'Clear the market by matching quantity demanded and supplied',
      'Transfer equilibrium reasoning after a curve shift',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
