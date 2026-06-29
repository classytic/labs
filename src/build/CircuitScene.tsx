'use client';

/**
 * CircuitScene — pure render of a CircuitDoc. It solves the doc, draws a wire from
 * every part pin to the node it names, places a junction dot where 3+ pins meet, and
 * lets each PartDef draw its own glyph with the solved state. Live branches carry
 * moving charge dots. No drawing logic lives here: parts own their look.
 *
 * Read-only by default. Pass `onPartTap` for click-to-operate (learner), or an
 * `editor` bag for authoring (selection + pin handles for wiring). A node with no
 * explicit `at` is drawn at the centroid of the terminals wired to it, so the
 * author never has to place junctions by hand.
 */

import { useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { useFrameLoop, type Vec2 } from '@classytic/stage';
import { JunctionDot, Wire, FlowDots } from '../kit/electronics.js';
import { useReducedMotion } from '../kit/anim.js';
import { getPart } from './registry.js';
import { solveCircuit, partState } from './solve.js';
import { wireCurrents, pinKey, nodeKey, FLOW_EPS } from './flow.js';
import { wirePolyline } from './editor-ops.js';
import type { CircuitDoc } from './contract.js';
import { registerBuiltinParts } from './parts.js';

registerBuiltinParts(); // explicit call so the registration is not tree-shaken away

export interface CircuitEditorBag {
  /** draw a small handle at every pin terminal (for wiring). */
  showPins?: boolean;
  /** a part body was clicked (select it). */
  onSelect?: (partId: string) => void;
  /** the pin a pending wire starts from (highlighted). */
  wireStart?: { partId: string; pin: string };
  /** pointer went down on a part body (begin a drag). */
  onPartPointerDown?: (partId: string, e: ReactPointerEvent) => void;
  /** pointer went down on a pin: a click wires it, a drag moves the part (click-vs-drag). */
  onPinPointerDown?: (partId: string, pin: string, e: ReactPointerEvent) => void;
  /** a wire edge was clicked (select / branch / delete — the editor decides). */
  onWireClick?: (wireId: string) => void;
  /** highlight one wire as selected. */
  selectedWireId?: string;
  /** pointer went down on the BODY of the selected wire (grab to bend / reroute it). */
  onWireBodyDown?: (wireId: string, e: ReactPointerEvent) => void;
  /** pointer went down on an existing bend handle (drag to move that bend). */
  onWireWaypointDown?: (wireId: string, index: number, e: ReactPointerEvent) => void;
  /** pointer went down on a wire's endpoint ring (drag to detach / re-target that end). */
  onWireEndDown?: (wireId: string, end: 'a' | 'b', e: ReactPointerEvent) => void;
  /** the empty canvas was pressed (clear selection, or drop a routing bend while drawing). */
  onBackground?: (e: ReactPointerEvent) => void;
  /** live rubber-band while drawing a wire: origin terminal → any dropped bends → the cursor. */
  wirePreview?: { from: Vec2; mids?: Vec2[]; to: Vec2; valid?: boolean };
}

export interface CircuitSceneProps {
  doc: CircuitDoc;
  /** show moving charge dots on live wires (default true). */
  flow?: boolean;
  ariaLabel?: string;
  /** when set, tappable parts (e.g. switches) are clickable and call this with the part id. */
  onPartTap?: (partId: string) => void;
  /** highlight one part as selected (authoring). */
  selectedId?: string;
  /** authoring affordances; omit for the read-only / learner view. */
  editor?: CircuitEditorBag;
}

/** Manhattan route terminal → node: straight when aligned, else a single elbow (vertical-first). */
function orthRoute(a: Vec2, b: Vec2): [number, number][] {
  if (a.x === b.x || a.y === b.y) return [[a.x, a.y], [b.x, b.y]];
  return [[a.x, a.y], [a.x, b.y], [b.x, b.y]];
}

export function CircuitScene({ doc, flow = true, ariaLabel = 'circuit diagram', onPartTap, selectedId, editor }: CircuitSceneProps): ReactNode {
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();
  const W = doc.size?.w ?? 520;
  const H = doc.size?.h ?? 220;

  const sol = solveCircuit(doc);
  const states = new Map(doc.parts.map((p) => [p.id, partState(p, sol)]));
  const anyLive = [...states.values()].some((s) => s.live);

  // Real per-wire current (graph-Laplacian flow): a wire is "live" only when it actually
  // carries current, and the sign gives the flow direction, so dead/bypassed branches stay
  // dark instead of animating just because their net is energised.
  const wf = wireCurrents(doc, sol);

  const termOf = (partId: string, pin: string): Vec2 | undefined => {
    const p = doc.parts.find((x) => x.id === partId);
    const def = p && getPart(p.kind);
    return def ? def.terminalAt(p, pin) : undefined;
  };
  const rev = (s: [number, number][]): [number, number][] => [...s].reverse();

  // node-id connections that are genuinely shared (≥2 pins) or hand-placed: drawn the
  // declarative way (pin → node point). Single-pin nodes are unconnected, so skipped.
  const termsByNode = new Map<string, Vec2[]>();
  for (const p of doc.parts) {
    const def = getPart(p.kind);
    if (!def) continue;
    for (const pin of def.pins) {
      const nid = p.pins[pin];
      if (!nid) continue;
      (termsByNode.get(nid) ?? termsByNode.set(nid, []).get(nid)!).push(def.terminalAt(p, pin));
    }
  }
  const explicit = new Map(doc.nodes.map((n) => [n.id, n.at]));
  const nodePos = (nid: string): Vec2 => {
    const fixed = explicit.get(nid);
    if (fixed) return fixed;
    const ts = termsByNode.get(nid) ?? [];
    return ts.length ? { x: ts.reduce((s, t) => s + t.x, 0) / ts.length, y: ts.reduce((s, t) => s + t.y, 0) / ts.length } : { x: W / 2, y: H / 2 };
  };
  const drawnNode = (nid: string): boolean => explicit.has(nid) || (termsByNode.get(nid)?.length ?? 0) >= 2;

  useFrameLoop((f) => setPhase((p) => (p + f.dtMs / 1400) % 1), { running: flow && anyLive && !reduce });

  const wires: ReactNode[] = [];
  const live: [number, number][][] = [];
  const pinHandles: ReactNode[] = [];
  const wireEndpoints = new Map<string, number>(); // pinKey → # of wire ends (tee detection)
  const bump = (k: string): void => { wireEndpoints.set(k, (wireEndpoints.get(k) ?? 0) + 1); };

  // declarative pin → node stubs
  for (const p of doc.parts) {
    const def = getPart(p.kind);
    if (!def) continue;
    for (const pin of def.pins) {
      const nid = p.pins[pin];
      if (!nid || !drawnNode(nid)) continue;
      const seg = orthRoute(def.terminalAt(p, pin), nodePos(nid));
      // I = current pin → node; the wire is live only if it really carries current.
      const I = wf.current(pinKey(p.id, pin), nodeKey(nid));
      const isLive = Math.abs(I) > FLOW_EPS;
      wires.push(<Wire key={`stub-${p.id}-${pin}`} points={seg} live={isLive} />);
      // dots advance toward points[0]; reverse so a pin→node flow reads part → node on screen.
      if (isLive) live.push(I > 0 ? rev(seg) : seg);
    }
  }
  // explicit wire edges (the editor model): terminal → terminal, parts stay put
  for (const w of doc.wires ?? []) {
    const ta = termOf(w.a.partId, w.a.pin);
    const tb = termOf(w.b.partId, w.b.pin);
    if (!ta || !tb) continue;
    const seg = wirePolyline(ta, w.mid ?? [], tb).map((p): [number, number] => [p.x, p.y]);
    const ptStr = seg.map((q) => `${q[0]},${q[1]}`).join(' ');
    const isSel = editor?.selectedWireId === w.id;
    // I = current a → b through THIS wire (zero on a bypassed / dead branch).
    const I = wf.current(pinKey(w.a.partId, w.a.pin), pinKey(w.b.partId, w.b.pin));
    const isLive = Math.abs(I) > FLOW_EPS;
    wires.push(
      <g key={`wire-${w.id}`} style={{ cursor: editor?.onWireClick ? 'pointer' : 'default' }}
        onClick={editor?.onWireClick ? (e) => { e.stopPropagation(); editor.onWireClick!(w.id); } : undefined}>
        {isSel && <polyline points={ptStr} fill="none" stroke="var(--stage-accent)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />}
        <Wire points={seg} live={isLive} />
        {/* wide transparent grab-band ON TOP of the wire: click selects, drag (when selected) bends it */}
        {editor?.onWireClick && (
          <polyline points={ptStr} fill="none" stroke="transparent" strokeWidth={isSel ? 20 : 14} strokeLinecap="round" strokeLinejoin="round"
            style={{ cursor: isSel ? 'move' : 'pointer', pointerEvents: 'stroke' }}
            onPointerDown={isSel && editor.onWireBodyDown ? (e) => { e.stopPropagation(); editor.onWireBodyDown!(w.id, e); } : undefined} />
        )}
        {isSel && (w.mid ?? []).map((m, i) => (
          <rect key={`wp-${i}`} x={m.x - 5} y={m.y - 5} width={10} height={10} rx={2}
            fill="var(--stage-bg)" stroke="var(--stage-accent)" strokeWidth={2} style={{ cursor: 'move' }}
            onPointerDown={editor.onWireWaypointDown ? (e) => { e.stopPropagation(); editor.onWireWaypointDown!(w.id, i, e); } : undefined} />
        ))}
      </g>,
    );
    if (isLive) live.push(I > 0 ? rev(seg) : seg);
    bump(`${w.a.partId} ${w.a.pin}`);
    bump(`${w.b.partId} ${w.b.pin}`);
  }
  // pin handles for wiring
  if (editor?.showPins) {
    for (const p of doc.parts) {
      const def = getPart(p.kind);
      if (!def) continue;
      for (const pin of def.pins) {
        const t = def.terminalAt(p, pin);
        const armed = editor.wireStart?.partId === p.id && editor.wireStart?.pin === pin;
        pinHandles.push(
          <circle
            key={`pin-${p.id}-${pin}`}
            cx={t.x} cy={t.y} r={armed ? 7 : 5.5}
            fill={armed ? 'var(--stage-accent)' : 'var(--stage-bg)'}
            stroke="var(--stage-accent)" strokeWidth={2}
            style={{ cursor: 'crosshair' }}
            role="button" aria-label={`${pin} of ${def.label}`}
            onPointerDown={(e) => { e.stopPropagation(); editor.onPinPointerDown?.(p.id, pin, e); }}
          />,
        );
      }
    }
  }

  // junction dots: shared declarative nodes (>2 pins), and pins where wires tee (≥2 ends)
  const dots: ReactNode[] = [];
  for (const [nid, ts] of termsByNode) if (drawnNode(nid) && ts.length > 2) { const np = nodePos(nid); dots.push(<JunctionDot key={`j-${nid}`} x={np.x} y={np.y} live={false} />); }
  for (const [key, n] of wireEndpoints) if (n >= 2) { const [partId, pin] = key.split(' '); const t = partId && pin ? termOf(partId, pin) : undefined; if (t) dots.push(<JunctionDot key={`jw-${key}`} x={t.x} y={t.y} live={false} />); }

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ariaLabel}>
        {/* background: click empty canvas to clear selection / cancel a pending wire */}
        {editor?.onBackground && <rect x={0} y={0} width={W} height={H} fill="transparent" onPointerDown={(e) => editor.onBackground!(e)} />}
        {wires}
        {flow && !reduce && live.map((seg, k) => <FlowDots key={`f${k}`} points={seg} phase={phase} spacing={54} r={2.3} />)}
        {dots}
        {editor?.wirePreview && (() => {
          const { from, mids = [], to, valid } = editor.wirePreview!;
          const pts = [from, ...mids, to];
          const col = 'var(--stage-accent)';
          return (
            <g style={{ pointerEvents: 'none' }}>
              <polyline points={pts.map((q) => `${q.x},${q.y}`).join(' ')} fill="none" stroke={col} strokeWidth={2.5} strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
              {/* the bends dropped so far */}
              {mids.map((m, i) => <circle key={i} cx={m.x} cy={m.y} r={3.5} fill={col} />)}
              {/* filled dot = snapping onto a pin or a wire (will connect); hollow = a free point */}
              <circle cx={to.x} cy={to.y} r={valid ? 6 : 5} fill={valid ? col : 'var(--stage-bg)'} stroke={col} strokeWidth={2} />
            </g>
          );
        })()}
        {doc.parts.map((p) => {
          const def = getPart(p.kind);
          if (!def) return null;
          const glyph = def.render(p, states.get(p.id)!);
          const tappable = !!onPartTap && (def.tap?.(p) ?? null) !== null;
          const selectable = !!editor?.onSelect;
          const selected = selectedId === p.id;
          if (!tappable && !selectable && !selected) return glyph;
          const onActivate = selectable ? () => editor!.onSelect!(p.id) : tappable ? () => onPartTap!(p.id) : undefined;
          const label = !selectable && tappable ? `toggle ${def.label.toLowerCase()}` : `select ${def.label.toLowerCase()}`;
          return (
            <g
              key={`hit-${p.id}`}
              role={onActivate ? 'button' : undefined}
              tabIndex={onActivate ? 0 : undefined}
              aria-label={onActivate ? label : undefined}
              style={{ cursor: editor?.onPartPointerDown ? 'move' : onActivate ? 'pointer' : 'default' }}
              onPointerDown={editor?.onPartPointerDown ? (e) => editor.onPartPointerDown!(p.id, e) : undefined}
              onClick={onActivate ? (e) => { e.stopPropagation(); onActivate(); } : undefined}
              onKeyDown={onActivate ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(); } } : undefined}
            >
              {selected && <rect x={p.at.x - 40} y={p.at.y - 30} width={80} height={60} rx={8} fill="none" stroke="var(--stage-accent)" strokeWidth={1.5} strokeDasharray="4 3" />}
              {(tappable || selectable) && <rect x={p.at.x - 38} y={p.at.y - 28} width={76} height={56} rx={8} fill="transparent" />}
              {glyph}
            </g>
          );
        })}
        {/* real-effects damage marks: a part that exceeds its rating burns / breaks down */}
        {doc.parts.map((p) => {
          const dmg = states.get(p.id)?.damage;
          if (!dmg) return null;
          const c = 'var(--stage-danger, #e03131)';
          return (
            <g key={`dmg-${p.id}`} style={{ pointerEvents: 'none' }}>
              <rect x={p.at.x - 34} y={p.at.y - 24} width={68} height={48} rx={8} fill="color-mix(in oklab, var(--stage-danger, #e03131) 14%, transparent)" stroke={c} strokeWidth={2} strokeDasharray="3 3" />
              <text x={p.at.x} y={p.at.y - 30} fill={c} fontSize={14} fontWeight={800} textAnchor="middle" dominantBaseline="auto">{dmg === 'overpower' ? '🔥' : '⚡'}</text>
            </g>
          );
        })}
        {pinHandles}
        {/* endpoint rings on the selected wire — drag one off its pin to detach / re-target it */}
        {editor?.selectedWireId && editor.onWireEndDown && (() => {
          const w = (doc.wires ?? []).find((x) => x.id === editor.selectedWireId);
          if (!w) return null;
          const ends: { end: 'a' | 'b'; t: Vec2 | undefined }[] = [
            { end: 'a', t: termOf(w.a.partId, w.a.pin) },
            { end: 'b', t: termOf(w.b.partId, w.b.pin) },
          ];
          return ends.map(({ end, t }) => t && (
            <circle key={`we-${end}`} cx={t.x} cy={t.y} r={7.5} fill="var(--stage-bg)" stroke="var(--stage-accent)" strokeWidth={2.5}
              style={{ cursor: 'grab' }} role="button" aria-label={`wire end ${end}`}
              onPointerDown={(e) => { e.stopPropagation(); editor.onWireEndDown!(w.id, end, e); }} />
          ));
        })()}
      </svg>
    </div>
  );
}
