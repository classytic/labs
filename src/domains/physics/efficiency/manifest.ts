import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'efficiency',
  domain: 'physics',
  group: 'Physics',
  title: 'Efficiency, input→output ratio (Sankey)',
  description:
    'Efficiency as the fraction of energy that comes out useful: η = useful ÷ input, drawn as a Sankey energy flow that splits into a useful stream and wasted heat. Compare real devices (incandescent vs LED, engine vs motor) or AUTHOR your own breakdown via the streams field.',
  schema: z.object({
    device: z
      .enum(['incandescent', 'led', 'petrol-engine', 'electric-motor', 'power-station', 'human'])
      .optional(),
    deviceName: z.string().trim().min(1).max(80).optional(),
    inputJoules: z
      .number()
      .finite()
      .positive()
      .max(1_000_000)
      .optional()
      .describe('energy supplied, J (100 → shares read as %)'),
    inputLabel: z.string().trim().min(1).max(80).optional(),
    streams: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(80),
          share: z.number().finite().positive().max(1_000_000),
          kind: z.enum(['useful', 'waste']),
          color: z.string().trim().min(1).max(80).optional(),
        }),
      )
      .min(1)
      .max(8)
      .optional()
      .describe('author your own energy breakdown'),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['energy', 'efficiency'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Calculate efficiency as useful output divided by input',
      'Read ribbon width as an energy share',
      'Compare useful and wasted outputs across devices',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
