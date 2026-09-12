import type { AlgorithmGraph } from './contract.js';

export const teachingGraph: AlgorithmGraph = {
  nodes: [
    { id: 'A', label: 'A', x: 12, y: 50 },
    { id: 'B', label: 'B', x: 31, y: 22 },
    { id: 'C', label: 'C', x: 31, y: 78 },
    { id: 'D', label: 'D', x: 55, y: 18 },
    { id: 'E', label: 'E', x: 57, y: 72 },
    { id: 'F', label: 'F', x: 84, y: 48 },
  ],
  edges: [
    { id: 'ab', from: 'A', to: 'B', weight: 4 },
    { id: 'ac', from: 'A', to: 'C', weight: 2 },
    { id: 'bd', from: 'B', to: 'D', weight: 5 },
    { id: 'be', from: 'B', to: 'E', weight: 2 },
    { id: 'ce', from: 'C', to: 'E', weight: 3 },
    { id: 'de', from: 'D', to: 'E', weight: 1 },
    { id: 'df', from: 'D', to: 'F', weight: 3 },
    { id: 'ef', from: 'E', to: 'F', weight: 6 },
  ],
};
