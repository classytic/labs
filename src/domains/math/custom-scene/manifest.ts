import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

/** A no-code scene skin builder: the runtime registers the scene (a side effect that makes it
 *  available to labs below), and the editor is the SceneStudio form via loadAuthoring. */
export default defineLab({
  id: 'custom-scene',
  tag: 'CustomScene',
  domain: 'math',
  group: 'Math',
  title: 'Custom scene (no-code lab skin)',
  description:
    'Invent a new lab skin from a form (an emoji or a shape), no code. Place it ABOVE a lab and pick the new scene by name in that lab.',
  schema: z.object({
    title: z.string().optional(),
    prompt: z.string().optional(),
    name: z.string().default('custom'),
    label: z.string().optional(),
    variant: z.enum(['count', 'icons', 'shape']).default('count'),
    icon: z.string().default('🔵'),
    slots: z.number().default(5),
    shape: z.enum(['box', 'cup', 'circle']).default('box'),
    color: z.string().default('#7c83ff'),
  }),
  experience: {
    objectives: [
      'Design a reusable visual representation for an authored quantity',
      'Preview how a scene responds to changing data',
      'Apply one scene skin across multiple compatible activities',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['5', '6', '7', '8'],
    outcomes: ['math', 'authoring', 'scene-builder'],
    durationMinutes: 5,
    interaction: 'build',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
