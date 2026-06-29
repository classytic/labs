'use client';

/**
 * LogicGateLab — the authorable digital-logic lesson. It renders a LogicDoc with the engine
 * (live wires show the propagating signal), lets the learner toggle inputs, and runs in two
 * modes: EXPLORE (drive the inputs to meet a goal) or PREDICT (the output is hidden behind a
 * '?', tap to guess 0/1, green ring + checkpoint when right). An optional step control lights
 * the signal up one propagation level at a time. A live truth table sits alongside.
 */

import { useState, type ReactNode } from 'react';
import { LabFrame, ControlBar, Field, Callout } from '../kit/frame.js';
import { useCheckpoint } from '../kit/pedagogy.js';
import { LabAsk, type LabAskSpec } from '../kit/ask.js';
import { LogicScene } from './LogicScene.js';
import { evaluate, truthTable } from './evaluate.js';
import { presetDoc } from './presets.js';
import type { LogicDoc } from './contract.js';

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
  doc: doc0, preset = 'and', mode = 'explore', steps = false, showTable = true,
  title = 'Logic gates: follow the signal', prompt, ask, activity = 'logic-gate',
}: LogicGateProps = {}): ReactNode {
  const [doc, setDoc] = useState<LogicDoc>(() => doc0 ?? presetDoc(preset));
  const [guess, setGuess] = useState<Record<string, '?' | '0' | '1'>>({});
  const [step, setStep] = useState<number | undefined>(steps ? 0 : undefined);

  const sol = evaluate(doc);
  const hasGoal = doc.outputs.some((o) => o.goal !== undefined);
  const predicting = mode === 'predict';
  const allPredicted = predicting && doc.outputs.every((o) => guess[o.id] && guess[o.id] !== '?' && (guess[o.id] === '1') === (sol.outputs[o.id] ?? false));
  const solved = predicting ? allPredicted : hasGoal ? sol.allGoalsMet : false;
  useCheckpoint({ solved, activity });

  const toggleInput = (id: string): void => setDoc((d) => ({ ...d, inputs: d.inputs.map((i) => (i.id === id ? { ...i, value: !i.value } : i)) }));

  const figure = (
    <LogicScene
      doc={doc}
      onToggleInput={predicting ? undefined : toggleInput}
      onOutputClick={predicting ? (id) => setGuess((g) => ({ ...g, [id]: cycle(g[id] ?? '?') })) : undefined}
      outputText={predicting ? (id, actual) => (guess[id] && guess[id] !== '?' ? guess[id]! : '?') : undefined}
      outputState={predicting ? (id, actual) => { const g = guess[id]; return !g || g === '?' ? undefined : (g === '1') === actual ? 'ok' : 'no'; } : undefined}
      reveal={predicting && !solved ? 0 : step}
      showValues={!predicting}
      ariaLabel={`logic circuit, ${predicting ? 'predict the output' : 'toggle the inputs'}`}
    />
  );

  const rows = showTable ? truthTable(doc) : [];
  const curKey = doc.inputs.map((i) => (i.value ? 1 : 0)).join('');
  const table = showTable ? (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
        <thead>
          <tr>
            {doc.inputs.map((i) => <th key={i.id} style={{ padding: '3px 7px', color: 'var(--stage-fg)', borderBottom: '1px solid var(--stage-grid)' }}>{i.label ?? i.id}</th>)}
            {doc.outputs.map((o) => <th key={o.id} style={{ padding: '3px 7px', color: 'var(--stage-accent)', borderBottom: '1px solid var(--stage-grid)' }}>{o.label ?? o.id}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            const key = r.inputs.map((b) => (b ? 1 : 0)).join('');
            const cur = key === curKey;
            return (
              <tr key={ri} style={{ background: cur ? 'color-mix(in oklab, var(--stage-accent) 14%, transparent)' : 'transparent' }}>
                {r.inputs.map((b, k) => <td key={k} style={{ padding: '3px 7px', textAlign: 'center', color: 'var(--stage-muted)' }}>{b ? 1 : 0}</td>)}
                {doc.outputs.map((o) => <td key={o.id} style={{ padding: '3px 7px', textAlign: 'center', fontWeight: 700, color: r.outputs[o.id] ? 'var(--stage-good)' : 'var(--stage-fg)' }}>{r.outputs[o.id] ? 1 : 0}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  ) : null;

  // step-reveal is a teaching aid for EXPLORE mode; in predict mode the signal is hidden until the
  // learner commits, so the slider would do nothing — hide it there.
  const controls = steps && !predicting ? (
    <ControlBar>
      <Field label="propagation step" value={`${step ?? 0} / ${sol.levels.length - 1}`}>
        <input type="range" min={0} max={sol.levels.length - 1} step={1} value={step ?? 0} onChange={(e) => setStep(Number(e.target.value))} aria-label="propagation step" />
      </Field>
    </ControlBar>
  ) : undefined;

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={solved ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
        {predicting ? (solved ? '✓ correct — that is the output' : 'tap the output LED to predict 0 or 1')
          : hasGoal ? (solved ? '✓ goal met' : 'toggle the inputs to reach the goal')
          : 'toggle the inputs and watch the signal'}
      </div>
      {showTable && <Callout tone="result"><div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ fontSize: 12, color: 'var(--stage-muted)' }}>truth table (current row highlighted)</span>{table}</div></Callout>}
    </div>
  );

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;
  return <LabFrame title={title} prompt={prompt ?? (predicting ? 'Work out the output for these inputs, then tap the LED to check.' : 'Tap the input switches. A wire glows when it carries a 1, so you can watch the signal flow through the gates.')} controls={controls} aside={aside} footer={footer}>{figure}</LabFrame>;
}
