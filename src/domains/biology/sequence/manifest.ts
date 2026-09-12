import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'sequence',
  domain: 'biology',
  group: 'Biology',
  title: 'DNA/RNA sequence (replication / transcription / translation)',
  description:
    'A base-pairing builder: the template strand is given and the learner builds the partner by pairing each unit. Pick the process, replication (A–T, G–C, semiconservative), transcription (T→U into mRNA), or translation (codons → amino acids via the genetic code), and the template.',
  schema: z
    .object({
      kind: z.enum(['replication', 'transcription', 'translation']).default('replication'),
      template: z.array(z.string().trim().min(1).max(3)).min(1).max(60).optional(),
      ...commonLabProps,
    })
    .superRefine((props, context) => {
      props.template?.forEach((unit, index) => {
        const valid = props.kind === 'translation' ? /^[AUCG]{3}$/.test(unit) : /^[ATGC]$/.test(unit);
        if (!valid)
          context.addIssue({
            code: 'custom',
            path: ['template', index],
            message:
              props.kind === 'translation'
                ? 'Translation templates require three-base mRNA codons'
                : 'DNA templates require single A, T, G, or C bases',
          });
      });
    }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['biology', 'molecular-genetics', 'base-pairing'],
    durationMinutes: 15,
    interaction: 'build',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Construct a complementary DNA strand, mRNA transcript, or translated amino-acid sequence',
      'Apply the correct pairing or genetic-code rule to every unit',
      'Transfer the rule to explain semiconservative replication, RNA base choice, or mutation effects',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
