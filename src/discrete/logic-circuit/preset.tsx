'use client';

/**
 * BooleanCircuitLab — the GENERAL "build something real with logic gates" tool.
 * A creator declares a NETLIST (input switches, typed gates wired by id, output
 * devices = LEDs/lamps); the learner flips switches and watches power flow
 * through the gates and LIGHT the outputs. One tool → any combinational circuit:
 * a light wired through an AND, a staircase XOR switch, a half-adder's two LEDs.
 *
 * Auto-layout by gate depth (inputs left → gates by level → devices right), wires
 * as smooth beziers that GLOW + animate when carrying a 1. Signal truth comes
 * from the same boolean semantics as the stage logic kernel. Mobile-responsive
 * SVG (viewBox scales to the container); switches are big tap targets. Optional
 * per-output `goal` makes it a puzzle ("light the lamp") graded by useCheckpoint.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { useControlSurface } from '@classytic/stage';
import { GateGlyph, gatePorts, Lamp, ToggleSwitch, type GateType } from '../../kit/logic-gates.js';
import { Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { useHints, HintLadder, RevealSolution, useCheckpoint } from '../../kit/pedagogy.js';

export interface CircuitInput { id: string; label?: string }
export interface CircuitGate { id: string; type: GateType; in: string[] }
export interface CircuitOutput { id: string; in: string; label?: string; color?: string; goal?: boolean }
export interface BooleanCircuitProps {
  inputs: (CircuitInput | string)[];
  gates: CircuitGate[];
  outputs: CircuitOutput[];
  /** Seed switch positions (e.g. present the circuit already energised). Default: all off. */
  initial?: Record<string, boolean>;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}

const GS = 46;        // gate box size
const SW = 50, SH = 26; // switch
const LR = 17;        // lamp radius
const COL = 118, ROW = 78, MARGIN = 30;

function gateEval(type: GateType, ins: boolean[]): boolean {
  const a = ins[0] ?? false, b = ins[1] ?? false;
  switch (type) {
    case 'AND': return a && b;
    case 'OR': return a || b;
    case 'NOT': return !a;
    case 'NAND': return !(a && b);
    case 'NOR': return !(a || b);
    case 'XOR': return a !== b;
    case 'XNOR': return a === b;
  }
}

