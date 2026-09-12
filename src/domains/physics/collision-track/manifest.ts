import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'collision-track',
  domain: 'physics',
  group: 'Physics',
  title: 'Collision track (momentum & elasticity)',
  description:
    'Two carts collide; one elasticity slider morphs inelastic↔elastic. The momentum bar stays full while the KE bar leaks when sticky, and a constant-velocity centre-of-mass marker proves momentum is conserved either way.',
  schema: z.object({
    m1: z.number().min(1).max(6).finite().default(1),
    m2: z.number().min(1).max(6).finite().default(1),
    u1: z.number().min(0).max(8).finite().default(4),
    u2: z.number().min(-8).max(0).finite().default(-2),
    elasticity: z.number().min(0).max(1).finite().default(1),
    showCenterOfMass: z.boolean().default(true),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['momentum', 'collisions'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Distinguish momentum conservation from kinetic-energy conservation',
      'Connect restitution to collision outcome',
      'Use centre-of-mass motion as conservation evidence',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
