import type { BinaryTree, BinaryTreeNode } from './tree-contract.js';

export type TreeBuildStrategy = 'insertion-order' | 'balanced' | 'skewed-left' | 'skewed-right';

const uniqueFinite = (values: readonly number[]): number[] =>
  [...new Set(values.filter(Number.isFinite).map(Math.trunc))].slice(0, 31);

function insertionTree(values: readonly number[]): BinaryTree {
  const clean = uniqueFinite(values);
  if (!clean.length) return { nodes: [] };
  const nodes: BinaryTreeNode[] = [];
  for (const value of clean) {
    const node: BinaryTreeNode = { id: `v-${value}`, value };
    if (!nodes.length) {
      nodes.push(node);
      continue;
    }
    let current = nodes[0]!;
    while (true) {
      const side = value < current.value ? 'left' : 'right';
      if (!current[side]) {
        current[side] = node.id;
        nodes.push(node);
        break;
      }
      current = nodes.find((candidate) => candidate.id === current[side])!;
    }
  }
  return { rootId: nodes[0]!.id, nodes };
}

/** Generate a valid BST from the small amount of intent a lesson author supplies. */
export function buildTeachingTree(
  values: readonly number[],
  strategy: TreeBuildStrategy = 'insertion-order',
): BinaryTree {
  const clean = uniqueFinite(values);
  if (strategy === 'skewed-left') return insertionTree([...clean].sort((a, b) => b - a));
  if (strategy === 'skewed-right') return insertionTree([...clean].sort((a, b) => a - b));
  if (strategy === 'balanced') {
    const sorted = [...clean].sort((a, b) => a - b);
    const order: number[] = [];
    const addMedian = (start: number, end: number) => {
      if (start > end) return;
      const middle = Math.floor((start + end) / 2);
      order.push(sorted[middle]!);
      addMedian(start, middle - 1);
      addMedian(middle + 1, end);
    };
    addMedian(0, sorted.length - 1);
    return insertionTree(order);
  }
  return insertionTree(clean);
}
