import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivityStepSchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'reorder-point',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Stock control, when to reorder (sawtooth)',
  description:
    'A progressive inventory-policy simulation: first read one clean sawtooth and predict the reorder trigger, then protect service through a visible three-day demand spike and transfer the same policy to a late supplier. The deterministic engine reports demand served, lost units, average stock, and orders placed without turning the lesson into a dashboard. Author the operating assumptions, starting transfer scenario, and sequence.',
  schema: z.object({
    usagePerDay: z.number().positive().finite().optional(),
    orderQty: z.number().positive().finite().optional(),
    leadTimeDays: z.number().int().positive().optional(),
    bufferStock: z.number().nonnegative().finite().optional(),
    unitLabel: z.string().trim().min(1).optional(),
    days: z.number().int().min(10).optional().describe('days to simulate'),
    scenario: z
      .enum(['steady', 'demand-spike', 'supplier-delay'])
      .optional()
      .describe('scenario opened in the transfer step'),
    guided: z.boolean().optional(),
    steps: z.array(authoredActivityStepSchema).min(1).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['finance', 'inventory'],
    durationMinutes: 15,
    interaction: 'guided',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Calculate a reorder point from lead-time demand and safety stock',
      'Distinguish the ordering trigger from the safety buffer',
      'Stress-test service under changed demand and lead time',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
