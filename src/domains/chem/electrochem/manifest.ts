import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'electrochem',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Galvanic cell (Nernst EMF)',
  description:
    'A voltaic cell with two metal half-cells, a salt bridge, and a live voltmeter. The lower-E° metal is the anode (−); electrons flow to the cathode (+). The meter reads the Nernst EMF E = E°cell − (RT/nF)·ln Q, so changing an ion concentration moves the voltage, or pick the same metal both sides for a concentration cell. Author the two electrodes + concentrations.',
  schema: z.object({
    metalA: z.enum(['Mg', 'Al', 'Zn', 'Fe', 'Ni', 'Pb', 'Cu', 'Ag']).optional(),
    metalB: z.enum(['Mg', 'Al', 'Zn', 'Fe', 'Ni', 'Pb', 'Cu', 'Ag']).optional(),
    concA: z.number().min(0.001).max(2).optional().describe('electrode 1 ion concentration, mol/L'),
    concB: z.number().min(0.001).max(2).optional().describe('electrode 2 ion concentration, mol/L'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Predict anode, cathode and electron-flow direction from reduction potentials',
      'Relate ion concentration and reaction quotient to Nernst cell voltage',
      'Distinguish a dissimilar-metal galvanic cell from a concentration cell',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['chemistry', 'electrochemistry', 'nernst'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
});
