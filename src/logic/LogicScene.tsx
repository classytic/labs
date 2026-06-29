'use client';

/**
 * LogicScene — pure render of a LogicDoc. It evaluates the doc, lays the network out by
 * propagation level (inputs left, gates by depth, outputs right), and draws each wire in
 * the live colour when it carries a HIGH — so you can SEE which signal is propagating.
 * Inputs are tappable switches; outputs can be tapped too (predict-the-output challenges).
 * A `reveal` level lights the signal up step by step. No logic lives here: gates own their
 * shape (GateGlyph) and the engine owns the evaluation.
 */

import type { ReactNode } from 'react';
import { GateGlyph, gatePorts, Lamp, ToggleSwitch, type GateType } from '../kit/logic-gates.js';
import { Wire, JunctionDot } from '../kit/electronics.js';
import { getGate } from './registry.js';
import { evaluate } from './evaluate.js';
import type { LogicDoc } from './contract.js';

export interface LogicSceneProps {
  doc: LogicDoc;
  /** tap an input switch to toggle it. */
  onToggleInput?: (id: string) => void;
  /** tap an output LED (e.g. to cycle a predicted value in a challenge). */
  onOutputClick?: (id: string) => void;
  /** what to show on each output (default its actual 0/1); a challenge can return '?' or a guess. */
  outputText?: (id: string, actual: boolean) => string;
  /** mark each output correct/incorrect/neutral (a challenge ring). */
  outputState?: (id: string, actual: boolean) => 'ok' | 'no' | undefined;
  /** light the signal only through this many propagation levels (step-by-step). Default: all. */
  reveal?: number;
  /** print 0/1 beside inputs and gates. */
  showValues?: boolean;
  ariaLabel?: string;
}

const COL = 128, ROW = 66, MX = 34, MY = 30;
const SW_W = 50, SW_H = 26, GATE = 48, LED_R = 16;

// a categorical palette so each net (signal) reads as its own colour and stays traceable where
// wires cross — inputs get the first, most-distinct hues. (A trace palette, not a theme token.)
const NET_HUES = [
  'oklch(0.62 0.19 255)', // blue
  'oklch(0.70 0.17 50)',  // orange
  'oklch(0.62 0.20 320)', // magenta
  'oklch(0.68 0.16 160)', // teal
  'oklch(0.62 0.21 25)',  // red
  'oklch(0.66 0.15 200)', // cyan
  'oklch(0.64 0.18 290)', // violet
  'oklch(0.72 0.16 110)', // yellow-green
];

