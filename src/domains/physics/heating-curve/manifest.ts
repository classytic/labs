import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'heating-curve',
  domain: 'physics',
  group: 'Physics',
  title: 'Heating curve, q=mcΔθ runs + latent plateaus',
  description:
    'Pour heat into ice and watch temperature climb in steps: sloped runs where a phase warms (q=mcΔθ) and flat plateaus where it melts/boils (q=mL). Burner + beaker + thermometer beside the live curve. AUTHOR the model: pick a preset OR declare a custom substance (specific + latent heats, melt/boil points) and the starting mass/power.',
  schema: z.object({
    substance: z.enum(['water', 'ethanol']).optional().describe('preset to start from'),
    substanceName: z.string().optional().describe('custom substance name (overrides the preset)'),
    cSolid: z.number().optional(),
    cLiquid: z.number().optional(),
    cGas: z.number().optional(),
    lFusion: z.number().optional().describe('latent heat of fusion, J/g'),
    lVapor: z.number().optional().describe('latent heat of vaporisation, J/g'),
    tMelt: z.number().optional(),
    tBoil: z.number().optional(),
    mass: z.number().optional().describe('initial sample mass, g'),
    power: z.number().optional().describe('initial heating power, W (negative cools)'),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11'],
    outcomes: ['heat', 'latent-heat', 'specific-heat'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Distinguish warming slopes from phase-change plateaus',
      'Select the correct energy model',
      'Transfer the model to a different mass',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
