import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'molecular-geometry',
  tag: 'MolecularGeometryLab',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Molecular geometry (VSEPR, hybridization, and polarity)',
  description:
    'Rotate representative linear, trigonal-planar, tetrahedral, pyramidal, bent, trigonal-bipyramidal and octahedral molecules; reveal lone pairs, electron domains and bond dipoles while keeping electron geometry distinct from molecular shape.',
  schema: z.object({
    molecule: z.enum(['co2', 'bf3', 'ch4', 'nh3', 'h2o', 'pcl5', 'sf6']).default('h2o'),
    yaw: z.number().finite().min(-180).max(180).default(28),
    pitch: z.number().finite().min(-80).max(80).default(-18),
    showLonePairs: z.boolean().default(true),
    showDipoles: z.boolean().default(true),
    showDomains: z.boolean().default(false),
    showHybridOrbitals: z.boolean().default(false),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['chemistry', 'bonding', 'vsepr', 'hybridization', 'molecular-polarity'],
    durationMinutes: 18,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: ['atomic-orbital'],
    related: ['reaction-lab', 'periodic-trends'],
  },
  experience: {
    objectives: [
      'Predict electron geometry and molecular shape from bonding and lone-pair domains',
      'Relate approximate bond angles and introductory hybridization labels to three-dimensional geometry',
      'Use molecular symmetry to determine whether bond dipoles cancel',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
