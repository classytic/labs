import type { BinaryTree, TreePosition } from './tree-contract.js';

interface RawPosition extends TreePosition {
  rawX: number;
}

// Fixed per-node spacing (natural units). Larger than 2× the node radius (see TreeScene)
// so nodes NEVER overlap regardless of tree size/shape; TreeScene fits or pans this box.
export const TREE_GAP_X = 56;
export const TREE_GAP_Y = 74;

/** Compact layered binary-tree layout with stable ordering and centered parents. */
export function layoutBinaryTree(tree: BinaryTree): TreePosition[] {
  if (!tree.rootId) return [];
  const nodes = new Map(tree.nodes.map((node) => [node.id, node]));
  const placed: RawPosition[] = [];
  const seen = new Set<string>();
  const place = (
    id: string | undefined,
    depth: number,
    origin: number,
  ): { rootX: number; width: number } | undefined => {
    if (!id || seen.has(id)) return undefined;
    const node = nodes.get(id);
    if (!node) return undefined;
    seen.add(id);
    const left = place(node.left, depth + 1, origin);
    const rightOrigin = origin + (left?.width ?? 0) + (left && node.right ? 1 : 0);
    const right = place(node.right, depth + 1, rightOrigin);
    let rootX: number;
    if (left && right) rootX = (left.rootX + right.rootX) / 2;
    else if (left) rootX = left.rootX + 0.5;
    else if (right) rootX = right.rootX - 0.5;
    else rootX = origin;
    const minX = Math.min(origin, rootX);
    const maxX = Math.max(
      rootX,
      right ? rightOrigin + right.width - 1 : left ? origin + left.width - 1 : origin,
    );
    placed.push({ id, rawX: rootX, x: 0, y: 0, depth });
    return { rootX, width: Math.max(1, maxX - minX + 1) };
  };
  place(tree.rootId, 0, 0);
  const min = Math.min(...placed.map((item) => item.rawX));
  // Natural coordinates with FIXED spacing (no fit-to-100 squeeze): x from the compact
  // horizontal slot, y from the level. The spacing:radius ratio is constant, so a 31-node
  // or a skewed tree keeps its nodes apart; TreeScene owns fit-to-view + pan/zoom.
  return placed.map(({ rawX, ...item }) => ({
    ...item,
    x: (rawX - min) * TREE_GAP_X,
    y: item.depth * TREE_GAP_Y,
  }));
}
