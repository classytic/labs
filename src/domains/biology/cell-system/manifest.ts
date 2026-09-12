import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'cell-system',
  tag: 'CellSystemLab',
  domain: 'biology',
  group: 'Cell biology',
  title: 'Cell systems and protein secretion',
  description:
    'Trace a secreted protein through nucleus, ribosome, rough ER, Golgi, vesicle, and membrane; diagnose organelle failures.',
  schema: z.object({
    step: z.enum(['nucleus', 'ribosome', 'rough-er', 'golgi', 'vesicle', 'membrane']).default('nucleus'),
    failure: z.enum(['none', 'nucleus', 'ribosome', 'rough-er', 'golgi', 'vesicle']).default('none'),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['biology', 'cell', 'organelles', 'protein-synthesis', 'secretion'],
    durationMinutes: 22,
    interaction: 'guided',
    authorability: 'moderate',
    prerequisites: ['central-dogma', 'membrane-transport'],
    related: ['central-dogma', 'membrane-transport', 'cell-energy'],
  },
  experience: {
    objectives: [
      'Trace information and cargo through organelles',
      'Explain why secretion follows an ordered route',
      'Diagnose organelle failure from downstream evidence',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
