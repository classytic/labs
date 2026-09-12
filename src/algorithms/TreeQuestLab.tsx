'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Activity } from '../kit/activity.js';
import { AssessedChoiceGroup } from '../kit/controls.js';
import { insertAVL, insertBST, searchBST, traverseTree } from './tree.js';
import type { BinaryTree, TraversalOrder, TreeEvent } from './tree-contract.js';
import { CLASSIC_BST } from './tree-presets.js';
import { TreeScene } from './TreeScene.js';
import { TraceTransport } from './TraceTransport.js';
import { buildTeachingTree, type TreeBuildStrategy } from './tree-builder.js';
import { BinaryTransferCheck } from './LearningChecks.js';

export interface TreeQuestLabProps {
  operation?: 'traversal' | 'search' | 'insert' | 'avl-insert';
  order?: TraversalOrder;
  target?: number;
  tree?: BinaryTree;
  values?: number[];
  strategy?: TreeBuildStrategy;
  title?: string;
  prompt?: string;
  predict?: boolean;
}

const eventStack = (event: TreeEvent): string[] => ('stack' in event ? event.stack : []);
const DEFAULT_TREE_VALUES = [8, 3, 10, 1, 6, 14, 4, 7, 13];

export function TreeQuestLab({
  operation = 'traversal',
  order = 'inorder',
  target = 13,
  tree,
  values = DEFAULT_TREE_VALUES,
  strategy = 'insertion-order',
  title,
  prompt,
  predict = true,
}: TreeQuestLabProps) {
  const lessonTree = useMemo(() => tree ?? buildTeachingTree(values, strategy), [strategy, tree, values]);
  const safeTree = lessonTree.rootId ? lessonTree : CLASSIC_BST;
  const trace = useMemo(
    () =>
      operation === 'traversal'
        ? traverseTree(safeTree, order)
        : operation === 'search'
          ? searchBST(safeTree, target)
          : operation === 'avl-insert'
            ? insertAVL(safeTree, target)
            : insertBST(safeTree, target),
    [operation, order, target, safeTree],
  );
  const [step, setStep] = useState(0);
  const [guess, setGuess] = useState<'left' | 'equal' | 'right'>();
  const [rotationGuess, setRotationGuess] = useState<'LL' | 'RR' | 'LR' | 'RL'>();
  const [transferAnswer, setTransferAnswer] = useState<'yes' | 'no'>();
  useEffect(() => {
    setStep(0);
    setGuess(undefined);
    setRotationGuess(undefined);
    setTransferAnswer(undefined);
  }, [trace]);
  useEffect(() => {
    setGuess(undefined);
    setRotationGuess(undefined);
  }, [step]);
  const event = trace.events[step]!;
  const visible = trace.events.slice(0, step + 1);
  const visited = new Set(visible.flatMap((item) => (item.type === 'visit' ? [item.nodeId] : [])));
  const output =
    [...visible]
      .reverse()
      .find(
        (item): item is Extract<TreeEvent, { type: 'visit' | 'complete' }> =>
          item.type === 'visit' || item.type === 'complete',
      )?.output ?? [];
  const snapshot = [...visible]
    .reverse()
    .find(
      (item): item is Extract<TreeEvent, { type: 'insert' | 'rotate' }> =>
        (item.type === 'insert' || item.type === 'rotate') && Boolean(item.tree),
    );
  const structural = operation === 'insert' || operation === 'avl-insert';
  const showComplete = event.type === 'complete';
  const visibleTree = structural ? (showComplete ? trace.tree : (snapshot?.tree ?? safeTree)) : safeTree;
  const nodeMap = new Map(visibleTree.nodes.map((node) => [node.id, node]));
  const stack = eventStack(event);
  // Depth vs. n: the shape THIS tree took on, measured against the balanced O(log n) and
  // skewed O(n) extremes, so the learner sees why balance matters (highlight the closer one).
  const heightOf = (id: string | undefined): number => {
    const found = id ? nodeMap.get(id) : undefined;
    return found ? 1 + Math.max(heightOf(found.left), heightOf(found.right)) : 0;
  };
  const nodeCount = visibleTree.nodes.length;
  const levels = heightOf(visibleTree.rootId);
  const balancedLevels = nodeCount ? Math.ceil(Math.log2(nodeCount + 1)) : 0;
  const shapeBalanced = nodeCount === 0 || Math.abs(levels - balancedLevels) <= Math.abs(levels - nodeCount);
  const prediction = predict && event.type === 'compare';
  const correct =
    event.type === 'compare'
      ? event.relation === 'less'
        ? 'left'
        : event.relation === 'greater'
          ? 'right'
          : 'equal'
      : undefined;
  const rotationPrediction = predict && event.type === 'balance' && Boolean(event.rotation);
  const correctRotation = event.type === 'balance' ? event.rotation : undefined;
  const rotationChoices = [
    { value: 'LL', label: 'Left–left', path: 'left → left' },
    { value: 'RR', label: 'Right–right', path: 'right → right' },
    { value: 'LR', label: 'Left–right', path: 'left → right' },
    { value: 'RL', label: 'Right–left', path: 'right → left' },
  ] as const;
  const heading =
    operation === 'traversal'
      ? `${order[0]!.toUpperCase()}${order.slice(1)} traversal`
      : operation === 'search'
        ? `Find ${target} in a BST`
        : operation === 'avl-insert'
          ? `Balance the tree after inserting ${target}`
          : `Insert ${target} into a BST`;
  const inspectorLabel =
    event.type === 'balance'
      ? `AVL evidence · balance ${event.factor > 0 ? '+' : ''}${event.factor}${
          event.rotation ? ` · ${event.rotation}` : ''
        }`
      : operation === 'traversal'
        ? 'Recursion and output'
        : operation === 'avl-insert'
          ? 'AVL evidence'
          : 'Decision evidence';
  const transferPrompt =
    operation === 'avl-insert'
      ? 'After an AVL rotation, must the binary-search ordering still hold?'
      : 'Can inserting sorted values into an unbalanced BST make lookup degrade to O(n)?';
  return (
    <Activity.Root className="tree-quest algorithm-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Tree quest"
          title={title ?? heading}
          description={
            prompt ??
            (operation === 'traversal'
              ? 'Follow the recursive calls and collect each node in the correct order.'
              : 'Use the BST invariant to choose a branch at every comparison.')
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <span className="lab-chip">
          Mission <strong>{operation}</strong>
        </span>
        {operation === 'traversal' ? (
          <span className="lab-chip">
            Order <strong>{order}</strong>
          </span>
        ) : (
          <span className="lab-chip">
            Target <strong>{target}</strong>
          </span>
        )}
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Binary tree quest">
          <TreeScene tree={visibleTree} event={event} visited={visited} />
          {prediction && (
            <div className="tree-prediction">
              <span>Which way should {target} go?</span>
              <AssessedChoiceGroup
                value={guess}
                onChange={setGuess}
                ariaLabel={`Predict where ${target} belongs`}
                options={(['left', 'equal', 'right'] as const).map((choice) => ({
                  value: choice,
                  label: choice === 'equal' ? 'Found' : choice[0]!.toUpperCase() + choice.slice(1),
                  tone:
                    guess === choice
                      ? choice === correct
                        ? ('correct' as const)
                        : ('wrong' as const)
                      : undefined,
                }))}
              />
              {guess && (
                <small aria-live="polite">
                  {guess === correct ? (
                    <>
                      <Check aria-hidden="true" /> Exactly—now watch that decision happen.
                    </>
                  ) : (
                    `Not this branch. Compare ${target} with ${
                      event.nodeId ? nodeMap.get(event.nodeId)?.value : ''
                    } again.`
                  )}
                </small>
              )}
            </div>
          )}
          {rotationPrediction && (
            <div className="tree-prediction tree-rotation-prediction">
              <span>Follow the heavy path from {nodeMap.get(event.nodeId)?.value}. Which case is it?</span>
              <AssessedChoiceGroup
                value={rotationGuess}
                onChange={setRotationGuess}
                ariaLabel="Predict the AVL rotation case"
                options={rotationChoices.map((choice) => ({
                  value: choice.value,
                  label: `${choice.value} · ${choice.path}`,
                  tone:
                    rotationGuess === choice.value
                      ? choice.value === correctRotation
                        ? ('correct' as const)
                        : ('wrong' as const)
                      : undefined,
                }))}
              />
              {rotationGuess && (
                <small aria-live="polite">
                  {rotationGuess === correctRotation ? (
                    <>
                      <Check aria-hidden="true" /> Correct—
                      {rotationChoices.find((choice) => choice.value === correctRotation)?.label}. Advance to
                      watch the repair.
                    </>
                  ) : (
                    `Trace the child directions from ${
                      nodeMap.get(event.nodeId)?.value
                    }; name those two turns in order.`
                  )}
                </small>
              )}
            </div>
          )}
        </Activity.Canvas>
        <Activity.Inspector label={inspectorLabel}>
          <div className="tree-inspector">
            <section>
              <h4>{operation === 'traversal' ? 'Call stack' : 'Decision path'}</h4>
              <div className="tree-stack">
                {stack.length ? (
                  [...stack].reverse().map((id, index) => (
                    <span key={id} data-top={index === 0 || undefined}>
                      {operation === 'traversal' ? 'traverse' : 'node'}({nodeMap.get(id)?.value ?? id})
                    </span>
                  ))
                ) : (
                  <em>{operation === 'traversal' ? 'no active calls' : 'begin at the root'}</em>
                )}
              </div>
            </section>
            {event.type === 'balance' && (
              <section className="tree-balance">
                <h4>Balance at node {nodeMap.get(event.nodeId)?.value}</h4>
                <strong>
                  left {event.leftHeight} − right {event.rightHeight} = {event.factor}
                </strong>
                <small>
                  {event.rotation
                    ? `${event.rotation}: follow the two heavy-child directions shown in the tree.`
                    : '−1, 0, or 1 means this node is still AVL-balanced.'}
                </small>
              </section>
            )}
            {operation === 'traversal' && (
              <section>
                <h4>Visited output</h4>
                <div className="tree-output">
                  {output.length ? (
                    output.map((id) => <span key={id}>{nodeMap.get(id)?.value ?? id}</span>)
                  ) : (
                    <em>no node visited yet</em>
                  )}
                </div>
              </section>
            )}
            <section className="tree-invariant">
              <h4>Rule to preserve</h4>
              <p>
                {operation === 'traversal'
                  ? `${order}: ${
                      order === 'preorder'
                        ? 'node, left, right'
                        : order === 'inorder'
                          ? 'left, node, right'
                          : 'left, right, node'
                    }`
                  : operation === 'avl-insert'
                    ? 'BST order, and every node has |left height − right height| ≤ 1'
                    : 'every left value is smaller; every right value is larger'}
              </p>
            </section>
            {(showComplete || event.type === 'start') && (
              <section className="tree-complexity">
                <h4>{operation === 'traversal' ? 'Tree depth' : 'Why balance matters'}</h4>
                <p>
                  This tree has <strong>{nodeCount}</strong> nodes across <strong>{levels}</strong> levels.
                </p>
                <ul>
                  <li data-here={shapeBalanced || undefined}>
                    Balanced <code>O(log n)</code>
                    <span>{balancedLevels} levels</span>
                  </li>
                  <li data-here={!shapeBalanced || undefined}>
                    Skewed <code>O(n)</code>
                    <span>{nodeCount} levels</span>
                  </li>
                </ul>
              </section>
            )}
          </div>
        </Activity.Inspector>
      </Activity.Workspace>
      {showComplete && (
        <BinaryTransferCheck
          id="tree-transfer-title"
          prompt={transferPrompt}
          answer={transferAnswer}
          correct="yes"
          onAnswer={setTransferAnswer}
          correctFeedback={
            operation === 'avl-insert'
              ? 'Exactly. Rotation repairs height while preserving in-order key order.'
              : 'Exactly. A sorted insertion sequence can create a chain, so depth and lookup become linear.'
          }
          retryFeedback={
            operation === 'avl-insert'
              ? 'Rotation may change the root, but it cannot violate the BST invariant.'
              : 'Compare a chain-shaped tree with a balanced tree containing the same keys.'
          }
        />
      )}
      <Activity.Feedback>
        <strong>
          {event.type === 'balance'
            ? 'Balance'
            : event.type === 'compare'
              ? 'Compare'
              : event.type === 'rotate'
                ? 'Repair'
                : event.type === 'complete'
                  ? 'Result'
                  : 'Observe'}
        </strong>
        <span>{event.message}</span>
      </Activity.Feedback>
      <Activity.Transcript>
        <ol>
          {trace.events.map((item, index) => (
            <li key={index} data-current={index === step || undefined}>
              {item.message}
            </li>
          ))}
          {transferAnswer && (
            <li>
              Transfer answer:{' '}
              {transferAnswer === 'yes'
                ? 'the invariant applies in the changed case'
                : 'reconsider the changed case'}
              .
            </li>
          )}
        </ol>
      </Activity.Transcript>
      <TraceTransport
        step={step}
        count={trace.events.length}
        message={event.message}
        setStep={setStep}
        canAdvance={(!prediction || Boolean(guess)) && (!rotationPrediction || Boolean(rotationGuess))}
      />
    </Activity.Root>
  );
}
