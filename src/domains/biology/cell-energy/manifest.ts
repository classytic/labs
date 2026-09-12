import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'cell-energy',
  tag: 'CellEnergyLab',
  domain: 'biology',
  group: 'Cell biology',
  title: 'Cell energy and ATP budget',
  description:
    'Connect membrane delivery of glucose and oxygen to mitochondrial ATP production and ATP-consuming cellular work.',
  schema: z.object({
    glucose: z.number().min(0).max(10).default(6),
    oxygen: z.number().min(0).max(10).default(6),
    demand: z.number().min(0).max(10).default(5),
    fermentation: z.boolean().default(true),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['biology', 'respiration', 'mitochondria', 'ATP', 'fermentation'],
    durationMinutes: 20,
    interaction: 'guided',
    authorability: 'moderate',
    prerequisites: ['membrane-transport', 'respiration'],
    related: ['membrane-transport', 'respiration'],
  },
  experience: {
    objectives: [
      'Connect glucose and oxygen delivery to mitochondrial ATP production',
      'Identify the limiting respiratory input',
      'Relate ATP supply to active cellular work',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
