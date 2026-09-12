import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'atomic-orbital',
  tag: 'AtomicOrbitalLab',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Atomic orbitals (probability, phase, and nodes)',
  description:
    'Rotate qualitative hydrogen-like 1s, 2s, 2p and 3d probability samples; compare cloud and cross-section views, wavefunction phase, radial nodes and angular nodes without depicting an electron path.',
  schema: z.object({
    orbital: z.enum(['1s', '2s', '2p-x', '2p-y', '2p-z', '3d-z2', '3d-xy']).default('2p-z'),
    view: z.enum(['cloud', 'cross-section']).default('cloud'),
    yaw: z.number().finite().min(-180).max(180).default(28),
    pitch: z.number().finite().min(-80).max(80).default(-18),
    samples: z.number().int().min(120).max(700).default(420),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['chemistry', 'atomic-structure', 'orbitals', 'quantum-model'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: ['bohr-atom'],
    related: ['periodic-trends', 'molecular-geometry'],
  },
  experience: {
    objectives: [
      'Distinguish an orbital probability distribution from a classical electron path',
      'Connect orbital quantum numbers to symmetry and radial or angular nodes',
      'Interpret wavefunction phase separately from probability density and electrical charge',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
