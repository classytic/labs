import type { BinaryTree, BinaryTreeNode, TraversalOrder, TreeEvent, TreeTrace } from './tree-contract.js';

const indexTree = (tree: BinaryTree) => new Map(tree.nodes.map((node) => [node.id, node]));

export function traverseTree(tree: BinaryTree, order: TraversalOrder = 'inorder'): TreeTrace {
  const nodes = indexTree(tree);
  const events: TreeEvent[] = [
    { type: 'start', nodeId: tree.rootId, message: `Start ${order} traversal at the root.` },
  ];
  const output: string[] = [];
  const walk = (id: string | undefined, stack: string[], parentId?: string, side?: 'left' | 'right') => {
    if (!id || !nodes.has(id)) {
      events.push({
        type: 'base-case',
        parentId,
        side,
        stack,
        message: `No ${side ?? ''} child—this recursive call returns.`,
      });
      return;
    }
    const node = nodes.get(id)!;
    const nextStack = [...stack, id];
    events.push({
      type: 'enter-call',
      nodeId: id,
      stack: nextStack,
      message: `Enter traverse(${node.value}); push it onto the call stack.`,
    });
    const visit = () => {
      output.push(id);
      events.push({
        type: 'visit',
        nodeId: id,
        output: [...output],
        stack: nextStack,
        message: `Visit ${node.value}; append it to the traversal output.`,
      });
    };
    if (order === 'preorder') visit();
    events.push({
      type: 'descend',
      from: id,
      to: node.left,
      side: 'left',
      stack: nextStack,
      message: `Explore ${node.value}'s left subtree.`,
    });
    walk(node.left, nextStack, id, 'left');
    if (order === 'inorder') visit();
    events.push({
      type: 'descend',
      from: id,
      to: node.right,
      side: 'right',
      stack: nextStack,
      message: `Explore ${node.value}'s right subtree.`,
    });
    walk(node.right, nextStack, id, 'right');
    if (order === 'postorder') visit();
    events.push({
      type: 'return',
      nodeId: id,
      stack,
      message: `Return from traverse(${node.value}); pop it from the call stack.`,
    });
  };
  walk(tree.rootId, []);
  events.push({
    type: 'complete',
    output: [...output],
    message: `${order} complete: ${output.map((id) => nodes.get(id)?.value).join(' → ')}.`,
  });
  return { operation: 'traversal', events, output, tree };
}

export function searchBST(tree: BinaryTree, target: number): TreeTrace {
  const nodes = indexTree(tree);
  const events: TreeEvent[] = [
    { type: 'start', nodeId: tree.rootId, message: `Search for ${target}, beginning at the root.` },
  ];
  const stack: string[] = [];
  let id = tree.rootId;
  while (id && nodes.has(id)) {
    const node = nodes.get(id)!;
    stack.push(id);
    const relation = target === node.value ? 'equal' : target < node.value ? 'less' : 'greater';
    events.push({
      type: 'compare',
      nodeId: id,
      target,
      relation,
      stack: [...stack],
      message: `${target} is ${relation === 'equal' ? 'equal to' : relation === 'less' ? 'less than' : 'greater than'} ${node.value}.`,
    });
    if (relation === 'equal') {
      events.push({
        type: 'complete',
        found: true,
        output: [id],
        message: `Found ${target} after ${stack.length} comparison${stack.length === 1 ? '' : 's'}.`,
      });
      return { operation: 'search', events, output: [id], tree };
    }
    const side = relation === 'less' ? 'left' : 'right';
    const next = node[side];
    events.push({
      type: 'descend',
      from: id,
      to: next,
      side,
      stack: [...stack],
      message: `Follow the ${side} branch from ${node.value}.`,
    });
    id = next;
  }
  events.push({
    type: 'base-case',
    stack: [...stack],
    message: `Reached an empty child; ${target} is not in this tree.`,
  });
  events.push({ type: 'complete', found: false, output: [], message: `${target} was not found.` });
  return { operation: 'search', events, output: [], tree };
}

