import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'central-dogma',
  domain: 'biology',
  group: 'Biology',
  title: 'Central dogma (DNA → mRNA → protein)',
  description:
    'The whole flow in one tool: transcribe the DNA template into mRNA (T→U), then translate each 3-base codon into an amino acid. Translation unlocks only once the mRNA is correct, so the dependency is felt. Reuses the genetic-code core.',
  schema: z.object({
    dna: z
      .array(z.string().regex(/^[ATGC]$/))
      .min(3)
      .max(60)
      .refine((bases) => bases.length % 3 === 0, 'DNA length must contain complete codons')
      .optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['biology', 'molecular-genetics', 'central-dogma'],
    durationMinutes: 15,
    interaction: 'build',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Transcribe a DNA template into complementary mRNA',
      'Translate completed mRNA codons into an amino-acid sequence',
      'Explain why ribosomes read mRNA rather than DNA directly',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
