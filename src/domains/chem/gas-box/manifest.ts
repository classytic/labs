import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'gas-box',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Gas box (PV = nRT, kinetic theory)',
  description:
    'Hundreds of molecules bounce in a box; drag the piston (V), heat it (T), add molecules (n), pressure is MEASURED from wall collisions, so PV=nRT emerges. Lock T/V/P for Boyle/Gay-Lussac/Charles.',
  schema: z.object({
    holdConstant: z.enum(['none', 'temperature', 'volume', 'pressure']).default('none'),
    particleCount: z.number().default(180),
    temperature: z.number().default(300),
    volume: z.number().default(7),
    showGauge: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Explain gas pressure using particle collisions with container walls',
      'Predict how pressure responds to changes in temperature, volume or particle amount',
      'Recover Boyle’s, Charles’s and pressure-law relationships from constrained trials',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['chemistry', 'gas-laws', 'kinetic-theory'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
