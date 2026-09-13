'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Circle, Dot, Label, Segment, Stage, type Vec2 } from '@classytic/stage';
import { Activity } from '../../kit/activity.js';
import { ActionButton, IconButton } from '../../kit/controls.js';
import { AngleArc } from '../../kit/diagram/annotations.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import {
  activeHighlights,
  chooseProofNode,
  initialProofState,
  type ProofFigure,
  type ProofGraph,
  type ProofStrategy,
} from '../proof/core.js';

export interface ProofBuilderProps {
  graph?: ProofGraph;
  strategy?: ProofStrategy;
  title?: string;
  prompt?: string;
}

const DEFAULT_GRAPH: ProofGraph = {
  premises: ['n² is even'],
  target: 'Show that n is even',
  conclusion: 'conclusion',
  nodes: [
    {
      id: 'assume',
      statement: 'Assume n is odd',
      justification: 'A contradiction proof temporarily assumes the negation of the target.',
    },
    {
      id: 'form',
      statement: 'Then n = 2k + 1 for some integer k',
      justification: 'This is the definition of an odd integer.',
      requires: ['assume'],
    },
    {
      id: 'square',
      statement: 'So n² = 4k² + 4k + 1, which is odd',
      justification: 'Expanding shows n² has the form 2m + 1.',
      requires: ['form'],
    },
    {
      id: 'conclusion',
      statement: 'This contradicts “n² is even”; therefore n is even',
      justification: 'The negated target is impossible, so the target follows.',
      requires: ['square'],
    },
  ],
};

/**
 * The diagram, with the current step lit and everything else dimmed.
 *
 * Drawn from the figure's own coordinates: the view is fitted to the points, so an author places
 * a circle theorem on whatever scale is convenient and never thinks about the viewBox.
 */
function ProofDiagram({ figure, lit }: { figure: ProofFigure; lit: Set<string> }): ReactNode {
  const at = (id: string): Vec2 | undefined => {
    const p = figure.points.find((q) => q.id === id);
    return p ? { x: p.x, y: p.y } : undefined;
  };
  const xs = figure.points.map((p) => p.x);
  const ys = figure.points.map((p) => p.y);
  const pad = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1) * 0.18;
  const view = {
    xMin: Math.min(...xs) - pad,
    xMax: Math.max(...xs) + pad,
    yMin: Math.min(...ys) - pad,
    yMax: Math.max(...ys) + pad,
  };
  // Nothing lit yet means the whole figure reads at full strength. Dimming everything before the
  // first step would present the learner with a grey picture and no reason for it.
  const anyLit = lit.size > 0;
  const on = (id?: string): boolean => !anyLit || (!!id && lit.has(id));
  const strength = (id?: string): number => (on(id) ? 1 : 0.25);
  const colour = (id?: string): string =>
    anyLit && on(id) ? 'var(--stage-accent)' : 'var(--stage-fg)';

  return (
    <Stage view={view} height={260} ariaLabel="Diagram for the argument">
      {(figure.circles ?? []).map((c, i) => {
        const centre = at(c.center);
        const rim = c.through ? at(c.through) : undefined;
        if (!centre) return null;
        const r = rim ? Math.hypot(rim.x - centre.x, rim.y - centre.y) : (c.r ?? 1);
        return (
          <Circle
            key={c.id ?? `c${i}`}
            center={centre}
            r={r}
            color={colour(c.id)}
            opacity={strength(c.id)}
            fill="none"
          />
        );
      })}
      {(figure.segments ?? []).map((s, i) => {
        const a = at(s.from);
        const b = at(s.to);
        if (!a || !b) return null;
        return (
          <Segment
            key={s.id ?? `s${i}`}
            from={a}
            to={b}
            color={colour(s.id)}
            weight={on(s.id) && anyLit ? 3 : 2}
            opacity={strength(s.id)}
          />
        );
      })}
      {(figure.angles ?? []).map((g, i) => {
        const v = at(g.at);
        const a = at(g.from);
        const b = at(g.to);
        if (!v || !a || !b) return null;
        return (
          <AngleArc
            key={g.id ?? `a${i}`}
            at={v}
            from={{ x: a.x - v.x, y: a.y - v.y }}
            to={{ x: b.x - v.x, y: b.y - v.y }}
            rPx={26 + i * 6}
            label={on(g.id) ? g.label : undefined}
          />
        );
      })}
      {figure.points.map((p) => (
        <Dot key={p.id} x={p.x} y={p.y} r={3.5} color={colour(p.id)} opacity={strength(p.id)} />
      ))}
      {figure.points
        .filter((p) => p.label)
        .map((p) => (
          <Label
            key={`l${p.id}`}
            x={p.x}
            y={p.y}
            text={p.label!}
            color={colour(p.id)}
            size={12}
            weight={600}
            dy={-12}
          />
        ))}
    </Stage>
  );
}

