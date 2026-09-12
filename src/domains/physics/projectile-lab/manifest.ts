import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

/**
 * Projectile lab manifest — the ONE declaration the catalog + block + loader derive from.
 * A LEAF: pulls only zod + the pure factory, never the runtime (physics core + renderer),
 * so the block/catalog list this lab without downloading its code. This lab is "large" so it
 * keeps split core/ + runtime/ dirs; simple engine-backed labs are just manifest + runtime.
 */
export default defineLab({
  id: 'projectile-lab',
  domain: 'physics',
  group: 'Physics',
  title: 'Projectile lab',
  description: 'Interactive projectile motion, tune angle & speed, hit a target.',
  schema: z.object({
    targetMeters: z.number().min(1).max(500).optional().describe('Distance to the target, in metres'),
    g: z.number().min(1).max(30).optional().describe('Gravitational acceleration (m/s²) — 9.8 on Earth'),
  }),
  taxonomy: {
    grades: ['9', '10'],
    outcomes: ['kinematics', 'projectile-motion'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
    starter: true,
  },
  experience: {
    objectives: [
      'Predict a projectile landing',
      'Connect launch variables to measured trajectory',
      'Plan a launch for a new target',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime/index.js'),
});
