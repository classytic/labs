import { describe, expect, it } from 'vitest';
import {
  buildTeachingTree,
  insertAVL,
  insertBST,
  layoutBinaryTree,
  searchBST,
  traverseTree,
  type BinaryTree,
} from '../src/algorithms/tree/index.js';

const TREE: BinaryTree = {
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

describe('binary-tree foundation', () => {
  it('produces canonical traversal orders', () => {
    expect(traverseTree(TREE, 'inorder').output).toEqual(['1', '3', '4', '6', '7', '8', '10', '13', '14']);
    expect(traverseTree(TREE, 'preorder').output[0]).toBe('8');
    expect(traverseTree(TREE, 'postorder').output.at(-1)).toBe('8');
  });
  it('traces BST decisions and insertion without mutation', () => {
    expect(searchBST(TREE, 13).events.filter((event) => event.type === 'compare')).toHaveLength(4);
    const result = insertBST(TREE, 5);
    expect(result.tree.nodes.find((node) => node.id === '4')?.right).toBe('n-5');
    expect(TREE.nodes.find((node) => node.id === '4')?.right).toBeUndefined();
  });
  it('lays out levels in bounds with the root above its children', () => {
    const layout = layoutBinaryTree(TREE);
    const root = layout.find((node) => node.id === '8')!;
    const maxX = Math.max(...layout.map((node) => node.x));
    expect(
      layout.every(
        (node) =>
          Number.isFinite(node.x) && Number.isFinite(node.y) && node.x >= 0 && node.x <= maxX && node.y >= 0,
      ),
    ).toBe(true);
    expect(layout.filter((node) => node.depth === 1).every((node) => node.y > root.y)).toBe(true);
  });
  it('generates useful BST shapes from author intent', () => {
    const balanced = buildTeachingTree([1, 2, 3, 4, 5, 6, 7], 'balanced');
    expect(balanced.nodes.find((node) => node.id === balanced.rootId)?.value).toBe(4);
    const skewed = buildTeachingTree([7, 2, 5, 1], 'skewed-right');
    expect(Math.max(...layoutBinaryTree(skewed).map((node) => node.depth))).toBe(3);
    expect(buildTeachingTree([4, 4, 2], 'insertion-order').nodes).toHaveLength(2);
  });
  it.each([
    [[30, 20], 10, 'LL', 20],
    [[10, 20], 30, 'RR', 20],
    [[30, 10], 20, 'LR', 20],
    [[10, 30], 20, 'RL', 20],
  ] as const)('teaches %s AVL insertion as a %s case', (values, inserted, rotation, rootValue) => {
    const result = insertAVL(buildTeachingTree(values), inserted);
    expect(result.events.some((event) => event.type === 'balance' && event.rotation === rotation)).toBe(true);
    expect(result.tree.nodes.find((node) => node.id === result.tree.rootId)?.value).toBe(rootValue);
    expect(result.events.filter((event) => event.type === 'rotate')).toHaveLength(
      rotation.length === 2 && rotation[0] !== rotation[1] ? 2 : 1,
    );
  });
  it('shows the connected inserted node before asking for an AVL rotation', () => {
    const result = insertAVL(buildTeachingTree([30, 10]), 20);
    const inserted = result.events.find((event) => event.type === 'insert');
    expect(inserted?.type).toBe('insert');
    if (!inserted || inserted.type !== 'insert') return;
    expect(inserted.tree).toBeDefined();
    const nodes = new Map(inserted.tree!.nodes.map((node) => [node.id, node]));
    const root = nodes.get(inserted.tree!.rootId!);
    const left = root?.left ? nodes.get(root.left) : undefined;
    const inner = left?.right ? nodes.get(left.right) : undefined;
    expect([root?.value, left?.value, inner?.value]).toEqual([30, 10, 20]);
  });
});
