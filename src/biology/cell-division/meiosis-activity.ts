import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const meiosisExplorerActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Make four genetically different cells',
  objectives: [
    'Distinguish homologs from sister chromatids',
    'Connect crossing over to recombinant chromatids',
    'Connect independent assortment to product combinations',
  ],
  success: [{ id: 'first', source: 'answer', key: 'first', pendingLabel: 'Identify what separates first.' }],
  steps: [
    {
      id: 'pairing',
      phase: 'predict',
      title: 'Pair homologs',
      lead: 'Identify maternal and paternal copies.',
    },
    {
      id: 'crossing-over',
      phase: 'act',
      title: 'Exchange matching segments',
      lead: 'Toggle a chiasma and trace recombinant chromatids.',
      controls: true,
    },
    {
      id: 'metaphase-i',
      phase: 'observe',
      title: 'Choose an orientation',
      lead: 'Flip the bivalent to model independent assortment.',
    },
    {
      id: 'anaphase-i',
      phase: 'explain',
      title: 'Separate homologs',
      lead: 'Sister chromatids remain joined in division I.',
    },
    {
      id: 'metaphase-ii',
      phase: 'act',
      title: 'Align sister chromatids',
      lead: 'Attach sister kinetochores to opposite poles in each haploid cell.',
      controls: true,
    },
    {
      id: 'products',
      phase: 'transfer',
      title: 'Compare four products',
      lead: 'Carry their alleles into an inheritance cross.',
    },
  ],
  questions: [
    {
      id: 'first',
      prompt: 'What separates during anaphase I?',
      choices: [
        { value: 'homologs', label: 'Homologous chromosomes' },
        { value: 'sisters', label: 'Sister chromatids' },
        { value: 'dna', label: 'Individual DNA bases' },
      ],
      answer: 'homologs',
      explain:
        'Meiosis I separates homologous chromosomes. Centromeres divide and sisters separate during meiosis II.',
    },
  ],
});
