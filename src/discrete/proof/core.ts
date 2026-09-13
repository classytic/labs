export type ProofStrategy = 'direct' | 'contrapositive' | 'contradiction';

export interface ProofNode {
  id: string;
  statement: string;
  justification: string;
  requires?: string[];
  distractorFeedback?: string;
  /**
   * Figure element ids this step is TALKING ABOUT.
   *
   * A geometry proof is unreadable as a list of sentences: "the angle at the centre is twice the
   * angle at the circumference" means nothing until you can see WHICH two angles. When a step is
   * added, its elements light and the rest of the figure dims, so the argument and the picture
   * move together and the learner is never hunting for the referent.
   */
  highlights?: string[];
}

/**
 * An optional diagram for the argument, in the figure's own coordinates.
 *
 * Deliberately small. Points, segments, circles and angles are enough for the circle theorems,
 * the similarity chains and the angle chases that a proof lab is for, and stopping there keeps
 * the authoring surface something a teacher can fill in without learning a scene language.
 * Everything is positioned by POINT ID rather than by coordinates repeated at each use, so a
 * figure cannot drift out of agreement with itself.
 */
export interface ProofFigurePoint {
  id: string;
  x: number;
  y: number;
  label?: string;
}

export interface ProofFigureSegment {
  id?: string;
  from: string;
  to: string;
  label?: string;
}

export interface ProofFigureCircle {
  id?: string;
  center: string;
  /** A point on the rim. Preferred over `r`, so the circle stays attached to the figure. */
  through?: string;
  r?: number;
}

export interface ProofFigureAngle {
  id?: string;
  /** Vertex. */
  at: string;
  from: string;
  to: string;
  label?: string;
}

export interface ProofFigure {
  points: ProofFigurePoint[];
  segments?: ProofFigureSegment[];
  circles?: ProofFigureCircle[];
  angles?: ProofFigureAngle[];
}

export interface ProofGraph {
  premises: string[];
  target: string;
  nodes: ProofNode[];
  conclusion: string;
  figure?: ProofFigure;
}

/**
 * What the figure should light right now: the highlights of the LAST justified step.
 *
 * The last step only, not the union of every step taken. A proof of six steps that lights
 * everything it has ever mentioned ends up lighting the whole diagram, which is the same as
 * lighting none of it.
 */
export function activeHighlights(graph: ProofGraph, chosen: readonly string[]): Set<string> {
  for (let i = chosen.length - 1; i >= 0; i -= 1) {
    const node = graph.nodes.find((n) => n.id === chosen[i]);
    if (node?.highlights?.length) return new Set(node.highlights);
  }
  return new Set();
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
  // Not "choose a strategy": there is no strategy control any more, and telling a learner to use
  // one that is not on screen is the kind of small lie that makes a lab feel broken.
  return { chosen: [], complete: false, feedback: 'Choose a statement the premises already justify.' };
}
