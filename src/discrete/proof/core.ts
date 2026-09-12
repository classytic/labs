export type ProofStrategy = 'direct' | 'contrapositive' | 'contradiction';

export interface ProofNode {
  id: string;
  statement: string;
  justification: string;
  requires?: string[];
  distractorFeedback?: string;
}

export interface ProofGraph {
  premises: string[];
  target: string;
  nodes: ProofNode[];
  conclusion: string;
}

export interface ProofState {
  chosen: string[];
  complete: boolean;
  feedback: string;
}

export function availableProofNodes(graph: ProofGraph, chosen: readonly string[]): ProofNode[] {
  const used = new Set(chosen);
  return graph.nodes.filter(
    (node) => !used.has(node.id) && (node.requires ?? []).every((dependency) => used.has(dependency)),
  );
}

export function chooseProofNode(graph: ProofGraph, state: ProofState, id: string): ProofState {
  const node = graph.nodes.find((candidate) => candidate.id === id);
  if (!node) return { ...state, feedback: 'That statement is not part of this authored argument.' };
  if (state.chosen.includes(id)) return state;
  const missing = (node.requires ?? []).filter((dependency) => !state.chosen.includes(dependency));
  if (missing.length > 0) {
    return {
      ...state,
      feedback:
        node.distractorFeedback ?? 'That conclusion does not follow from the facts established so far.',
    };
  }
  const chosen = [...state.chosen, id];
  const complete = id === graph.conclusion;
  return {
    chosen,
    complete,
    feedback: complete ? 'The target now follows from justified earlier statements.' : node.justification,
  };
}

export function initialProofState(): ProofState {
  return { chosen: [], complete: false, feedback: 'Choose a strategy, then justify the next statement.' };
}
