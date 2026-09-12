'use client';

/**
 * LogicEditScene — the free-placement canvas for the LogicEditor. Unlike LogicScene (which
 * auto-lays-out by propagation level), every node here sits at its own x/y so the learner can
 * drag it around. It draws the live circuit (wires glow where the signal is HIGH, LEDs light)
 * AND the editing affordances: a drag hit-area per node and clickable port dots (click an
 * OUT dot then an IN slot to wire). No editing logic lives here, the editor drives it.
 */

import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from 'react';
import { GateGlyph, gatePorts, Lamp, ToggleSwitch, type GateType } from '../kit/logic-gates/index.js';
import { Wire, orthPoints, JunctionDot } from '../kit/electronics/index.js';
import { getGate } from './registry.js';
import { evaluate } from './evaluate.js';
import type { LogicDoc } from './contract.js';
import type { PortRef } from './edit-ops.js';

export const SW_W = 52,
  SW_H = 28,
  GATE = 50,
  LED_R = 15;

const glyphOf = (kind: string): GateType => (getGate(kind)?.glyph ?? 'AND') as GateType;
const xy = (n: { x?: number; y?: number }, dx: number, dy: number): { x: number; y: number } => ({
  x: n.x ?? dx,
  y: n.y ?? dy,
});

export interface LogicEditSceneProps {
  doc: LogicDoc;
  selectedId?: string;
  wireStart?: PortRef;
  /** cursor position (canvas coords) while a wire is pending: the rubber-band trails to it. */
  previewCursor?: { x: number; y: number };
  onNodePointerDown?: (id: string, e: ReactPointerEvent) => void;
  onPortPointerDown?: (ref: PortRef, e: ReactPointerEvent) => void;
  onBackground?: () => void;
  ariaLabel?: string;
  /** pan/zoom viewBox override (from useCanvasViewport). Omit for the fixed default view. */
  viewBox?: string;
  /** explicit pixel height so the canvas fills a tall, pannable area (editor). */
  pxHeight?: number;
}

