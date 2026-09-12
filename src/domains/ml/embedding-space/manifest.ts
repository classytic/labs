import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'embedding-space',
  domain: 'ml',
  group: 'Machine learning',
  title: 'Embeddings (meaning as a place on a map)',
  description:
    'Words become positions, so similarity becomes geometry. Click a word to see its nearest neighbours with both cosine and distance reported side by side, then switch to analogy mode and watch king − man + woman land exactly on queen. This is the mechanism behind semantic search, RAG and modern recommendation, and the most-downloaded model on Hugging Face does nothing else.',
  schema: z.object({
    items: z
      .array(
        z.object({
          label: z.string().trim().min(1),
          x: z.number(),
          y: z.number(),
          group: z.string().trim().min(1).optional(),
        }),
      )
      .max(24)
      .optional(),
    query: z.string().trim().min(1).default('cat'),
    k: z.number().int().min(1).max(5).default(3),
    mode: z.enum(['nearest', 'analogy']).default('nearest'),
    analogy: z.array(z.string().trim().min(1)).length(3).default(['king', 'man', 'woman']),
    metric: z.enum(['cosine', 'euclidean']).default('cosine'),
    title: z.string().optional(),
    prompt: z.string().optional(),
    objectives: z.array(z.string()).optional(),
    height: z.number().int().min(240).max(600).optional(),
  }),
  taxonomy: {
    grades: ['12', 'undergraduate'],
    outcomes: ['machine-learning', 'embeddings', 'semantic-search'],
    durationMinutes: 14,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'graph',
    prerequisites: ['knn'],
    related: ['knn', 'kmeans', 'next-token'],
  },
  experience: {
    objectives: [
      'Explain why similar meanings end up in nearby positions',
      'Read cosine and distance, and say which property of the picture each one measures',
      'Use vector arithmetic to complete an analogy, and explain why the inputs are excluded',
      'Connect the map to semantic search and recommendation in production systems',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
