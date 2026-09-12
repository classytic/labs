import { defineAuthoredActivity } from '../../kit/activity-authoring.js';
export const orbitalOverlapActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Make or break a bond with phase',
  objectives: [
    'Distinguish sigma and pi overlap',
    'Relate wavefunction phase to constructive and destructive overlap',
  ],
  success: [
    { id: 'phase', source: 'answer', key: 'bonding', pendingLabel: 'Identify constructive overlap.' },
  ],
  steps: [
    { id: 'predict', phase: 'predict', title: 'Predict the overlap', lead: 'Choose before changing phase.' },
    {
      id: 'act',
      phase: 'act',
      title: 'Bring orbitals together',
      lead: 'Change distance and alignment.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read density between nuclei',
      lead: 'Look for reinforcement or a node.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the bond',
      lead: 'Connect phase and geometry to energy.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Predict restricted rotation',
      lead: 'Apply orbital alignment to a rotated double bond.',
    },
  ],
  questions: [
    {
      id: 'bonding',
      prompt: 'Which overlap builds electron density between the nuclei?',
      choices: [
        { value: 'same', label: 'Same-phase overlap' },
        { value: 'opposite', label: 'Opposite-phase overlap' },
      ],
      answer: 'same',
      explain:
        'Same-phase wavefunctions interfere constructively, increasing density between nuclei and forming a bonding combination.',
    },
    {
      id: 'pi-rotation',
      prompt: 'What happens to π overlap when one p orbital rotates 90°?',
      choices: [
        { value: 'lost', label: 'The overlap is lost' },
        { value: 'stronger', label: 'It becomes stronger' },
        { value: 'sigma', label: 'It becomes σ overlap' },
      ],
      answer: 'lost',
      explain:
        'Parallel p orbitals are required for side-on π overlap; at 90° their overlap approaches zero.',
    },
  ],
});
