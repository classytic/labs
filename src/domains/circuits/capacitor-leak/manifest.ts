import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'capacitor-leak',
  domain: 'circuits',
  group: 'Circuits',
  title: 'Capacitor: charge & leak (RC)',
  description:
    'A cell charges a capacitor through R; flip to "leak" and it self-discharges through its leakage resistance, the plate field thins, drips fall, Vc decays. Live Vc–t trace + τ readout.',
  schema: z.object({
    emf: z.number().min(1).max(12).finite().default(6),
    rK: z.number().min(1).max(100).finite().default(10),
    capU: z.number().min(10).max(1000).finite().default(100),
    leakK: z.number().min(20).max(1000).finite().default(200),
    startCharged: z.boolean().optional(),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    objectives: z.array(z.string().trim().min(1)).min(1).optional(),
    hints: z.array(z.string().trim().min(1)).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['electronics', 'capacitor', 'rc'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'graph',
    prerequisites: ['rc-charging'],
  },
  experience: {
    objectives: [
      'Predict exponential voltage remaining after one time constant',
      'Connect capacitor field, voltage and discharge trace',
      'Redesign charge retention by changing capacitance or leakage resistance',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
