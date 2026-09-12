import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

const point = z.object({ x: z.number().finite(), y: z.number().finite() });

export default defineLab({
  id: 'kmeans',
  domain: 'ml',
  group: 'Machine learning',
  tag: 'KMeans',
  title: 'k-means clustering',
  description:
    'Unsupervised clustering you watch converge: drag the k centroids to seed them, Step or Run Lloyd’s algorithm (points recolour to nearest centroid, centroids jump to their cluster mean), and the inertia drops. Bad seeds → a worse local minimum. Author the points + k.',
  schema: z
    .object({
      points: z.array(point).min(3).max(200).optional(),
      k: z.number().int().min(1).max(5).default(3),
      seeds: z.array(point).min(1).max(5).optional(),
      span: z.number().finite().min(2).max(100).default(10),
      showLines: z.boolean().default(true),
      ...commonLabProps,
    })
    .superRefine((props, context) => {
      if (props.points && props.points.length < props.k)
        context.addIssue({
          code: 'custom',
          path: ['points'],
          message: 'The dataset needs at least one point per cluster',
        });
      if (props.seeds && props.seeds.length !== props.k)
        context.addIssue({ code: 'custom', path: ['seeds'], message: 'Provide exactly k centroid seeds' });
      for (const key of ['points', 'seeds'] as const)
        props[key]?.forEach((value, index) => {
          if (value.x < 0 || value.x > props.span || value.y < 0 || value.y > props.span)
            context.addIssue({
              code: 'custom',
              path: [key, index],
              message: 'Coordinates must sit inside the plotting span',
            });
        });
    }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['machine-learning', 'clustering', 'k-means'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict how centroid seeds affect clustering',
      'Follow the assignment and centroid-update steps of Lloyd’s algorithm',
      'Explain why convergence does not guarantee the lowest possible inertia',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
