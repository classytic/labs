import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'titration',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Acid–base titration (pH curve)',
  description:
    'Drip strong base into an acid and build the pH curve: buffer region (weak acid, midpoint pH = pKa), the steep jump at the equivalence point (pH 7 strong, >7 weak), and the phenolphthalein flip to pink. Built on the acid–base kernel. AUTHOR the scenario: acid type, concentrations, volume and the weak-acid pKa.',
  schema: z.object({
    analyte: z.enum(['strong-acid', 'weak-acid']).default('weak-acid'),
    concAcid: z
      .number()
      .finite()
      .min(0.001)
      .max(5)
      .default(0.1)
      .describe('acid concentration in the flask, mol/L'),
    volAcidMl: z.number().finite().min(1).max(250).default(25).describe('acid volume in the flask, mL'),
    concBase: z
      .number()
      .finite()
      .min(0.001)
      .max(5)
      .default(0.1)
      .describe('strong-base titrant concentration, mol/L'),
    pKa: z
      .number()
      .finite()
      .min(0)
      .max(14)
      .default(4.76)
      .describe('weak-acid pKa (e.g. 4.76 acetic, 3.75 formic)'),
    indicator: z.enum(['phenolphthalein', 'bromothymol-blue', 'methyl-orange']).default('phenolphthalein'),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['chemistry', 'acid-base', 'titration'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Predict pH at half-equivalence',
      'Connect indicator colour and curve position to pH',
      'Compare strong- and weak-acid equivalence behavior',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
