import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'kinetics',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Reaction kinetics (collisions + Arrhenius)',
  description:
    'A vessel of molecules where only high-energy collisions (≥ Eₐ) succeed and convert A→B, beside the Maxwell–Boltzmann energy spread (shaded reactive tail) and a live A/B bar. Heat it or add a catalyst (lowers Eₐ) and watch the rate jump, backed by k = A·e^(−Eₐ/RT). Author the activation energy, rate, order, molecule count and temperature; ships a predict-first question.',
  schema: z.object({
    EaKJ: z.number().optional().describe('activation energy, kJ/mol'),
    kRef: z.number().optional().describe('rate constant at 300 K (sets the pace)'),
    order: z
      .union([z.literal(0), z.literal(1), z.literal(2)])
      .optional()
      .describe('reaction order for the half-life readout'),
    // Runtime clamp (no slider): N = clamp(molecules, 6, 60).
    molecules: z.number().min(6).max(60).optional().describe('molecules in the vessel (6–60)'),
    T0: z.number().min(260).max(400).optional().describe('initial temperature, K'),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['chemistry', 'kinetics', 'arrhenius'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Predict how temperature changes the reactive energy fraction',
      'Connect successful collisions to rate and product formation',
      'Distinguish heating from catalytic lowering of activation energy',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
