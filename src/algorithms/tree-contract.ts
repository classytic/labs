export interface BinaryTreeNode {
  id: string;
  value: number;
  left?: string;
  right?: string;
}
export interface BinaryTree {
  rootId?: string;
  nodes: BinaryTreeNode[];
}
export interface TreePosition {
  id: string;
  x: number;
  y: number;
  depth: number;
}
export type TraversalOrder = 'preorder' | 'inorder' | 'postorder';
export type TreeEvent =
  | { type: 'start'; nodeId?: string; message: string }
  | { type: 'enter-call'; nodeId: string; stack: string[]; message: string }
  | {
      type: 'compare';
      nodeId: string;
      target: number;
      relation: 'less' | 'equal' | 'greater';
      stack: string[];
      message: string;
    }
  | { type: 'descend'; from: string; to?: string; side: 'left' | 'right'; stack: string[]; message: string }
  | { type: 'base-case'; parentId?: string; side?: 'left' | 'right'; stack: string[]; message: string }
  | { type: 'visit'; nodeId: string; output: string[]; stack: string[]; message: string }
  | { type: 'return'; nodeId: string; stack: string[]; message: string }
  | {
      type: 'insert';
      nodeId: string;
      parentId?: string;
      side?: 'left' | 'right';
      tree?: BinaryTree;
      message: string;
    }
  | {
      type: 'balance';
      nodeId: string;
      factor: number;
      leftHeight: number;
      rightHeight: number;
      rotation?: 'LL' | 'RR' | 'LR' | 'RL';
      stack: string[];
      message: string;
    }
  | {
      type: 'rotate';
      nodeId: string;
      pivotId: string;
      direction: 'left' | 'right';
      tree: BinaryTree;
      message: string;
    }
  | { type: 'complete'; found?: boolean; output: string[]; message: string };
export interface TreeTrace {
  operation: 'traversal' | 'search' | 'insert' | 'avl-insert';
  events: TreeEvent[];
  output: string[];
  tree: BinaryTree;
}
