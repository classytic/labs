import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

const leverItem = z.object({
  side: z.enum(['L', 'R']),
  dist: z.number().finite().positive().max(12),
  weight: z.union([z.number().finite().positive().max(100), z.literal('unknown')]),
});

export default defineLab({
  id: 'lever',
  domain: 'physics',
  group: 'Physics',
  title: 'Lever (balance the torque)',
  description: 'A known weight at a distance vs an unknown, set the unknown so turning effects match.',
  schema: z
    .object({
      items: z
        .array(leverItem)
        .min(2)
        .max(10)
        .refine(
          (items) => items.filter((item) => item.weight === 'unknown').length === 1,
          'items must contain exactly one unknown weight',
        )
        .optional(),
      start: z.number().finite().min(0).max(100).optional(),
      maxWeight: z.number().finite().positive().max(100).optional(),
      height: z.number().int().min(240).max(720).optional(),
      ...commonLabProps,
      activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
    })
    .refine((value) => value.start == null || value.maxWeight == null || value.start <= value.maxWeight, {
      message: 'start must not exceed maxWeight',
      path: ['start'],
    }),
  taxonomy: {
    grades: ['9', '10'],
    outcomes: ['moments', 'torque'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Relate force and perpendicular distance to torque',
      'Compare clockwise and anticlockwise moments',
      'Balance a lever by making net torque zero',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