export function insertBST(tree: BinaryTree, value: number): TreeTrace {
  if (!tree.rootId) {
    const node = { id: `n-${value}`, value };
    const next = { rootId: node.id, nodes: [node] };
    return {
      operation: 'insert',
      output: [node.id],
      tree: next,
      events: [
        { type: 'start', message: `Insert ${value} into the empty tree.` },
        { type: 'insert', nodeId: node.id, message: `${value} becomes the root.` },
        { type: 'complete', output: [node.id], message: 'Insertion complete.' },
      ],
    };
  }
  const search = searchBST(tree, value);
  const lastDescend = [...search.events]
    .reverse()
    .find((event): event is Extract<TreeEvent, { type: 'descend' }> => event.type === 'descend');
  if (!lastDescend || search.events.some((event) => event.type === 'complete' && event.found))
    return {
      ...search,
      operation: 'insert',
      events: [
        ...search.events.slice(0, -1),
        {
          type: 'complete',
          output: search.output,
          message: `${value} already exists; the tree is unchanged.`,
        },
      ],
    };
  const baseId = `n-${value}`;
  let id = baseId;
  let suffix = 2;
  while (tree.nodes.some((node) => node.id === id)) id = `${baseId}-${suffix++}`;
  const newNode: BinaryTreeNode = { id, value };
  const nodes = tree.nodes.map((node) =>
    node.id === lastDescend.from ? { ...node, [lastDescend.side]: id } : node,
  );
  const next = { ...tree, nodes: [...nodes, newNode] };
  const events = search.events.slice(0, -2).concat(
    {
      type: 'insert',
      nodeId: id,
      parentId: lastDescend.from,
      side: lastDescend.side,
      tree: next,
      message: `The ${lastDescend.side} child is empty; insert ${value} here.`,
    },
    { type: 'complete', output: [id], message: `Inserted ${value}. The BST invariant is preserved.` },
  );
  return { operation: 'insert', events, output: [id], tree: next };
}

const cloneTree = (rootId: string | undefined, nodes: Map<string, BinaryTreeNode>): BinaryTree => ({
  rootId,
  nodes: [...nodes.values()].map((node) => ({ ...node })),
});
const nodeHeight = (id: string | undefined, nodes: Map<string, BinaryTreeNode>): number =>
  id && nodes.has(id)
    ? 1 + Math.max(nodeHeight(nodes.get(id)!.left, nodes), nodeHeight(nodes.get(id)!.right, nodes))
    : 0;