export function BooleanCircuitLab({ inputs: inputs0, gates, outputs, initial, title = 'Logic circuit', prompt, objectives, hints: hintList, controlId, height = 320 }: BooleanCircuitProps): ReactNode {
  const inputs = useMemo(() => inputs0.map((i) => (typeof i === 'string' ? { id: i } : i)), [inputs0]);
  const gateById = useMemo(() => new Map(gates.map((g) => [g.id, g])), [gates]);
  const inputIds = useMemo(() => new Set(inputs.map((i) => i.id)), [inputs]);

  const [state, setState] = useState<Record<string, boolean>>(() => Object.fromEntries(inputs.map((i) => [i.id, initial?.[i.id] ?? false])));
  const hints = useHints(hintList);

  // evaluate every node (memoised, cycle-guarded)
  const values = useMemo(() => {
    const v = new Map<string, boolean>();
    const inProgress = new Set<string>();
    const val = (id: string): boolean => {
      if (v.has(id)) return v.get(id)!;
      if (inputIds.has(id)) { const b = state[id] ?? false; v.set(id, b); return b; }
      if (inProgress.has(id)) return false;            // cycle → false
      const g = gateById.get(id);
      if (!g) return false;
      inProgress.add(id);
      const out = gateEval(g.type, g.in.map(val));
      inProgress.delete(id);
      v.set(id, out);
      return out;
    };
    inputs.forEach((i) => val(i.id));
    gates.forEach((g) => val(g.id));
    return v;
  }, [state, inputs, gates, gateById, inputIds]);

  // depth (column) per node
  const layout = useMemo(() => {
    const depthMemo = new Map<string, number>();
    const inProg = new Set<string>();
    const depth = (id: string): number => {
      if (inputIds.has(id)) return 0;
      if (depthMemo.has(id)) return depthMemo.get(id)!;
      if (inProg.has(id)) return 1;
      const g = gateById.get(id);
      if (!g) return 0;
      inProg.add(id);
      const d = 1 + Math.max(0, ...g.in.map(depth));
      inProg.delete(id);
      depthMemo.set(id, d);
      return d;
    };
    const maxGateDepth = gates.length ? Math.max(...gates.map((g) => depth(g.id))) : 0;
    const outCol = maxGateDepth + 1;
    const cols: string[][] = Array.from({ length: outCol + 1 }, () => []);
    inputs.forEach((i) => cols[0]!.push(i.id));
    gates.forEach((g) => cols[depth(g.id)]!.push(g.id));
    outputs.forEach((o) => cols[outCol]!.push(`out:${o.id}`));

    const pos = new Map<string, { x: number; y: number }>();
    const maxRows = Math.max(1, ...cols.map((c) => c.length));
    cols.forEach((col, ci) => {
      const x = MARGIN + ci * COL;
      const offset = (maxRows - col.length) / 2;
      col.forEach((id, ri) => pos.set(id, { x, y: MARGIN + (offset + ri) * ROW }));
    });
    const vbW = MARGIN * 2 + outCol * COL + GS + 30;
    const vbH = MARGIN * 2 + maxRows * ROW;
    return { pos, vbW, vbH, outCol };
  }, [inputs, gates, outputs, gateById, inputIds]);

  // wire-attach points for any ref id (input switch / gate output)
  const outPoint = (id: string): { x: number; y: number } => {
    const p = layout.pos.get(id)!;
    if (inputIds.has(id)) return { x: p.x + SW, y: p.y + SH / 2 };
    const g = gateById.get(id)!;
    return gatePorts(g.type, p.x, p.y, GS).output;
  };

  const wirePath = (s: { x: number; y: number }, t: { x: number; y: number }): string => {
    const dx = Math.max(26, (t.x - s.x) * 0.45);
    return `M${s.x},${s.y} C${s.x + dx},${s.y} ${t.x - dx},${t.y} ${t.x},${t.y}`;
  };

  const goals = outputs.filter((o) => o.goal);
  const solved = goals.length > 0 && goals.every((o) => values.get(o.in));
  useCheckpoint({ solved, activity: `logic-circuit:${title}`, hintsUsed: hints.count });

  const toggle = (id: string): void => setState((s) => ({ ...s, [id]: !s[id] }));
  const reset = (): void => setState(Object.fromEntries(inputs.map((i) => [i.id, false])));

  useControlSurface(controlId, {
    ...Object.fromEntries(inputs.map((i) => [`in_${i.id}`, { type: 'boolean' as const, label: `switch ${i.label ?? i.id}`, get: () => state[i.id] ?? false, set: (v: boolean) => setState((s) => ({ ...s, [i.id]: v })) }])),
    reset: { type: 'action' as const, label: 'all switches off', invoke: reset },
  });

  // gather wires: input→gate, gate→gate, source→output
  const wires: { from: string; to: { x: number; y: number }; live: boolean; key: string }[] = [];
  gates.forEach((g) => {
    const ports = gatePorts(g.type, layout.pos.get(g.id)!.x, layout.pos.get(g.id)!.y, GS);
    g.in.forEach((src, k) => { if (ports.inputs[k]) wires.push({ from: src, to: ports.inputs[k]!, live: values.get(src) ?? false, key: `${g.id}-${k}` }); });
  });
  outputs.forEach((o) => { const p = layout.pos.get(`out:${o.id}`)!; wires.push({ from: o.in, to: { x: p.x + 6, y: p.y + GS / 2 }, live: values.get(o.in) ?? false, key: `out-${o.id}` }); });

  const figure = (
    <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 8 }}>
        <svg viewBox={`0 0 ${layout.vbW} ${layout.vbH}`} style={{ width: '100%', maxWidth: layout.vbW, height: 'auto', display: 'block', margin: '0 auto', maxHeight: height, touchAction: 'manipulation' }} role="img" aria-label={`Logic circuit; ${outputs.map((o) => `${o.label ?? o.id} is ${values.get(o.in) ? 'on' : 'off'}`).join(', ')}`}>
          {/* wires (behind) */}
          {wires.map((w) => (
            <path key={w.key} d={wirePath(outPoint(w.from), w.to)} fill="none"
              stroke={w.live ? 'var(--stage-live)' : 'var(--stage-wire)'} strokeWidth={w.live ? 3 : 2} strokeLinecap="round"
              className={w.live ? 'lc-wire-live' : undefined} opacity={w.live ? 1 : 0.55} />
          ))}
          {/* gates */}
          {gates.map((g) => { const p = layout.pos.get(g.id)!; return <GateGlyph key={g.id} x={p.x} y={p.y} size={GS} type={g.type} live={values.get(g.id)} label={g.type} />; })}
          {/* input switches (tap targets) */}
          {inputs.map((i) => { const p = layout.pos.get(i.id)!; const on = state[i.id] ?? false; return (
            <g key={i.id} onClick={() => toggle(i.id)} style={{ cursor: 'pointer' }} role="button" aria-pressed={on} aria-label={`switch ${i.label ?? i.id}`}>
              <rect x={p.x - 6} y={p.y - 16} width={SW + 12} height={SH + 22} fill="transparent" />
              <ToggleSwitch x={p.x} y={p.y} w={SW} h={SH} on={on} label={i.label ?? i.id} />
            </g>
          ); })}
          {/* output devices */}
          {outputs.map((o) => { const p = layout.pos.get(`out:${o.id}`)!; const on = values.get(o.in) ?? false; return (
            <Lamp key={o.id} cx={p.x + LR + 10} cy={p.y + GS / 2} r={LR} on={on} color={o.color} label={o.label ?? o.id} />
          ); })}
        </svg>
    </div>
  );

  const controls = (
    <ControlBar>
      <Chip selected={false} onClick={reset}>all off</Chip>
      {outputs.map((o) => <span key={o.id} style={{ fontWeight: 700, color: values.get(o.in) ? 'var(--stage-good)' : 'var(--stage-muted)' }}>{o.label ?? o.id}: {values.get(o.in) ? 'ON' : 'off'}</span>)}
      {goals.length > 0 && solved && <span className="lab-pill" data-state="ok">✓ lit!</span>}
    </ControlBar>
  );

  const footer = (
    <>
      {goals.length > 0 && (
        <RevealSolution available={!solved} buttonLabel="Stuck? hint" solution={<>Flip the switches so the gate(s) output a 1 into <b>{goals.map((g) => g.label ?? g.id).join(', ')}</b>.</>} onReveal={() => { /* hint only — no auto-solve for an open circuit */ }} note="Try each switch combination — the wires glow when they carry a 1." />
      )}
      <HintLadder hints={hints} />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
