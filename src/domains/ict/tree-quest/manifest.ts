import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'tree-quest',
  domain: 'ict',
  group: 'Algorithms & Data Structures',
  title: 'Tree Quest',
  description:
    'An engaging binary-tree traversal and BST decision lab with prediction, recursion stack, output tray, semantic traces, and purposeful motion.',
  schema: z.object({
    values: z.array(z.number().int()).min(1).max(31).default([8, 3, 10, 1, 6, 14, 4, 7, 13]),
    strategy: z
      .enum(['insertion-order', 'balanced', 'skewed-left', 'skewed-right'])
      .default('insertion-order'),
    operation: z.enum(['traversal', 'search', 'insert', 'avl-insert']).default('traversal'),
    order: z.enum(['preorder', 'inorder', 'postorder']).default('inorder'),
    target: z.number().int().default(13),
    predict: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['9', '10', '11', '12'],
    outcomes: ['algorithms', 'trees', 'recursion', 'binary-search-tree'],
    durationMinutes: 15,
    interaction: 'predict',
    authorability: 'simple',
    representation: 'graph',
    prerequisites: ['graph-algorithm'],
    related: ['grid-path-dp'],
  },
  experience: {
    objectives: [
      'Predict BST branches or AVL rotation cases',
      'Trace recursion, output and structural repair',
      'Transfer balance and ordering invariants to a changed tree',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
