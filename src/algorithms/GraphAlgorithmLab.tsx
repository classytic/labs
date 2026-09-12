'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity } from '../kit/activity.js';
import { AssessedChoiceGroup } from '../kit/controls.js';
import type { AlgorithmEvent, AlgorithmGraph } from './contract.js';
import { bfs, dfs, dijkstra, reconstructPath } from './graph.js';
import { GraphView } from './GraphView.js';
import { teachingGraph } from './presets.js';
import { TraceTransport } from './TraceTransport.js';
import { normalizeGraph } from './normalize.js';
import { BinaryTransferCheck } from './LearningChecks.js';

export interface GraphAlgorithmLabProps {
  algorithm?: 'bfs' | 'dfs' | 'dijkstra';
  graph?: AlgorithmGraph;
  source?: string;
  target?: string;
  title?: string;
  prompt?: string;
}

export function GraphAlgorithmLab({
  algorithm = 'dijkstra',
  graph = teachingGraph,
  source = 'A',
  target = 'F',
  title,
  prompt,
}: GraphAlgorithmLabProps) {
  const safeGraph = useMemo(() => normalizeGraph(graph), [graph]);
  const safeSource = safeGraph.nodes.some((node) => node.id === source) ? source : safeGraph.nodes[0]!.id;
  const safeTarget = safeGraph.nodes.some((node) => node.id === target) ? target : safeGraph.nodes.at(-1)!.id;
  const trace = useMemo(
    () =>
      algorithm === 'bfs'
        ? bfs(safeGraph, safeSource)
        : algorithm === 'dfs'
          ? dfs(safeGraph, safeSource)
          : dijkstra(safeGraph, safeSource, safeTarget),
    [algorithm, safeGraph, safeSource, safeTarget],
  );
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState<string>();
  const [transferAnswer, setTransferAnswer] = useState<'yes' | 'no'>();
  useEffect(() => setStep(0), [trace]);
  useEffect(() => setPrediction(undefined), [step, trace]);
  useEffect(() => setTransferAnswer(undefined), [trace]);
  const visible = trace.events.slice(0, step + 1);
  const visited = new Set<string>();
  const discovered = new Set<string>([safeSource]);
  const distances = Object.fromEntries(
    safeGraph.nodes.map((n) => [n.id, n.id === safeSource ? 0 : Infinity]),
  );
  let current = safeSource;
  let activeEdge: string | undefined;
  let frontier: string[] = [safeSource];
  for (const event of visible) {
    if (event.type === 'visit-node') {
      current = event.nodeId;
      visited.add(event.nodeId);
      frontier = event.frontier;
    }
    if (event.type === 'inspect-edge') activeEdge = event.edgeId;
    if (event.type === 'discover-node') {
      discovered.add(event.nodeId);
      frontier = event.frontier;
    }
    if (event.type === 'relax-edge') {
      distances[event.nodeId] = event.next;
      activeEdge = event.edgeId;
      frontier = safeGraph.nodes
        .map((node) => node.id)
        .filter((id) => !visited.has(id) && Number.isFinite(distances[id]!))
        .sort((a, b) => distances[a]! - distances[b]! || a.localeCompare(b));
    }
  }
  const event: AlgorithmEvent = trace.events[step]!;
  const nextEvent = trace.events[step + 1];
  const nextVisit = nextEvent?.type === 'visit-node' ? nextEvent.nodeId : undefined;
  const candidates = [...new Set(frontier)].filter((id) => !visited.has(id));
  const asksNext = Boolean(nextVisit && candidates.length > 1);
  const predictionCorrect = prediction === nextVisit;
  const path =
    event.type === 'complete' && algorithm === 'dijkstra'
      ? reconstructPath(trace.previous, safeSource, safeTarget)
      : [];
  const label =
    algorithm === 'dijkstra' ? "Dijkstra's shortest path" : `${algorithm.toUpperCase()} graph traversal`;
  const frontierLabel = algorithm === 'bfs' ? 'Queue' : algorithm === 'dfs' ? 'Stack' : 'Priority frontier';
  const complete = event.type === 'complete';
  const transferPrompt =
    algorithm === 'dijkstra'
      ? 'If an edge on this route becomes more expensive, can the shortest route change?'
      : `If the neighbour order changes, can ${algorithm.toUpperCase()}'s visit order change?`;
  return (
    <Activity.Root className="algorithm-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Algorithms"
          title={title ?? label}
          description={
            prompt ??
            'Step through the decisions. The visualization exposes algorithm state, not just the final answer.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <span className="lab-chip">
          Current <strong>{current}</strong>
        </span>
        <span className="lab-chip">
          {frontierLabel} <strong>{frontier.join(', ') || 'empty'}</strong>
        </span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Graph visualization">
          <GraphView
            graph={safeGraph}
            current={current}
            activeEdge={activeEdge}
            visited={visited}
            discovered={discovered}
            path={path}
            distances={algorithm === 'dijkstra' ? distances : undefined}
          />
          <div className="algorithm-legend" aria-label="Graph state legend">
            <span data-tone="current">current</span>
            <span data-tone="frontier">frontier</span>
            <span data-tone="visited">settled</span>
          </div>
          {asksNext && (
            <section className="algorithm-decision" aria-label="Predict the next node">
              <strong>
                {algorithm === 'dijkstra'
                  ? 'Which tentative distance is smallest?'
                  : algorithm === 'bfs'
                    ? 'Which node leaves the queue next?'
                    : 'Which node leaves the stack next?'}
              </strong>
              <AssessedChoiceGroup
                value={prediction}
                onChange={setPrediction}
                ariaLabel="Predict the next graph node"
                options={candidates.map((id) => ({
                  value: id,
                  label: `${id}${algorithm === 'dijkstra' ? ` · ${distances[id]}` : ''}`,
                  tone:
                    prediction === id
                      ? id === nextVisit
                        ? ('correct' as const)
                        : ('wrong' as const)
                      : undefined,
                }))}
              />
              {prediction && (
                <small aria-live="polite">
                  {predictionCorrect
                    ? `Correct—${nextVisit} is selected next.`
                    : `Compare the ${
                        algorithm === 'bfs'
                          ? 'queue order'
                          : algorithm === 'dfs'
                            ? 'stack top'
                            : 'tentative distances'
                      } again.`}
                </small>
              )}
            </section>
          )}
        </Activity.Canvas>
        <Activity.Inspector label="Algorithm state">
          <div className="algorithm-inspector">
            <h4>Visited order</h4>
            <div className="algorithm-order">
              {visited.size ? [...visited].map((id) => <span key={id}>{id}</span>) : <em>none yet</em>}
            </div>
            {algorithm === 'dijkstra' && (
              <>
                <h4>Tentative distances</h4>
                <dl>
                  {safeGraph.nodes.map((node) => (
                    <div key={node.id}>
                      <dt>{node.id}</dt>
                      <dd>{Number.isFinite(distances[node.id]!) ? distances[node.id] : '∞'}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </div>
        </Activity.Inspector>
      </Activity.Workspace>
      {complete && (
        <BinaryTransferCheck
          id="algorithm-transfer-title"
          prompt={transferPrompt}
          answer={transferAnswer}
          correct="yes"
          onAnswer={setTransferAnswer}
          correctFeedback={
            algorithm === 'dijkstra'
              ? 'Exactly. New weights can make another route cheaper.'
              : 'Exactly. The structure is unchanged, but traversal order depends on neighbour order.'
          }
          retryFeedback="Try changing the weights or neighbour order and compare the trace."
        />
      )}
      <Activity.Feedback>
        <strong>
          {event.type === 'complete'
            ? 'Result'
            : event.type === 'relax-edge'
              ? 'Relax'
              : event.type === 'visit-node'
                ? 'Choose'
                : 'Observe'}
        </strong>
        <span>{event.message}</span>
      </Activity.Feedback>
      <Activity.Transcript>
        {
          <ol>
            {trace.events.map((item, index) => (
              <li key={index} data-current={index === step || undefined}>
                {item.message}
              </li>
            ))}
            {transferAnswer && (
              <li>
                Transfer answer:{' '}
                {transferAnswer === 'yes' ? 'the result order or route can change' : 'no change'}.
              </li>
            )}
          </ol>
        }
      </Activity.Transcript>
      <TraceTransport
        step={step}
        count={trace.events.length}
        message={asksNext && !prediction ? 'Predict the next node to continue.' : event.message}
        setStep={setStep}
        canAdvance={!asksNext || Boolean(prediction)}
      />
    </Activity.Root>
  );
}
