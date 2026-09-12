import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'le-chatelier',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Le Chatelier: equilibrium shifts',
  description:
    'A reversible reaction A ⇌ νB at equilibrium (Q = K). Stress it, add a species, compress, heat, and it shifts to oppose the change (shift direction emerges from the core, never hardcoded). AUTHOR YOUR OWN reaction: set the species names, product coefficient, colours, K, and whether the forward reaction is endothermic. Defaults to N₂O₄ ⇌ 2 NO₂ (colourless ⇌ brown).',
  schema: z.object({
    reactantName: z.string().optional().describe('left species, e.g. N₂O₄'),
    productName: z.string().optional().describe('right species, e.g. NO₂'),
    productCoeff: z.number().optional().describe('ν in A ⇌ νB (default 2)'),
    productColor: z.string().optional().describe('CSS colour the flask tints toward as product forms'),
    reactantColor: z.string().optional(),
    K: z.number().optional().describe('equilibrium constant at room temperature'),
    endothermic: z
      .boolean()
      .optional()
      .describe('forward reaction endothermic → heating makes more product (default true)'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Compare reaction quotient Q with equilibrium constant K to predict shift direction',
      'Explain concentration, pressure and temperature stresses using the authored reaction',
      'Distinguish a change in equilibrium position from a change in K',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['chemistry', 'equilibrium', 'le-chatelier'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
});