export function LogicEditScene({
  doc,
  selectedId,
  wireStart,
  previewCursor,
  onNodePointerDown,
  onPortPointerDown,
  onBackground,
  ariaLabel,
  viewBox,
  pxHeight,
}: LogicEditSceneProps): ReactNode {
  const sol = evaluate(doc);
  const W = doc.size?.w ?? 640,
    H = doc.size?.h ?? 360;
  // the visible scene rect: the pan/zoom viewBox when panning, else the fixed world box.
  const vb = viewBox ? viewBox.split(' ').map(Number) : [0, 0, W, H];
  const [vbx, vby, vbw, vbh] = vb as [number, number, number, number];

  const pos = new Map<string, { x: number; y: number }>();
  doc.inputs.forEach((n, i) => pos.set(n.id, xy(n, 40, 40 + i * 56)));
  doc.gates.forEach((n, i) => pos.set(n.id, xy(n, 260, 60 + i * 80)));
  doc.outputs.forEach((n, i) => pos.set(n.id, xy(n, W - 80, 60 + i * 70)));

  const outPort = (id: string): { x: number; y: number } | null => {
    const p = pos.get(id);
    if (!p) return null;
    if (doc.inputs.some((n) => n.id === id)) return { x: p.x + SW_W, y: p.y + SW_H / 2 };
    const g = doc.gates.find((n) => n.id === id);
    if (g) return gatePorts(glyphOf(g.kind), p.x, p.y, GATE).output;
    return null;
  };
  const gateInPorts = (id: string): { x: number; y: number }[] => {
    const p = pos.get(id);
    const g = doc.gates.find((n) => n.id === id);
    if (!p || !g) return [];
    return gatePorts(glyphOf(g.kind), p.x, p.y, GATE).inputs;
  };
  const outInPort = (id: string): { x: number; y: number } | null => {
    const p = pos.get(id);
    return p ? { x: p.x, y: p.y + LED_R } : null;
  };

  // --- wires (behind the nodes) --- the SAME orthogonal Wire primitive the electronics + auto-layout
  // scenes use (one wire model across every scene), with a JunctionDot wherever a source fans out.
  const wires: ReactNode[] = [];
  const wire = (
    key: string,
    a: { x: number; y: number } | null,
    b: { x: number; y: number } | null,
    on: boolean,
  ): void => {
    if (!a || !b) return;
    wires.push(<Wire key={key} points={orthPoints(a, b)} live={on} />);
  };
  doc.gates.forEach((g) =>
    g.in.forEach((src, i) => {
      if (src) wire(`w-${g.id}-${i}`, outPort(src), gateInPorts(g.id)[i] ?? null, sol.high(src));
    }),
  );
  doc.outputs.forEach((o) => {
    if (o.in) wire(`wo-${o.id}`, outPort(o.in), outInPort(o.id), sol.high(o.in));
  });

  const fanout = new Map<string, number>();
  const bump = (id: string): void => {
    if (id) fanout.set(id, (fanout.get(id) ?? 0) + 1);
  };
  doc.gates.forEach((g) => g.in.forEach(bump));
  doc.outputs.forEach((o) => bump(o.in));
  const junctions: ReactNode[] = [];
  fanout.forEach((n, src) => {
    if (n >= 2) {
      const sp = outPort(src);
      if (sp) junctions.push(<JunctionDot key={`j-${src}`} x={sp.x} y={sp.y} r={3.5} live={sol.high(src)} />);
    }
  });

  const isStart = (r: PortRef): boolean =>
    !!wireStart && wireStart.nodeId === r.nodeId && wireStart.dir === r.dir && wireStart.slot === r.slot;
  const portDot = (ref: PortRef, at: { x: number; y: number } | null, on: boolean): ReactNode => {
    if (!at) return null;
    const start = isStart(ref);
    return (
      <g
        className="logic-port-target"
        key={`p-${ref.nodeId}-${ref.dir}-${ref.slot ?? 'x'}`}
        onPointerDown={(e) => {
          e.stopPropagation();
          onPortPointerDown?.(ref, e);
        }}
      >
        <circle cx={at.x} cy={at.y} r={9} fill="transparent" />
        {start && (
          <circle cx={at.x} cy={at.y} r={7} fill="none" stroke="var(--stage-accent)" strokeWidth={2} />
        )}
        <circle
          cx={at.x}
          cy={at.y}
          r={4}
          fill={on ? 'var(--stage-live)' : 'var(--stage-metal)'}
          stroke="var(--stage-bg)"
          strokeWidth={1}
        />
      </g>
    );
  };

  const selRing = (id: string, x: number, y: number, w: number, h: number): ReactNode =>
    selectedId === id ? (
      <rect
        x={x - 5}
        y={y - 5}
        width={w + 10}
        height={h + 10}
        rx={7}
        fill="none"
        stroke="var(--stage-accent)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
    ) : null;

  return (
    <svg
      viewBox={viewBox ?? `0 0 ${W} ${H}`}
      width="100%"
      height={pxHeight}
      className="logic-edit-scene"
      data-pannable={!!viewBox || undefined}
      style={
        {
          '--logic-edit-width': `${W}px`,
          '--logic-edit-height': pxHeight ? `${pxHeight}px` : undefined,
        } as CSSProperties
      }
      preserveAspectRatio={viewBox ? 'none' : 'xMidYMid meet'}
      role="img"
      aria-label={ariaLabel ?? 'logic circuit builder canvas'}
    >
      <rect
        x={vbx}
        y={vby}
        width={vbw}
        height={vbh}
        fill="transparent"
        onPointerDown={() => onBackground?.()}
      />
      {wires}
      {junctions}

      {/* rubber-band while drawing: from the armed output port to the cursor, snapping to the
          nearest input slot (a filled dot = it will connect there). */}
      {wireStart &&
        previewCursor &&
        (() => {
          const a = outPort(wireStart.nodeId);
          if (!a) return null;
          let target: { x: number; y: number } | null = null,
            bd = 18;
          const consider = (pt: { x: number; y: number } | null): void => {
            if (pt) {
              const d = Math.hypot(previewCursor.x - pt.x, previewCursor.y - pt.y);
              if (d < bd) {
                bd = d;
                target = pt;
              }
            }
          };
          doc.gates.forEach((g) => gateInPorts(g.id).forEach((pt) => consider(pt)));
          doc.outputs.forEach((o) => consider(outInPort(o.id)));
          const b: { x: number; y: number } = target ?? previewCursor;
          const dx = Math.max(18, Math.abs(b.x - a.x) * 0.45);
          return (
            <g className="logic-svg-passive">
              <path
                d={`M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`}
                fill="none"
                stroke="var(--stage-accent)"
                strokeWidth={2.5}
                strokeDasharray="5 4"
                strokeLinecap="round"
                opacity={0.9}
              />
              <circle
                cx={b.x}
                cy={b.y}
                r={target ? 6 : 4}
                fill={target ? 'var(--stage-accent)' : 'var(--stage-bg)'}
                stroke="var(--stage-accent)"
                strokeWidth={2}
              />
            </g>
          );
        })()}

      {/* inputs */}
      {doc.inputs.map((inp) => {
        const p = pos.get(inp.id)!;
        return (
          <g key={inp.id}>
            {selRing(inp.id, p.x, p.y, SW_W, SW_H)}
            <g className="logic-node-drag" onPointerDown={(e) => onNodePointerDown?.(inp.id, e)}>
              <ToggleSwitch x={p.x} y={p.y} w={SW_W} h={SW_H} on={sol.value(inp.id)} label={inp.label} />
            </g>
            {portDot({ nodeId: inp.id, dir: 'out' }, outPort(inp.id), sol.high(inp.id))}
          </g>
        );
      })}

      {/* gates */}
      {doc.gates.map((g) => {
        const p = pos.get(g.id)!;
        const ins = gateInPorts(g.id);
        return (
          <g key={g.id}>
            {selRing(g.id, p.x, p.y, GATE, GATE)}
            <g className="logic-node-drag" onPointerDown={(e) => onNodePointerDown?.(g.id, e)}>
              <GateGlyph
                x={p.x}
                y={p.y}
                size={GATE}
                type={glyphOf(g.kind)}
                live={sol.high(g.id)}
                label={g.label ?? getGate(g.kind)?.label}
              />
            </g>
            {ins.map((_, i) =>
              portDot({ nodeId: g.id, dir: 'in', slot: i }, ins[i] ?? null, !!g.in[i] && sol.high(g.in[i]!)),
            )}
            {portDot({ nodeId: g.id, dir: 'out' }, outPort(g.id), sol.high(g.id))}
          </g>
        );
      })}

      {/* outputs */}
      {doc.outputs.map((o) => {
        const p = pos.get(o.id)!;
        const lit = !!o.in && sol.high(o.in);
        const met = o.goal !== undefined && (sol.outputs[o.id] ?? false) === o.goal;
        return (
          <g key={o.id}>
            {selRing(o.id, p.x, p.y, LED_R * 2, LED_R * 2)}
            <g className="logic-node-drag" onPointerDown={(e) => onNodePointerDown?.(o.id, e)}>
              <Lamp cx={p.x + LED_R} cy={p.y + LED_R} r={LED_R} on={lit} color={o.color} label={o.label} />
            </g>
            {o.goal !== undefined && (
              <circle
                cx={p.x + LED_R}
                cy={p.y + LED_R}
                r={LED_R + 5}
                fill="none"
                stroke={met ? 'var(--stage-good)' : 'var(--stage-danger, #e03131)'}
                strokeWidth={2}
              />
            )}
            {portDot({ nodeId: o.id, dir: 'in' }, outInPort(o.id), lit)}
          </g>
        );
      })}
    </svg>
  );
}