export function ProofBuilderLab({
  graph = DEFAULT_GRAPH,
  strategy,
  title = 'Build a proof that cannot skip a reason',
  prompt = 'Add only statements justified by what is already known.',
}: ProofBuilderProps): ReactNode {
  const [state, setState] = useState(initialProofState);
  const chosenNodes = useMemo(
    () => state.chosen.map((id) => graph.nodes.find((node) => node.id === id)!).filter(Boolean),
    [graph, state.chosen],
  );
  const lit = useMemo(() => activeHighlights(graph, state.chosen), [graph, state.chosen]);
  useCheckpoint({ solved: state.complete, activity: `proof-builder:${graph.target}` });
  const reset = (): void => setState(initialProofState());

  return (
    <Activity.Root className="discrete-proof-activity" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow="Proof strategy" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{state.complete ? 'Argument complete' : `${chosenNodes.length} justified steps`}</strong>
        {/* Only when the author names one. It used to default to "contradiction" and print that
            over a direct geometry proof, labelling the argument as something it is not. */}
        {strategy ? <span>{strategy}</span> : null}
        <span>target: {graph.target}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Proof argument under construction">
          {graph.figure ? <ProofDiagram figure={graph.figure} lit={lit} /> : null}
          <div className="proof-claim">
            <span className="lab-field-label">Given</span>
            {graph.premises.map((premise) => (
              <strong key={premise}>{premise}</strong>
            ))}
          </div>
          <ol className="proof-chain">
            {chosenNodes.length === 0 ? (
              <li className="proof-placeholder">
                <span aria-hidden="true">1</span>
                <div>
                  <strong>Choose the first justified inference</strong>
                  <small>It must follow from what is given.</small>
                </div>
              </li>
            ) : (
              chosenNodes.map((node, index) => (
                <li key={node.id}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{node.statement}</strong>
                    <small>{node.justification}</small>
                  </div>
                </li>
              ))
            )}
          </ol>
          <div className="proof-target">
            <span className="lab-field-label">Target</span>
            <strong>{graph.target}</strong>
          </div>
        </Activity.Canvas>
        {/* Stays on the shared Inspector primitive, which `architecture-convergence` requires of
            every discrete lab so the five keep one spacing system. Worth knowing: the Inspector is
            a <details> that only auto-opens at 960px and wider, so on a phone these step buttons
            sit behind a summary, and choosing the next statement IS the activity here. That is a
            design-system question across all five discrete labs, not something to fix by making
            this one diverge.

            The strategy is AUTHORED, not chosen. It used to be a three-option control that set a
            value nothing read: switching Direct to Contradiction left the argument identical, so
            the lab quietly taught that the choice is cosmetic. A control that does nothing is
            worse than no control. */}
        <Activity.Inspector label="Next inference">
          <Activity.InspectorSection>
            <div className="proof-inference-picker">
            <div>
              <span className="lab-field-label">Next inference</span>
              <p>Choose only a statement supported by the steps already established.</p>
            </div>
            <div className="proof-step-actions">
              {graph.nodes
                .filter((node) => !state.chosen.includes(node.id))
                .map((node, index) => (
                  <ActionButton
                    key={node.id}
                    className="lab-btn-ghost proof-inference-option"
                    onClick={() => setState((current) => chooseProofNode(graph, current, node.id))}
                  >
                    <span aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                    <span>{node.statement}</span>
                  </ActionButton>
                ))}
              </div>
            </div>
          </Activity.InspectorSection>
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>{state.complete ? 'Proved' : 'Feedback'}</span>
        <div>{state.feedback}</div>
      </Activity.Feedback>
      <Activity.Transport>
        <IconButton label="Reset proof" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state">
          <strong>{state.complete ? 'Target established' : 'Choose the next inference'}</strong>
          <span>
            {chosenNodes.length} of {graph.nodes.length} steps
          </span>
        </div>
      </Activity.Transport>
      <Activity.LiveRegion>{state.feedback}</Activity.LiveRegion>
    </Activity.Root>
  );
}
