'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity } from '../kit/activity.js';
import { AssessedChoiceGroup } from '../kit/controls.js';
import { gridPaths } from './dp.js';
import { TraceTransport } from './TraceTransport.js';
import { BinaryTransferCheck } from './LearningChecks.js';

export interface GridPathLabProps {
  rows?: number;
  cols?: number;
  title?: string;
  prompt?: string;
}
export function GridPathLab({
  rows = 4,
  cols = 5,
  title = 'Count paths with dynamic programming',
  prompt = 'Build the answer from smaller, already-solved cells.',
}: GridPathLabProps) {
  const trace = useMemo(() => gridPaths(rows, cols), [rows, cols]);
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState<number>();
  const [transferAnswer, setTransferAnswer] = useState<'yes' | 'no'>();
  useEffect(() => {
    setStep(0);
    setPrediction(undefined);
    setTransferAnswer(undefined);
  }, [trace]);
  const current = trace.events[step]!;
  const next = trace.events[step + 1];
  const asksPrediction = next?.row === 1 && next?.col === 1;
  const predictionCorrect = prediction === next?.value;
  const complete = step === trace.events.length - 1;
  const revealed = new Map(
    trace.events.slice(0, step + 1).map((event) => [`${event.row}:${event.col}`, event.value]),
  );
  const deps = new Set(current.dependencies.map(([r, c]) => `${r}:${c}`));
  return (
    <Activity.Root className="algorithm-activity dp-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading eyebrow="Dynamic programming" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <span className="lab-chip">
          State{' '}
          <strong>
            dp[{current.row + 1}][{current.col + 1}]
          </strong>
        </span>
        <span className="lab-chip">
          Rule <strong>top + left</strong>
        </span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Dynamic programming table">
          <div className="dp-board">
            <div className="dp-mission">
              <span>
                <strong>Start</strong> top-left
              </span>
              <span aria-hidden="true">move → or ↓</span>
              <span>
                <strong>Goal</strong> bottom-right
              </span>
            </div>
            <output className="dp-mission" aria-live="polite">
              {current.dependencies.length === 2
                ? `dp[${current.row + 1}][${current.col + 1}] = ${revealed.get(`${current.row - 1}:${current.col}`)} + ${revealed.get(`${current.row}:${current.col - 1}`)} = ${current.value}`
                : `dp[${current.row + 1}][${current.col + 1}] = ${current.value} · boundary base case`}
            </output>
            <div
              className="dp-grid"
              style={{
                gridTemplateColumns: `repeat(${trace.cols}, minmax(2.75rem, 1fr))`,
              }}
            >
              {trace.table.flatMap((row, r) =>
                row.map((_value, c) => {
                  const key = `${r}:${c}`;
                  const isGoal = r === trace.rows - 1 && c === trace.cols - 1;
                  return (
                    <div
                      key={key}
                      data-current={(r === current.row && c === current.col) || undefined}
                      data-dependency={deps.has(key) || undefined}
                      data-goal={isGoal || undefined}
                    >
                      <small>
                        {r + 1},{c + 1}
                      </small>
                      <strong>{revealed.get(key) ?? '·'}</strong>
                      {isGoal && <span>goal</span>}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
          {asksPrediction && (
            <section className="algorithm-decision" aria-label="Predict the reused state">
              <strong>Top and left are both 1. What belongs in dp[2][2]?</strong>
              <AssessedChoiceGroup
                value={prediction?.toString()}
                onChange={(value) => setPrediction(Number(value))}
                ariaLabel="Predict the value stored in dynamic-programming cell two two"
                options={[1, 2, 4].map((value) => ({
                  value: value.toString(),
                  label: value.toString(),
                  tone:
                    prediction === value
                      ? value === next.value
                        ? ('correct' as const)
                        : ('wrong' as const)
                      : undefined,
                }))}
              />
              {prediction != null && (
                <small aria-live="polite">
                  {predictionCorrect
                    ? 'Correct—this state reuses both smaller answers.'
                    : 'Add the route count from above to the route count from the left.'}
                </small>
              )}
            </section>
          )}
        </Activity.Canvas>
        <Activity.Inspector label="Recurrence">
          <div className="algorithm-inspector">
            <h4>Recurrence</h4>
            <code>dp[r][c] = dp[r-1][c] + dp[r][c-1]</code>
            <p>
              Each cell counts every route arriving from above or from the left. Once computed, that state is
              reused.
            </p>
            <h4>Complexity</h4>
            <dl>
              <div>
                <dt>Time</dt>
                <dd>O(rows × cols)</dd>
              </div>
              <div>
                <dt>Space</dt>
                <dd>O(rows × cols)</dd>
              </div>
            </dl>
          </div>
        </Activity.Inspector>
      </Activity.Workspace>
      {complete && (
        <BinaryTransferCheck
          id="dp-transfer-title"
          prompt="If diagonal moves become legal, must the recurrence include the diagonal predecessor?"
          answer={transferAnswer}
          correct="yes"
          onAnswer={setTransferAnswer}
          correctFeedback="Exactly. The allowed transitions determine which earlier states must be summed."
          retryFeedback="The recurrence must include every legal way to enter the current cell."
        />
      )}
      <Activity.Feedback>
        <strong>{current.dependencies.length ? 'Reuse' : 'Base case'}</strong>
        <span>
          {current.message}{' '}
          {current.dependencies.length === 2
            ? 'The highlighted cells are the two already-solved subproblems.'
            : 'This boundary state has only one way to arrive.'}
        </span>
      </Activity.Feedback>
      <Activity.Transcript>
        <ol>
          {trace.events.map((e, i) => (
            <li key={i} data-current={i === step || undefined}>
              {e.message}
            </li>
          ))}
        </ol>
      </Activity.Transcript>
      <TraceTransport
        step={step}
        count={trace.events.length}
        message={current.message}
        setStep={setStep}
        canAdvance={!asksPrediction || predictionCorrect}
      />
    </Activity.Root>
  );
}