/** Insert into an AVL tree and expose every balance check and structural rotation. */
export function insertAVL(tree: BinaryTree, value: number): TreeTrace {
  if (!tree.rootId) {
    const base = insertBST(tree, value);
    return { ...base, operation: 'avl-insert' };
  }
  if (tree.nodes.some((node) => node.value === value)) {
    const base = insertBST(tree, value);
    return { ...base, operation: 'avl-insert' };
  }
  const nodes = new Map(tree.nodes.map((node) => [node.id, { ...node }]));
  const events: TreeEvent[] = [
    {
      type: 'start',
      nodeId: tree.rootId,
      message: `Insert ${value}, then restore the AVL balance invariant.`,
    },
  ];
  let rootId = tree.rootId;
  let newId = `n-${value}`;
  let suffix = 2;
  while (nodes.has(newId)) newId = `n-${value}-${suffix++}`;
  const replaceParentLink = (oldId: string, nextId: string) => {
    if (rootId === oldId) rootId = nextId;
    else
      for (const candidate of nodes.values()) {
        if (candidate.left === oldId) {
          candidate.left = nextId;
          break;
        }
        if (candidate.right === oldId) {
          candidate.right = nextId;
          break;
        }
      }
  };
  const rotateLeft = (root: string): string => {
    const x = nodes.get(root)!;
    const pivot = nodes.get(x.right!)!;
    replaceParentLink(root, pivot.id);
    x.right = pivot.left;
    pivot.left = root;
    events.push({
      type: 'rotate',
      nodeId: root,
      pivotId: pivot.id,
      direction: 'left',
      tree: cloneTree(rootId, nodes),
      message: `Rotate left at ${x.value}; ${pivot.value} rises and ${x.value} moves left.`,
    });
    return pivot.id;
  };
  const rotateRight = (root: string): string => {
    const y = nodes.get(root)!;
    const pivot = nodes.get(y.left!)!;
    replaceParentLink(root, pivot.id);
    y.left = pivot.right;
    pivot.right = root;
    events.push({
      type: 'rotate',
      nodeId: root,
      pivotId: pivot.id,
      direction: 'right',
      tree: cloneTree(rootId, nodes),
      message: `Rotate right at ${y.value}; ${pivot.value} rises and ${y.value} moves right.`,
    });
    return pivot.id;
  };
  const insert = (
    id: string | undefined,
    stack: string[],
    parentId?: string,
    side?: 'left' | 'right',
  ): string => {
    if (!id) {
      nodes.set(newId, { id: newId, value });
      // The caller has not attached this node to its parent yet. Emitting a tree
      // snapshot here creates a disconnected node that the scene cannot draw,
      // making the following balance decision impossible to understand.
      events.push({
        type: 'insert',
        nodeId: newId,
        parentId,
        side,
        message: `The ${side ?? 'root'} position is empty; place ${value} here.`,
      });
      return newId;
    }
    const node = nodes.get(id)!;
    const nextStack = [...stack, id];
    const relation = value < node.value ? 'less' : 'greater';
    events.push({
      type: 'compare',
      nodeId: id,
      target: value,
      relation,
      stack: nextStack,
      message: `${value} is ${relation} than ${node.value}.`,
    });
    const branch = relation === 'less' ? 'left' : 'right';
    events.push({
      type: 'descend',
      from: id,
      to: node[branch],
      side: branch,
      stack: nextStack,
      message: `Follow the ${branch} branch.`,
    });
    node[branch] = insert(node[branch], nextStack, id, branch);
    // Capture insertion only after the new child is connected. The first
    // recursive caller is the authoritative moment at which the learner can
    // see the complete pre-rotation shape.
    const inserted = [...events]
      .reverse()
      .find(
        (event): event is Extract<TreeEvent, { type: 'insert' }> =>
          event.type === 'insert' && event.nodeId === newId,
      );
    if (inserted && !inserted.tree) inserted.tree = cloneTree(rootId, nodes);
    const leftHeight = nodeHeight(node.left, nodes);
    const rightHeight = nodeHeight(node.right, nodes);
    const factor = leftHeight - rightHeight;
    let rotation: 'LL' | 'RR' | 'LR' | 'RL' | undefined;
    if (factor > 1) rotation = value < nodes.get(node.left!)!.value ? 'LL' : 'LR';
    if (factor < -1) rotation = value > nodes.get(node.right!)!.value ? 'RR' : 'RL';
    events.push({
      type: 'balance',
      nodeId: id,
      factor,
      leftHeight,
      rightHeight,
      rotation,
      stack: nextStack,
      message: rotation
        ? `${node.value} has balance factor ${factor}; this is an ${rotation} imbalance.`
        : `${node.value} has balance factor ${factor}, so it remains balanced.`,
    });
    if (rotation === 'LL') return rotateRight(id);
    if (rotation === 'RR') return rotateLeft(id);
    if (rotation === 'LR') {
      node.left = rotateLeft(node.left!);
      return rotateRight(id);
    }
    if (rotation === 'RL') {
      node.right = rotateRight(node.right!);
      return rotateLeft(id);
    }
    return id;
  };
  rootId = insert(rootId, []);
  const result = cloneTree(rootId, nodes);
  // Rotation snapshots emitted inside recursion may predate the final root update;
  // the final event always carries the authoritative tree through TreeTrace.tree.
  events.push({
    type: 'complete',
    output: [newId],
    message: `Inserted ${value}; every node now has balance factor −1, 0, or 1.`,
  });
  return { operation: 'avl-insert', events, output: [newId], tree: result };
}
