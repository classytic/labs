import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'stereochemistry',
  tag: 'StereochemistryLab',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Chirality and enantiomers',
  description:
    'Rotate a tetrahedral stereogenic centre, compare its mirror image, and use CIP priorities to distinguish R and S configurations.',
  schema: z.object({
    molecule: z.enum(['lactic-acid', 'alanine', 'bromochlorofluoromethane']).default('lactic-acid'),
    enantiomer: z.enum(['R', 'S']).default('R'),
    yaw: z.number().min(-180).max(180).default(24),
    pitch: z.number().min(-70).max(70).default(-14),
    compareMirror: z.boolean().default(true),
    showPriorities: z.boolean().default(true),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['chemistry', 'organic-chemistry', 'stereochemistry', 'chirality', 'enantiomers'],
    durationMinutes: 16,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: ['molecular-geometry'],
    related: ['molecular-geometry'],
  },
  experience: {
    objectives: [
      'Recognize a tetrahedral stereogenic centre',
      'Apply CIP priority order',
      'Distinguish enantiomers from conformations',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
