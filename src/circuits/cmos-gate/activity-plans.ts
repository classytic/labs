import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

const outputChoices = (): Array<{ value: string; label: string }> => [
  { value: '0', label: 'LOW (0)' },
  { value: '1', label: 'HIGH (1)' },
];
const outputQuestion = () => ({
  id: 'output',
  prompt: 'When input A is HIGH, output Y is…',
  choices: outputChoices(),
  answer: '0',
  explain: 'HIGH enables the pull-down path, so Y is pulled toward ground.',
});

export const inverterActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Build a NOT gate from complementary switches',
  objectives: ['Connect input voltage to the active pull network', 'Read the inverter transfer curve'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the output',
      lead: 'Commit before moving the input.',
      success: 'output-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Sweep the input',
      lead: 'Compare the schematic and transfer curve through the switching region.',
      controls: true,
      reveal: ['model'],
      success: 'high-tested',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Follow the active network',
      lead: 'Match each input region to its conducting pull-up or pull-down path.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain inversion',
      lead: 'Name the active pull-up or pull-down path.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Find the transition',
      lead: 'Sweep input near the switching point and compare circuit state with the transfer curve.',
      controls: true,
    },
  ],
  questions: [outputQuestion()],
  success: [
    {
      id: 'output-answer',
      source: 'answer',
      key: 'output',
      operator: 'eq',
      value: '0',
      pendingLabel: 'Predict the output for a HIGH input.',
    },
    {
      id: 'high-tested',
      source: 'metric',
      key: 'inputHigh',
      operator: 'eq',
      value: true,
      pendingLabel: 'Set input A HIGH.',
    },
  ],
});

export const nandActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Build a CMOS NAND',
  objectives: [
    'Relate series and parallel transistor networks to NAND logic',
    'Verify all four truth-table rows',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the 1,1 row',
      lead: 'Trace the complete pull-down path.',
      success: 'output-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Test the inputs',
      lead: 'Toggle A and B and follow the active current path.',
      controls: true,
      reveal: ['model'],
      success: 'both-high-tested',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Compare all four rows',
      lead: 'Match the truth table to the parallel pull-up and series pull-down networks.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain universality',
      lead: 'Connect NAND to NOT, AND and OR.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Trace a different row',
      lead: 'Choose another input pair and justify the output from the conducting path.',
      controls: true,
    },
  ],
  questions: [
    {
      id: 'output',
      prompt: 'For A = 1 and B = 1, NAND output Y is…',
      choices: outputChoices(),
      answer: '0',
      explain: 'Both series NMOS devices conduct and both PMOS devices are off, pulling Y to ground.',
    },
  ],
  success: [
    {
      id: 'output-answer',
      source: 'answer',
      key: 'output',
      operator: 'eq',
      value: '0',
      pendingLabel: 'Predict the 1,1 output.',
    },
    {
      id: 'both-high-tested',
      source: 'metric',
      key: 'bothHigh',
      operator: 'eq',
      value: true,
      pendingLabel: 'Set both inputs HIGH.',
    },
  ],
});

export const norActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Build a CMOS NOR',
  objectives: [
    'Relate series and parallel transistor networks to NOR logic',
    'Compare NOR with NAND using De Morgan’s law',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Find the only HIGH row',
      lead: 'Trace the series PMOS path.',
      success: 'output-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Test the inputs',
      lead: 'Toggle A and B and follow the active network.',
      controls: true,
      reveal: ['model'],
      success: 'zero-row-tested',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Compare all four rows',
      lead: 'Match the truth table to the series pull-up and parallel pull-down networks.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the network swap',
      lead: 'Connect series/parallel duality to De Morgan’s law.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Trace a different row',
      lead: 'Choose another input pair and justify the output from the conducting path.',
      controls: true,
    },
  ],
  questions: [
    {
      id: 'output',
      prompt: 'When is NOR output Y HIGH?',
      choices: [
        { value: '00', label: 'only A = 0, B = 0' },
        { value: '11', label: 'only A = 1, B = 1' },
        { value: 'different', label: 'when inputs differ' },
      ],
      answer: '00',
      explain: 'Both series PMOS conduct only when both inputs are LOW.',
    },
  ],
  success: [
    {
      id: 'output-answer',
      source: 'answer',
      key: 'output',
      operator: 'eq',
      value: '00',
      pendingLabel: 'Identify the HIGH row.',
    },
    {
      id: 'zero-row-tested',
      source: 'metric',
      key: 'bothLow',
      operator: 'eq',
      value: true,
      pendingLabel: 'Set both inputs LOW.',
    },
  ],
});

export const rnmosActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'A resistor-load NMOS inverter',
  objectives: [
    'Trace the pull-up and pull-down paths',
    'Explain why resistor-load logic wastes static power',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the HIGH-input output',
      lead: 'Trace the conducting NMOS to ground.',
      success: 'output-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Switch the input',
      lead: 'Compare output level and resistor dissipation.',
      controls: true,
      reveal: ['model'],
      success: 'high-tested',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Trace the static current path',
      lead: 'Follow VDD through the pull-up and conducting NMOS.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain why CMOS replaced it',
      lead: 'Identify the steady VDD-to-ground current path.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Compare with CMOS',
      lead: 'Apply the current-path test to complementary pull-up and pull-down networks.',
      reveal: ['model', 'evidence'],
      success: 'cmos-answer',
    },
  ],
  questions: [
    outputQuestion(),
    {
      id: 'cmos',
      prompt: 'Why does complementary CMOS waste less static power in a stable logic state?',
      choices: [
        { value: 'no-path', label: 'It normally has no complete VDD-to-ground path' },
        { value: 'no-resistance', label: 'Its transistors have zero resistance' },
        { value: 'lower-voltage', label: 'It always uses a lower supply voltage' },
      ],
      answer: 'no-path',
      explain: 'In an ideal stable CMOS state one network is off, breaking the direct supply-to-ground path.',
    },
  ],
  success: [
    {
      id: 'output-answer',
      source: 'answer',
      key: 'output',
      operator: 'eq',
      value: '0',
      pendingLabel: 'Predict the HIGH-input output.',
    },
    {
      id: 'high-tested',
      source: 'metric',
      key: 'inputHigh',
      operator: 'eq',
      value: true,
      pendingLabel: 'Set input A HIGH.',
    },
    {
      id: 'cmos-answer',
      source: 'answer',
      key: 'cmos',
      operator: 'eq',
      value: 'no-path',
      pendingLabel: 'Compare the stable current paths.',
    },
  ],
});
