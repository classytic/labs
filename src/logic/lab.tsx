'use client';

/**
 * LogicGateLab — the authorable digital-logic lesson. It renders a LogicDoc with the engine
 * (live wires show the propagating signal), lets the learner toggle inputs, and runs in two
 * modes: EXPLORE (drive the inputs to meet a goal) or PREDICT (the output is hidden behind a
 * '?', tap to guess 0/1, green ring + checkpoint when right). An optional step control lights
 * the signal up one propagation level at a time. A live truth table sits alongside.
 */

import { useState, type ReactNode } from 'react';
import { Field } from '../kit/frame.js';
import { Activity } from '../kit/activity.js';
import { useCheckpoint } from '../kit/pedagogy.js';
import { LabAsk, type LabAskSpec } from '../kit/ask.js';
import { LogicScene } from './LogicScene.js';
import { evaluate, truthTable } from './evaluate.js';
import { presetDoc } from './presets.js';
import type { LogicDoc } from './contract.js';
import { Slider, StatusPill } from '../kit/controls.js';

export interface LogicGateProps {
  doc?: LogicDoc;
  /** a named preset (and/or/xor/nand-not/nand-and/nand-or/half-adder/full-adder). */
  preset?: string;
  mode?: 'explore' | 'predict';
  /** show the step control that lights the signal up level by level. */
  steps?: boolean;
  /** show the full truth table alongside. */
  showTable?: boolean;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const cycle = (g: string): '?' | '0' | '1' => (g === '?' ? '1' : g === '1' ? '0' : '1');

export function LogicGateLab({
  doc: doc0,
  preset = 'and',
  mode = 'explore',
  steps = false,
  showTable = true,
  title = 'Logic gates: follow the signal',
  prompt,
  ask,
  activity = 'logic-gate',
}: LogicGateProps = {}): ReactNode {
  const [doc, setDoc] = useState<LogicDoc>(() => doc0 ?? presetDoc(preset));
  const [guess, setGuess] = useState<Record<string, '?' | '0' | '1'>>({});
  const [step, setStep] = useState<number | undefined>(steps ? 0 : undefined);

  const sol = evaluate(doc);
  const hasGoal = doc.outputs.some((o) => o.goal !== undefined);
  const predicting = mode === 'predict';
  const allPredicted =
    predicting &&
    doc.outputs.every(
      (o) => guess[o.id] && guess[o.id] !== '?' && (guess[o.id] === '1') === (sol.outputs[o.id] ?? false),
    );
  const solved = predicting ? allPredicted : hasGoal ? sol.allGoalsMet : false;
  useCheckpoint({ solved, activity });

  const toggleInput = (id: string): void =>
    setDoc((d) => ({
      ...d,
      inputs: d.inputs.map((i) => (i.id === id ? { ...i, value: !i.value } : i)),
    }));

  const figure = (
    <LogicScene
      doc={doc}
      onToggleInput={predicting ? undefined : toggleInput}
      onOutputClick={predicting ? (id) => setGuess((g) => ({ ...g, [id]: cycle(g[id] ?? '?') })) : undefined}
      outputText={
        predicting ? (id, actual) => (guess[id] && guess[id] !== '?' ? guess[id]! : '?') : undefined
      }
      outputState={
        predicting
          ? (id, actual) => {
              const g = guess[id];
              return !g || g === '?' ? undefined : (g === '1') === actual ? 'ok' : 'no';
            }
          : undefined
      }
      reveal={predicting && !solved ? 0 : step}
      showValues={!predicting}
      ariaLabel={`logic circuit, ${predicting ? 'predict the output' : 'toggle the inputs'}`}
    />
  );

  const rows = showTable ? truthTable(doc) : [];
  const curKey = doc.inputs.map((i) => (i.value ? 1 : 0)).join('');
  const table = showTable ? (
    <div className="logic-table-scroll">
      <table className="logic-truth-table">
        <thead>
          <tr>
            {doc.inputs.map((i) => (
              <th key={i.id}>{i.label ?? i.id}</th>
            ))}
            {doc.outputs.map((o) => (
              <th key={o.id} data-output>
                {o.label ?? o.id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            const key = r.inputs.map((b) => (b ? 1 : 0)).join('');
            const cur = key === curKey;
            return (
              <tr key={ri} data-current={cur || undefined}>
                {r.inputs.map((b, k) => (
                  <td key={k}>{b ? 1 : 0}</td>
                ))}
                {doc.outputs.map((o) => (
                  <td key={o.id} data-value={r.outputs[o.id] || undefined}>
                    {r.outputs[o.id] ? 1 : 0}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  ) : null;

  // step-reveal is a teaching aid for EXPLORE mode; in predict mode the signal is hidden until the
  // learner commits, so the slider would do nothing — hide it there.
  const controls =
    steps && !predicting ? (
      <div className="lab-activity-fields">
        <Field label="propagation step" value={`${step ?? 0} / ${sol.levels.length - 1}`}>
          <Slider
            value={step ?? 0}
            min={0}
            max={sol.levels.length - 1}
            step={1}
            onChange={setStep}
            ariaLabel="propagation step"
          />
        </Field>
      </div>
    ) : undefined;

  const aside = (
    <div className="logic-lab-inspector">
      <StatusPill ok={solved} className="logic-lab-status" role="status">
        {predicting
          ? solved
            ? '✓ correct, that is the output'
            : 'tap the output LED to predict 0 or 1'
          : hasGoal
            ? solved
              ? '✓ goal met'
              : 'toggle the inputs to reach the goal'
            : 'toggle the inputs and watch the signal'}
      </StatusPill>
      {showTable && (
        <div className="logic-table-panel">
          <span>Truth table (current row highlighted)</span>
          {table}
        </div>
      )}
    </div>
  );

  const description =
    prompt ??
    (predicting
      ? 'Work out the output for these inputs, then tap the LED to check.'
      : 'Tap the input switches. A glowing wire carries a 1, so you can follow the signal through each gate.');
  return (
    <Activity.Root>
      <Activity.Header>
        <Activity.Heading eyebrow="Digital logic" title={title} description={description} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{predicting ? 'Predict' : 'Explore'}</strong>
        <span>{doc.inputs.length} inputs</span>
        <span>{doc.gates.length} gates</span>
        <span>{doc.outputs.length} outputs</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Interactive logic circuit">
          {figure}
          {controls && <div className="lab-activity-fields">{controls}</div>}
        </Activity.Canvas>
        <Activity.Inspector label="Truth table and goal">{aside}</Activity.Inspector>
      </Activity.Workspace>
      {ask && (
        <Activity.Feedback>
          <span>Check understanding</span>
          <LabAsk ask={ask} activity={activity} />
        </Activity.Feedback>
      )}
      <Activity.LiveRegion>
        {predicting
          ? solved
            ? 'The predicted outputs are correct.'
            : 'Predict each output.'
          : solved
            ? 'The circuit goal is met.'
            : 'Toggle inputs and observe the signal.'}
      </Activity.LiveRegion>
      {/* No transport row: it held no controls, and its state and gate counts already sit in the
          status strip above the figure. */}
    </Activity.Root>
  );
}
