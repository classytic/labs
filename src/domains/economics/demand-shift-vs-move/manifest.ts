import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'demand-shift-vs-move',
  domain: 'economics',
  group: 'Economics',
  title: 'Shift vs movement along (demand)',
  description:
    'Dragging price slides a dot ALONG a fixed demand curve (Δ quantity demanded); clicking a non-price TRIBE factor SHIFTS the whole curve (Δ demand) → new equilibrium. Predict-then-check the P/Q direction.',
  schema: z.object({
    askPrediction: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['economics', 'demand'],
    durationMinutes: 10,
    interaction: 'predict',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Distinguish movement along demand from a demand shift',
      'Forecast equilibrium direction after a non-price change',
      'Transfer the distinction across multiple scenarios',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
