import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'circuit-lab',
  domain: 'circuits',
  group: 'Circuits',
  title: 'Circuit lab',
  description: 'Series/parallel resistors, voltage & current divider rules, step by step.',
  schema: z.object({
    voltage: z.number().min(1).max(24).finite().optional(),
    r1: z.number().min(10).max(1000).finite().optional(),
    r2: z.number().min(10).max(1000).finite().optional(),
    mode: z.enum(['series', 'parallel']).optional(),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    height: z.number().int().min(240).max(720).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['electronics', 'series-parallel', 'ohms-law'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'schematic',
    prerequisites: ['circuit'],
    related: ['circuit-builder', 'circuit-scene'],
  },
  experience: {
    objectives: [
      'Distinguish voltage division from current division',
      'Relate topology to equivalent resistance',
      'Transfer divider reasoning to changed values and topology',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
