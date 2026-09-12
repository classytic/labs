import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'crystal-lattice',
  tag: 'CrystalLatticeLab',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Crystal lattices and unit cells',
  description:
    'Repeat simple-cubic, body-centred-cubic, and face-centred-cubic unit cells; connect shared lattice sites to coordination number, atoms per cell, packing efficiency, and crystallographic planes.',
  schema: z.object({
    lattice: z.enum(['simple-cubic', 'body-centred', 'face-centred']).default('face-centred'),
    repetitions: z.number().int().min(1).max(3).default(1),
    showPlane: z.boolean().default(false),
    yaw: z.number().min(-180).max(180).default(32),
    pitch: z.number().min(-70).max(70).default(-18),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['chemistry', 'bonding', 'solid-state', 'crystal-lattice', 'unit-cell'],
    durationMinutes: 16,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: ['atomic-orbital', 'molecular-geometry'],
    related: ['periodic-trends'],
  },
  experience: {
    objectives: [
      'Distinguish simple cubic, BCC, and FCC unit cells',
      'Relate shared lattice sites to atoms per unit cell',
      'Compare coordination number and packing efficiency',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
