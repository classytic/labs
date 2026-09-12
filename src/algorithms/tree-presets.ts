import type { BinaryTree } from './tree-contract.js';

export const CLASSIC_BST: BinaryTree = {
  rootId: '8',
  nodes: [
    { id: '8', value: 8, left: '3', right: '10' },
    { id: '3', value: 3, left: '1', right: '6' },
    { id: '10', value: 10, right: '14' },
    { id: '1', value: 1 },
    { id: '6', value: 6, left: '4', right: '7' },
    { id: '14', value: 14, left: '13' },
    { id: '4', value: 4 },
    { id: '7', value: 7 },
    { id: '13', value: 13 },
  ],
};

export const BALANCED_BST: BinaryTree = {
  rootId: '20',
  nodes: [
    { id: '20', value: 20, left: '10', right: '30' },
    { id: '10', value: 10, left: '5', right: '15' },
    { id: '30', value: 30, left: '25', right: '35' },
    { id: '5', value: 5 },
    { id: '15', value: 15 },
    { id: '25', value: 25 },
    { id: '35', value: 35 },
  ],
};
