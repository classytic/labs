'use client';

/**
 * LogicBuildLab — a build-your-own-circuit activity on top of LogicEditor. In sandbox mode it
 * is an open canvas (build, wire, play, watch the signal glow). Given a `goal` (a reference
 * LogicDoc or a preset key) it becomes a graded DLD task: the target truth table is shown, the
 * learner wires gates, and the checkpoint fires when their circuit reproduces every target
 * output column (matched by label, over every input combination). The seed canvas starts with
 * the right switches and LEDs so the learner only has to wire the logic.
 */

import { useState, type ReactNode } from 'react';
import { LabFrame } from '../kit/frame.js';
import { useCheckpoint } from '../kit/pedagogy.js';
import { LogicEditor } from './LogicEditor.js';
import { evaluate, MAX_TRUTH_TABLE_VARS } from './evaluate.js';
import { presetDoc } from './presets.js';
import type { LogicDoc } from './contract.js';

export interface LogicBuildProps {
  /** starting canvas. Defaults to a seed derived from the goal, or an empty board. */
  doc?: LogicDoc;
  /** a reference LogicDoc or preset key; when set, the lab grades against its truth table. */
  goal?: LogicDoc | string;
  title?: string;
  prompt?: string;
  activity?: string;
}

const SIZE = { w: 640, h: 360 };
const labelOf = (n: { id: string; label?: string }): string => n.label ?? n.id;

/** The column of `outputLabel` over every combination of `inputLabels` (given order); null if missing. */
function columnByLabels(doc: LogicDoc, inputLabels: string[], outputLabel: string): boolean[] | null {
  const idFor = inputLabels.map((lab) => doc.inputs.find((i) => labelOf(i) === lab)?.id);
  if (idFor.some((id) => !id)) return null;
  const out = doc.outputs.find((o) => labelOf(o) === outputLabel);
  if (!out) return null;
  const n = inputLabels.length;
  if (n > MAX_TRUTH_TABLE_VARS) return null; // too many inputs to enumerate safely
  const col: boolean[] = [];
  for (let m = 0; m < 2 ** n; m++) {
    const setVals = new Map(idFor.map((id, k) => [id!, Boolean((m >> (n - 1 - k)) & 1)]));
    const probe: LogicDoc = { ...doc, inputs: doc.inputs.map((i) => (setVals.has(i.id) ? { ...i, value: setVals.get(i.id)! } : i)) };
    col.push(evaluate(probe).outputs[out.id] ?? false);
  }
  return col;
}

const eqCol = (a: boolean[] | null, b: boolean[] | null): boolean => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

/** Seed a starting canvas from the goal: its switches + empty LEDs, so the learner just wires gates. */
function seedFromGoal(goalDoc: LogicDoc): LogicDoc {
  return {
    size: SIZE,
    inputs: goalDoc.inputs.map((inp, i) => ({ id: `in${i + 1}`, label: labelOf(inp), value: false, x: 40, y: 36 + i * 58 })),
    gates: [],
    outputs: goalDoc.outputs.map((o, i) => ({ id: `out${i + 1}`, in: '', label: labelOf(o), x: SIZE.w - 76, y: 56 + i * 72 })),
  };
}

export function LogicBuildLab({ doc: doc0, goal, title = 'Build the circuit', prompt, activity = 'logic-build' }: LogicBuildProps = {}): ReactNode {
  const goalDoc: LogicDoc | null = goal === undefined ? null : typeof goal === 'string' ? presetDoc(goal) : goal;
  const [doc, setDoc] = useState<LogicDoc>(() => doc0 ?? (goalDoc ? seedFromGoal(goalDoc) : { size: SIZE, inputs: [], gates: [], outputs: [] }));

  const inputLabels = goalDoc ? goalDoc.inputs.map(labelOf) : [];
  const targets = goalDoc ? goalDoc.outputs.map((o) => ({ label: labelOf(o), col: columnByLabels(goalDoc, inputLabels, labelOf(o)) })) : [];
  const matchedSame = goalDoc ? doc.inputs.length === goalDoc.inputs.length : false;
  const perOutput = targets.map((t) => ({ label: t.label, ok: matchedSame && eqCol(columnByLabels(doc, inputLabels, t.label), t.col) }));
  const solved = !!goalDoc && perOutput.length > 0 && perOutput.every((p) => p.ok);
  useCheckpoint({ solved, activity });

  const targetTable = goalDoc ? (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
        <thead>
          <tr>
            {inputLabels.map((l) => <th key={l} style={{ padding: '3px 7px', color: 'var(--stage-fg)', borderBottom: '1px solid var(--stage-grid)' }}>{l}</th>)}
            {perOutput.map((p) => <th key={p.label} style={{ padding: '3px 7px', color: p.ok ? 'var(--stage-good)' : 'var(--stage-accent)', borderBottom: '1px solid var(--stage-grid)' }}>{p.label}{p.ok ? ' ✓' : ''}</th>)}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 1 << inputLabels.length }, (_, m) => (
            <tr key={m}>
              {inputLabels.map((_l, k) => <td key={k} style={{ padding: '3px 7px', textAlign: 'center', color: 'var(--stage-muted)' }}>{(m >> (inputLabels.length - 1 - k)) & 1}</td>)}
              {targets.map((t) => <td key={t.label} style={{ padding: '3px 7px', textAlign: 'center', fontWeight: 700, color: t.col?.[m] ? 'var(--stage-good)' : 'var(--stage-fg)' }}>{t.col?.[m] ? 1 : 0}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : null;

  // The builder is a wide 3-column tool, so the target table goes ABOVE it (not in a narrow
  // aside that would crush the canvas). The editor then gets the full width of the frame.
  return (
    <LabFrame
      title={title}
      prompt={prompt ?? (goalDoc ? 'Drag gates from the palette and wire them so each LED follows the target column for every input.' : 'Build any circuit: drop sources, gates, and LEDs, wire them up, and flip the switches to watch the signal flow.')}
    >
      {goalDoc && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
          <div className="lab-pill" data-state={solved ? 'ok' : 'no'} role="status">
            {solved ? '✓ your circuit matches the target' : 'wire gates so each output matches its column'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--stage-muted)' }}>target truth table (build a circuit that does this)</span>
            {targetTable}
          </div>
        </div>
      )}
      <LogicEditor value={doc} onChange={setDoc} />
    </LabFrame>
  );
}
