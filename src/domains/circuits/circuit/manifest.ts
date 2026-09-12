import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'circuit',
  tag: 'Circuit',
  domain: 'circuits',
  group: 'Circuits',
  title: 'Circuit (light the bulb)',
  description: 'Battery + switch + bulb, close the switch and tune the voltage to light it.',
  schema: z.object({
    emf: z.number().min(1).max(12).finite().default(6),
    bulbOhms: z.number().positive().max(1000).finite().default(6),
    withSwitch: z.boolean().default(true),
    controlId: z.string().trim().min(1).optional(),
    height: z.number().int().min(240).max(720).optional(),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['electronics', 'circuits', 'ohms-law'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'schematic',
    related: ['circuit-builder'],
  },
  experience: {
    objectives: [
      'Predict current in an open circuit',
      'Complete and trace a conducting path',
      'Transfer voltage-current reasoning to a changed source',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
