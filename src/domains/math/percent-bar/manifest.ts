import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'percent-bar',
  domain: 'math',
  group: 'Math',
  title: 'Percentage bar',
  description:
    'A bar is the whole (100%); drag the fill to a target percent and read both the percent and the amount (percent × whole). Author any analogy via whole + unit + an optional segment breakdown.',
  schema: z.object({
    whole: z.number().default(100),
    unit: z.string().default(''),
    target: z.number().optional(),
    start: z.number().default(0),
    snapPct: z.number().positive().default(5),
    showValue: z.boolean().default(true),
    referenceLabel: z.string().optional(),
    segments: z
      .array(
        z.object({
          frac: z.number().nonnegative(),
          label: z.string().optional(),
          color: z.string().optional(),
        }),
      )
      .optional(),
    scene: z.string().default('none'),
    height: z.number().min(180).max(640).optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  omit: ['activity'],
  experience: {
    objectives: [
      'Interpret the full bar as one whole or 100 percent',
      'Connect a percentage fill to its amount for an authored whole',
      'Transfer percentage reasoning across segmented real-world contexts',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['6', '7', '8'],
    outcomes: ['math', 'percentages'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
