import { defineAuthoredActivity } from '../../kit/activity-authoring.js';
export const mitosisExplorerActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Follow one cell into mitosis',
  objectives: [
    'Track chromosome and chromatid identity',
    'Connect spindle attachment to equal segregation',
    'Place DNA replication before mitosis',
  ],
  success: [
    {
      id: 'replication',
      source: 'answer',
      key: 'replication',
      pendingLabel: 'Place DNA replication correctly.',
    },
    {
      id: 'attachment',
      source: 'metric',
      key: 'attachment',
      pendingLabel: 'Attach each sister to an opposite pole.',
    },
  ],
  steps: [
    {
      id: 'cell',
      phase: 'predict',
      title: 'Orient in the cell',
      lead: 'Locate the nucleus before changing scale.',
    },
    {
      id: 'nucleus',
      phase: 'act',
      title: 'Enter the nucleus',
      lead: 'Inspect duplicated but uncondensed DNA.',
      controls: true,
    },
    {
      id: 'prophase',
      phase: 'observe',
      title: 'Condense chromosomes',
      lead: 'Decide when this DNA was copied.',
      success: 'replication',
    },
    {
      id: 'metaphase',
      phase: 'explain',
      title: 'Build equal attachments',
      lead: 'Select each sister, then connect it to the opposite pole.',
      controls: true,
      success: 'attachment',
    },
    {
      id: 'anaphase',
      phase: 'transfer',
      title: 'Separate the sisters',
      lead: 'Recount chromosomes after centromeres divide.',
    },
  ],
  questions: [
    {
      id: 'replication',
      prompt: 'When was the DNA copied for the chromosomes shown in prophase?',
      choices: [
        { value: 'before', label: 'Before mitosis, during interphase' },
        { value: 'prophase', label: 'During prophase' },
        { value: 'anaphase', label: 'During anaphase' },
      ],
      answer: 'before',
      explain:
        'DNA replication occurs during S phase of interphase. Mitosis partitions the already duplicated chromosomes.',
    },
  ],
});
