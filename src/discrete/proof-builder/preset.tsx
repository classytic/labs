'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Activity } from '../../kit/activity.js';
import { ActionButton, IconButton, Segmented } from '../../kit/controls.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { chooseProofNode, initialProofState, type ProofGraph, type ProofStrategy } from '../proof/core.js';

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

export function ProofBuilderLab({
  graph = DEFAULT_GRAPH,
  strategy: initialStrategy = 'contradiction',
  title = 'Build a proof that cannot skip a reason',
  prompt = 'Choose the strategy, then add only statements justified by what is already known.',
}: ProofBuilderProps): ReactNode {
  const [strategy, setStrategy] = useState<ProofStrategy>(initialStrategy);
  const [state, setState] = useState(initialProofState);
  const chosenNodes = useMemo(
    () => state.chosen.map((id) => graph.nodes.find((node) => node.id === id)!).filter(Boolean),
    [graph, state.chosen],
  );
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
        <span>{strategy}</span>
        <span>target: {graph.target}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Proof argument under construction">
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
                  <small>It must follow from the premise and match the selected proof strategy.</small>
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
        <Activity.Inspector label="Proof strategy and next statement">
          <Activity.InspectorSection>
            <div className="lab-segmented-field">
              <span className="lab-field-label">Proof method</span>
              <Segmented
                value={strategy}
                onChange={setStrategy}
                ariaLabel="proof strategy"
                options={[
                  { value: 'direct', label: 'Direct' },
                  { value: 'contrapositive', label: 'Contrapositive' },
                  { value: 'contradiction', label: 'Contradiction' },
                ]}
              />
            </div>
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