export function LogicScene({ doc, onToggleInput, onOutputClick, outputText, outputState, reveal, showValues, ariaLabel = 'logic circuit' }: LogicSceneProps): ReactNode {
  const sol = evaluate(doc);
  const levelOf = (id: string): number => sol.depthOf(id);
  const lit = (id: string): boolean => sol.high(id) && (reveal === undefined || levelOf(id) < reveal);

  // place inputs (level 0) and gates (level = depth) in columns; outputs in the last column.
  // Each item is CENTRED in its row-slot (pos.y / outY are item CENTRES) so a gate sits on the
  // midpoint of its inputs and lines up with its output LED; then the canvas is shifted + sized to
  // the real content so the diagram is vertically balanced instead of clustered at the top.
  const cols = sol.levels.length;
  const colCount = Math.max(1, ...sol.levels.map((l) => l.length), doc.outputs.length);
  const slotC = (n: number, i: number): number => ((colCount - n) * ROW) / 2 + i * ROW + ROW / 2; // relative row-slot centre
  const halfH = (gate: boolean): number => (gate ? GATE : SW_H) / 2;
  type P = { x: number; y: number; gate: boolean };
  const raw = new Map<string, P>();
  sol.levels.forEach((ids, lvl) => ids.forEach((id, i) => raw.set(id, { x: MX + lvl * COL, y: slotC(ids.length, i), gate: lvl > 0 })));
  const outRaw = doc.outputs.map((o, i) => ({ id: o.id, y: slotC(doc.outputs.length, i) }));

  let top = Infinity, bot = -Infinity;
  raw.forEach((p) => { top = Math.min(top, p.y - halfH(p.gate)); bot = Math.max(bot, p.y + halfH(p.gate)); });
  outRaw.forEach((o) => { top = Math.min(top, o.y - LED_R); bot = Math.max(bot, o.y + LED_R); });
  const vOff = MY - top;                                              // bring the topmost item to MY
  const pos = new Map<string, P>();
  raw.forEach((p, id) => pos.set(id, { x: p.x, y: p.y + vOff, gate: p.gate }));
  const outX = MX + cols * COL;
  const outY = new Map(outRaw.map((o) => [o.id, o.y + vOff]));

  // a node's OUTPUT port (right side): input switch right edge, or the gate's output port.
  // null for an unknown / dangling source so we never draw a stray wire from (0,0).
  const outPort = (id: string): { x: number; y: number } | null => {
    const p = pos.get(id);
    if (!p) return null;
    if (!p.gate) return { x: p.x + SW_W, y: p.y };
    const g = doc.gates.find((q) => q.id === id);
    const gl = (g && getGate(g.kind)?.glyph) ?? 'AND';
    return gatePorts(gl as GateType, p.x, p.y - GATE / 2, GATE).output;
  };

  const W = outX + 80, H = (bot - top) + MY * 2;

  // ── routing: collect every sink each source drives, then draw each net as ONE TRUNK (a comb) —
  //    a single vertical bus with horizontal teeth to each sink — instead of N independent wires
  //    that overlap. Trunks are staggered per source so different nets don't sit on top of each
  //    other, and each net is COLOURED so you can trace a signal even where wires cross. Brightness
  //    = the net is carrying a 1. Junction dots mark real T-taps on a trunk.
  const sinkPorts = new Map<string, { x: number; y: number }[]>();
  const addSink = (src: string, p: { x: number; y: number } | null): void => {
    if (!src || !p) return; const arr = sinkPorts.get(src) ?? []; arr.push(p); sinkPorts.set(src, arr);
  };
  for (const g of doc.gates) {
    const p = pos.get(g.id); if (!p) continue;
    const gl = (getGate(g.kind)?.glyph ?? 'AND') as GateType;
    const ins = gatePorts(gl, p.x, p.y - GATE / 2, GATE).inputs;
    g.in.forEach((src, k) => addSink(src, ins[k] ?? null));
  }
  for (const o of doc.outputs) addSink(o.in, { x: outX - LED_R - 4, y: outY.get(o.id) ?? MY });

  const order = new Map<string, number>();
  let oi = 0;
  doc.inputs.forEach((i) => order.set(i.id, oi++));
  doc.gates.forEach((g) => order.set(g.id, oi++));
  const hue = (src: string): string => NET_HUES[(order.get(src) ?? 0) % NET_HUES.length]!;

  // stagger the trunk x within each source column so combs don't coincide
  const byCol = new Map<number, string[]>();
  for (const src of sinkPorts.keys()) { const sp = outPort(src); if (!sp) continue; const k = Math.round(sp.x); const a = byCol.get(k) ?? []; a.push(src); byCol.set(k, a); }
  const trunkX = new Map<string, number>();
  byCol.forEach((srcs) => {
    srcs.sort((a, b) => (outPort(a)?.y ?? 0) - (outPort(b)?.y ?? 0));
    srcs.forEach((src, i) => {
      const sp = outPort(src)!; const near = Math.min(...sinkPorts.get(src)!.map((s) => s.x));
      trunkX.set(src, sp.x + Math.min(14 + i * 11, Math.max(8, near - sp.x - 8)));
    });
  });

  const wires: ReactNode[] = [];
  const junctions: ReactNode[] = [];
  sinkPorts.forEach((list, src) => {
    const sp = outPort(src); if (!sp) return;
    const on = lit(src), col = hue(src), tx = trunkX.get(src) ?? sp.x + 14;
    const ys = [sp.y, ...list.map((s) => s.y)];
    const lo = Math.min(...ys), hi = Math.max(...ys);
    wires.push(<Wire key={`e-${src}`} points={[[sp.x, sp.y], [tx, sp.y]]} live={on} color={col} />);
    if (hi - lo > 1) wires.push(<Wire key={`t-${src}`} points={[[tx, lo], [tx, hi]]} live={on} color={col} />);
    list.forEach((s, i) => wires.push(<Wire key={`b-${src}-${i}`} points={[[tx, s.y], [s.x, s.y]]} live={on} color={col} />));
    const tap = (yy: number, k: string): void => { if (yy > lo + 0.5 && yy < hi - 0.5) junctions.push(<JunctionDot key={`j-${src}-${k}`} x={tx} y={yy} r={3} live={on} color={col} />); };
    tap(sp.y, 's'); list.forEach((s, i) => tap(s.y, `${i}`));
  });

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', maxWidth: W, margin: '0 auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ariaLabel}>
        {wires}
        {junctions}
        {/* inputs */}
        {doc.inputs.map((inp) => {
          const p = pos.get(inp.id); if (!p) return null;
          return (
            <g key={inp.id} role={onToggleInput ? 'button' : undefined} tabIndex={onToggleInput ? 0 : undefined} aria-label={onToggleInput ? `toggle ${inp.label ?? inp.id}` : undefined}
              style={{ cursor: onToggleInput ? 'pointer' : 'default' }}
              onClick={onToggleInput ? () => onToggleInput(inp.id) : undefined}
              onKeyDown={onToggleInput ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleInput(inp.id); } } : undefined}>
              <ToggleSwitch x={p.x} y={p.y - SW_H / 2} w={SW_W} h={SW_H} on={sol.value(inp.id)} label={inp.label} />
              {showValues && (() => { const on = sol.value(inp.id); return <text x={on ? p.x + SW_H * 0.55 : p.x + SW_W - SW_H * 0.55} y={p.y} fill="var(--stage-fg)" fontSize={11} fontWeight={800} textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>{on ? '1' : '0'}</text>; })()}
            </g>
          );
        })}
        {/* gates */}
        {doc.gates.map((g) => {
          const p = pos.get(g.id); if (!p) return null;
          const gl = (getGate(g.kind)?.glyph ?? 'AND') as GateType;
          const op = gatePorts(gl, p.x, p.y - GATE / 2, GATE).output;
          return (
            <g key={g.id}>
              <GateGlyph x={p.x} y={p.y - GATE / 2} size={GATE} type={gl} live={lit(g.id)} label={g.label ?? getGate(g.kind)?.label} />
              {/* the 0/1 sits at the gate's OUTPUT end (on the wire), tinted to the net colour */}
              {showValues && <text x={op.x + 4} y={op.y - 6} fill={lit(g.id) ? hue(g.id) : 'var(--stage-muted)'} fontSize={11} fontWeight={800} textAnchor="start" dominantBaseline="auto" style={{ pointerEvents: 'none' }}>{sol.value(g.id) ? '1' : '0'}</text>}
            </g>
          );
        })}
        {/* outputs (LEDs) */}
        {doc.outputs.map((o) => {
          const oy = outY.get(o.id) ?? MY; const actual = sol.outputs[o.id] ?? false;
          const st = outputState?.(o.id, actual);
          const txt = outputText?.(o.id, actual) ?? (actual ? '1' : '0');
          return (
            <g key={o.id} role={onOutputClick ? 'button' : undefined} tabIndex={onOutputClick ? 0 : undefined} aria-label={onOutputClick ? `set ${o.label ?? o.id}` : undefined}
              style={{ cursor: onOutputClick ? 'pointer' : 'default' }}
              onClick={onOutputClick ? () => onOutputClick(o.id) : undefined}
              onKeyDown={onOutputClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOutputClick(o.id); } } : undefined}>
              {st && <circle cx={outX} cy={oy} r={LED_R + 6} fill="none" stroke={st === 'ok' ? 'var(--stage-good)' : 'var(--stage-danger, #e03131)'} strokeWidth={2} />}
              <Lamp cx={outX} cy={oy} r={LED_R} on={lit(o.in)} color={o.color} label={o.label} />
              <text x={outX} y={oy} fill={lit(o.in) ? 'var(--stage-bg)' : 'var(--stage-fg)'} fontSize={14} fontWeight={800} textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>{txt}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
