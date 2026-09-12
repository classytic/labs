import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
export default defineLab({
  id: 'orbital-overlap',
  tag: 'OrbitalOverlapLab',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Orbital overlap and bonding',
  description: 'Compare sigma and pi overlap, phase, bonding and antibonding nodes.',
  schema: z.object({
    mode: z.enum(['s-s-sigma', 'p-p-sigma', 'p-p-pi']).default('p-p-pi'),
    phase: z.enum(['bonding', 'antibonding']).default('bonding'),
    separation: z.number().min(0.5).max(3).default(1.6),
    yaw: z.number().min(-180).max(180).default(20),
    pitch: z.number().min(-70).max(70).default(-12),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['chemistry', 'bonding', 'orbitals', 'sigma', 'pi'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: ['atomic-orbital'],
    related: ['molecular-geometry'],
  },
  experience: {
    objectives: [
      'Distinguish sigma and pi overlap',
      'Relate wavefunction phase to constructive and destructive overlap',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
