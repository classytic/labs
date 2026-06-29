'use client';

/**
 * CircuitEditor — the authoring surface. Pick a part from the palette to drop it on
 * the canvas, drag parts to lay them out, click two pins to wire them, and tune the
 * selected part in the inspector. The doc solves live as you build, so the lamp lights
 * and current flows while you author. Emits the CircuitDoc via `onChange`; the UI is
 * themed from the host's design tokens (see editor-ui).
 */

import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { CircuitScene } from './CircuitScene.js';
import { listParts, getPart } from './registry.js';
import { addPart, movePart, updateProps, rotatePart, deletePart, addWire, disconnectWire, retargetWire, setGround, spliceIntoWire, tapWire, terminalOf, wirePolyline, setWireWaypoints, type PinRef } from './editor-ops.js';
import { solveCircuit, partState } from './solve.js';
import { Panel, EBtn, Field, NumInput, TextInput } from './editor-ui.js';
import type { CircuitDoc } from './contract.js';

export interface CircuitEditorProps {
  value: CircuitDoc;
  onChange: (doc: CircuitDoc) => void;
}

const SNAP = 10;
const snap = (n: number): number => Math.round(n / SNAP) * SNAP;
const emptyDoc: CircuitDoc = { parts: [], nodes: [], size: { w: 560, h: 300 } };

/** distance from point p to segment a→b. */
function segDist(p: { x: number; y: number }, a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / len2)) : 0;
  return Math.hypot(p.x - (a[0] + t * dx), p.y - (a[1] + t * dy));
}

/** the part pin whose terminal is within `thresh` px of point `at` (nearest wins, or null). */
function pinAt(doc: CircuitDoc, at: { x: number; y: number }, thresh = 16): PinRef | null {
  let best: PinRef | null = null, bd = thresh;
  for (const p of doc.parts) {
    const def = getPart(p.kind);
    if (!def) continue;
    for (const pin of def.pins) {
      const t = def.terminalAt(p, pin);
      const d = Math.hypot(at.x - t.x, at.y - t.y);
      if (d < bd) { bd = d; best = { partId: p.id, pin }; }
    }
  }
  return best;
}

/** The full routed polyline of a wire (through its bend points), as tuples. */
function wirePts(doc: CircuitDoc, w: NonNullable<CircuitDoc['wires']>[number]): [number, number][] {
  const ta = terminalOf(doc, w.a), tb = terminalOf(doc, w.b);
  if (!ta || !tb) return [];
  return wirePolyline(ta, w.mid ?? [], tb).map((p): [number, number] => [p.x, p.y]);
}

/** the wire whose routed path passes within `thresh` px of point `at` (or null). */
function wireAt(doc: CircuitDoc, at: { x: number; y: number }, thresh = 16): string | null {
  let best: string | null = null, bestD = thresh;
  for (const w of doc.wires ?? []) {
    const route = wirePts(doc, w);
    for (let i = 0; i < route.length - 1; i++) {
      const d = segDist(at, route[i]!, route[i + 1]!);
      if (d < bestD) { bestD = d; best = w.id; }
    }
  }
  return best;
}

/** A tiny preview of a part's own glyph for the palette (label cropped out of view). */
function PartThumb({ kind }: { kind: string }): ReactNode {
  const def = getPart(kind);
  if (!def) return null;
  const inst = { id: '_t', kind, at: { x: 40, y: 34 }, orient: 'h' as const, props: def.defaultProps, pins: {} };
  const st = { live: false, i: 0, v: 0, power: 0, pinV: () => 0 };
  return <svg viewBox="6 18 68 30" width={46} height={20} aria-hidden style={{ flexShrink: 0 }}>{def.render(inst, st)}</svg>;
}

export function CircuitEditor({ value, onChange }: CircuitEditorProps): ReactNode {
  const doc = value ?? emptyDoc;
  const W = doc.size?.w ?? 560;
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedWire, setSelectedWire] = useState<string | null>(null);
  // a STICKY pending wire: it stays armed after the mouse is released and follows the cursor,
  // so you click one pin, click empty space to drop routing bends, then click another pin (or a
  // wire) to finish. `mids` are the bend points clicked so far.
  const [pending, setPending] = useState<{ from: PinRef; mids: { x: number; y: number }[] } | null>(null);
  const [preview, setPreview] = useState<{ to: { x: number; y: number }; valid: boolean } | null>(null);
  // dragging one END of the selected wire off its pin (detach / re-target)
  const [endDrag, setEndDrag] = useState<{ fixedPos: { x: number; y: number }; to: { x: number; y: number }; valid: boolean } | null>(null);
  const [full, setFull] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  // latest doc/onChange/pending for window-level handlers (which outlive a single render)
  const docRef = useRef(doc); docRef.current = doc;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const pendingRef = useRef(pending); pendingRef.current = pending;
  const previewRef = useRef(preview); previewRef.current = preview;

  const sel = doc.parts.find((p) => p.id === selected) ?? null;
  const selDef = sel ? getPart(sel.kind) : null;
  const sol = solveCircuit(doc);
  const shorted = sol.shorted
    .map((id) => doc.parts.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);
  // parts being destroyed by exceeding a rating (overpower / overvoltage)
  const damaged = doc.parts.map((p) => ({ p, st: partState(p, sol) })).filter((x) => !!x.st.damage);

  const place = (kind: string): void => {
    const d = docRef.current;
    const n = d.parts.length;
    const at = { x: snap(120 + (n % 3) * 150), y: snap(80 + Math.floor(n / 3) * 90) };
    const next = addPart(d, kind, at);
    onChangeRef.current(next);
    setSelected(next.parts[next.parts.length - 1]?.id ?? null);
  };

  // Drag a palette part onto the canvas: drop ON a wire splices it in series, drop on
  // empty canvas places it there; a plain click (released on the palette) cascade-adds.
  const dropAt = (kind: string, clientX: number, clientY: number): void => {
    const host = hostRef.current;
    if (!host) { place(kind); return; }
    const r = host.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) { place(kind); return; }
    const sc = r.width / W;
    const at = { x: snap((clientX - r.left) / sc), y: snap((clientY - r.top) / sc) };
    const d = docRef.current;
    const wid = wireAt(d, at);
    // a Node dropped on a wire TAPS it (splits the wire + joins the junction in); a 2-pin part
    // dropped on a wire splices in series; anything dropped on empty canvas just lands there.
    if (wid && kind === 'node') {
      const { doc: next, pin } = tapWire(d, wid, at);
      onChangeRef.current(next);
      setSelected(pin.partId);
      return;
    }
    const next = wid ? spliceIntoWire(d, wid, kind, at) : addPart(d, kind, at);
    onChangeRef.current(next);
    setSelected(next.parts[next.parts.length - 1]?.id ?? null);
  };
  const startPaletteDrag = (kind: string): void => {
    const up = (ev: PointerEvent): void => { window.removeEventListener('pointerup', up); dropAt(kind, ev.clientX, ev.clientY); };
    window.addEventListener('pointerup', up);
  };

  const toCanvas = (cx: number, cy: number): { x: number; y: number } => {
    const host = hostRef.current;
    if (!host) return { x: 0, y: 0 };
    const r = host.getBoundingClientRect();
    const scale = r.width / W;
    return { x: (cx - r.left) / scale, y: (cy - r.top) / scale };
  };

  // While a wire is pending, the rubber-band follows the cursor WITHOUT the button held; Esc
  // (or a click on empty canvas) cancels. This is the click-to-start / click-to-finish model.
  useEffect(() => {
    if (!pending) { setPreview(null); return; }
    const move = (ev: PointerEvent): void => {
      const at = toCanvas(ev.clientX, ev.clientY);
      const d = docRef.current;
      setPreview({ to: at, valid: !!pinAt(d, at) || !!wireAt(d, at) });
    };
    const key = (ev: KeyboardEvent): void => { if (ev.key === 'Escape') setPending(null); };
    window.addEventListener('pointermove', move);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('keydown', key); };
  }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Create the wire the user drew (a→b) carrying its routing bends. Uses addWire (not connect)
   *  so it is created even between pins already on the same net — a drawn wire never vanishes. */
  const connectWithMids = (d: CircuitDoc, a: PinRef, b: PinRef, mids: { x: number; y: number }[]): CircuitDoc =>
    addWire(d, a, b, mids);

  // Click a pin: with nothing pending it ARMS a wire there; with a wire pending it FINISHES it
  // (carrying any bends), or cancels if you click the same pin again.
  const handlePinClick = (from: PinRef): void => {
    const p = pendingRef.current;
    if (!p) { setPending({ from, mids: [] }); setSelected(from.partId); setSelectedWire(null); return; }
    if (p.from.partId === from.partId && p.from.pin === from.pin) { setPending(null); return; }
    onChangeRef.current(connectWithMids(docRef.current, p.from, from, p.mids));
    setPending(null);
    setSelected(from.partId);
  };

  // Drag a part / junction BODY to move it (grid-snapped); a plain click runs `onClick`.
  const beginMove = (partId: string, e: ReactPointerEvent, onClick: () => void): void => {
    const part = docRef.current.parts.find((p) => p.id === partId);
    const host = hostRef.current;
    if (!part || !host) return;
    e.preventDefault();
    const scale = host.getBoundingClientRect().width / W;
    const sx = e.clientX, sy = e.clientY, ox = part.at.x, oy = part.at.y;
    let moved = false;
    const move = (ev: PointerEvent): void => {
      if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 4) moved = true;
      if (moved) onChangeRef.current(movePart(docRef.current, partId, { x: snap(ox + (ev.clientX - sx) / scale), y: snap(oy + (ev.clientY - sy) / scale) }));
    };
    const up = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (!moved) onClick();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onPartPointerDown = (partId: string, e: ReactPointerEvent): void =>
    beginMove(partId, e, () => { setSelected(partId); setSelectedWire(null); setPending(null); });

  // A pin handle: a junction DRAGS to move (and clicks to wire); a part pin CLICKS to wire.
  const onPinPointerDown = (partId: string, pin: string, e: ReactPointerEvent): void => {
    const isJunction = docRef.current.parts.find((p) => p.id === partId)?.kind === 'node';
    if (isJunction) { beginMove(partId, e, () => handlePinClick({ partId, pin })); return; }
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    let moved = false;
    const move = (ev: PointerEvent): void => { if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 4) moved = true; };
    const up = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (!moved) handlePinClick({ partId, pin });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // Click a wire: with a wire pending it BRANCHES off there (tap → junction, carrying the bends);
  // otherwise it SELECTS the wire (delete it from the inspector) instead of deleting on a click.
  const onWireClick = (wireId: string): void => {
    const p = pendingRef.current;
    if (p) {
      const at = previewRef.current?.to ?? terminalOf(docRef.current, p.from) ?? { x: 0, y: 0 };
      const { doc: d2, pin: jp } = tapWire(docRef.current, wireId, at);
      onChangeRef.current(connectWithMids(d2, p.from, jp, p.mids));
      setPending(null);
      setSelected(jp.partId);
    } else { setSelectedWire(wireId); setSelected(null); }
  };

  // Click empty space: while DRAWING a wire it drops a routing bend there and keeps going (so you
  // route the wire point by point); otherwise it just clears the selection. A bend is only ever
  // born as part of an in-progress wire, never floating.
  const onBackground = (e: ReactPointerEvent): void => {
    const p = pendingRef.current;
    if (p) {
      const at = toCanvas(e.clientX, e.clientY);
      setPending({ from: p.from, mids: [...p.mids, { x: snap(at.x), y: snap(at.y) }] });
      return;
    }
    setSelected(null);
    setSelectedWire(null);
  };

  // ── Position the wire's path: drag a bend handle to move it, or grab the wire body to add a
  // new bend and pull it where you want. Bends grid-snap; a bend dragged back onto the straight
  // line between its neighbours is dropped, so the wire never keeps a useless kink. ──
  const snapPt = (p: { x: number; y: number }): { x: number; y: number } => ({ x: snap(p.x), y: snap(p.y) });

  const pruneCollinear = (ta: { x: number; y: number }, mids: { x: number; y: number }[], tb: { x: number; y: number }): { x: number; y: number }[] => {
    const anchors = [ta, ...mids, tb];
    return mids.filter((m, i) => segDist(m, [anchors[i]!.x, anchors[i]!.y], [anchors[i + 2]!.x, anchors[i + 2]!.y]) > 3);
  };

  const dragBend = (wireId: string, startMids: { x: number; y: number }[], index: number, e: ReactPointerEvent): void => {
    e.preventDefault();
    const d0 = docRef.current;
    const w0 = (d0.wires ?? []).find((x) => x.id === wireId);
    const ta = w0 && terminalOf(d0, w0.a), tb = w0 && terminalOf(d0, w0.b);
    if (!ta || !tb) return;
    let mids = startMids;
    let moved = false;
    const move = (ev: PointerEvent): void => {
      moved = true;
      const at = snapPt(toCanvas(ev.clientX, ev.clientY));
      mids = mids.map((m, i) => (i === index ? at : m));
      onChangeRef.current(setWireWaypoints(docRef.current, wireId, mids));
    };
    const up = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (moved) onChangeRef.current(setWireWaypoints(docRef.current, wireId, pruneCollinear(ta, mids, tb)));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onWireWaypointDown = (wireId: string, index: number, e: ReactPointerEvent): void => {
    const w = (docRef.current.wires ?? []).find((x) => x.id === wireId);
    if (w?.mid) dragBend(wireId, [...w.mid], index, e);
  };

  const onWireBodyDown = (wireId: string, e: ReactPointerEvent): void => {
    const d = docRef.current;
    const w = (d.wires ?? []).find((x) => x.id === wireId);
    const ta = w && terminalOf(d, w.a), tb = w && terminalOf(d, w.b);
    if (!w || !ta || !tb) return;
    const at = toCanvas(e.clientX, e.clientY);
    const mids = [...(w.mid ?? [])];
    // grabbing near an existing bend → move it; otherwise insert a new bend on the nearest leg
    let idx = mids.findIndex((m) => Math.hypot(at.x - m.x, at.y - m.y) < 10);
    if (idx < 0) {
      const anchors = [ta, ...mids, tb];
      let seg = 0, sd = Infinity;
      for (let i = 0; i < anchors.length - 1; i++) { const dd = segDist(at, [anchors[i]!.x, anchors[i]!.y], [anchors[i + 1]!.x, anchors[i + 1]!.y]); if (dd < sd) { sd = dd; seg = i; } }
      mids.splice(seg, 0, snapPt(at));
      idx = seg;
    }
    dragBend(wireId, mids, idx, e);
  };

  // Drag a wire's endpoint ring OFF its pin: a rubber-band trails from the wire's OTHER end to
  // the cursor; release on another pin re-targets that end (detach + reconnect), on a wire taps
  // and re-targets, on empty space snaps back (no change). Delete the wire to fully remove it.
  const onWireEndDown = (wireId: string, end: 'a' | 'b', e: ReactPointerEvent): void => {
    const d0 = docRef.current;
    const w = (d0.wires ?? []).find((x) => x.id === wireId);
    if (!w) return;
    e.preventDefault();
    const fixedPos = terminalOf(d0, end === 'a' ? w.b : w.a) ?? { x: 0, y: 0 };
    setEndDrag({ fixedPos, to: fixedPos, valid: false });
    let moved = false, last = fixedPos;
    const move = (ev: PointerEvent): void => {
      moved = true;
      const at = toCanvas(ev.clientX, ev.clientY);
      last = at;
      setEndDrag({ fixedPos, to: at, valid: !!pinAt(docRef.current, at) || !!wireAt(docRef.current, at) });
    };
    const up = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setEndDrag(null);
      if (!moved) return;
      const pin = pinAt(docRef.current, last);
      if (pin) { onChangeRef.current(retargetWire(docRef.current, wireId, end, pin)); return; }
      const wid = wireAt(docRef.current, last);
      if (wid && wid !== wireId) { const { doc: d2, pin: jp } = tapWire(docRef.current, wid, last); onChangeRef.current(retargetWire(d2, wireId, end, jp)); return; }
      // released on empty → snap back (no change)
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const set = (patch: Record<string, number | string | boolean>): void => { if (sel) onChange(updateProps(doc, sel.id, patch)); };

  return (
    <div style={full
      ? { position: 'fixed', inset: 0, zIndex: 60, background: 'var(--background, #fff)', padding: 18, overflow: 'auto', display: 'grid', gridTemplateColumns: '180px 1fr 264px', gap: 16, alignItems: 'start' }
      : { display: 'grid', gridTemplateColumns: '172px 1fr 244px', gap: 14, alignItems: 'start' }}>
      {/* palette */}
      <Panel title="Parts">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {listParts().map((d) => (
            <button
              key={d.kind} type="button" onPointerDown={() => startPaletteDrag(d.kind)} title={`add ${d.label} — or drag onto a wire to splice it in`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: '7px 9px', fontSize: 13, fontWeight: 600, color: 'var(--foreground, #1c1c1c)',
                background: 'transparent', border: '1px solid transparent', borderRadius: 'calc(var(--radius, 0.6rem) - 2px)', cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent, #f1f1f3)'; e.currentTarget.style.borderColor = 'var(--border, #e4e4e7)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <PartThumb kind={d.kind} />
              <span style={{ flex: 1 }}>{d.label}</span>
              <span style={{ color: 'var(--muted-foreground, #999)', fontSize: 15, lineHeight: 1 }}>+</span>
            </button>
          ))}
        </div>
      </Panel>

      {/* canvas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--muted-foreground, #777)' }}>
          <span style={{ flex: 1 }}>
            {pending ? 'Click another pin to finish the wire (or a wire to branch off it). Click empty space to drop a bend and keep routing. Press Esc to cancel.'
              : 'Click a pin dot to start a wire, then click another pin to finish (no need to hold). Drag a part or junction to move it. Click a wire to select it (delete it in the inspector).'}
          </span>
          <EBtn variant="ghost" onClick={() => setFull((f) => !f)}>{full ? '⤡ exit fullscreen' : '⤢ fullscreen'}</EBtn>
        </div>
        {shorted.length > 0 && (
          <div role="alert" style={{ fontSize: 12.5, lineHeight: 1.4, padding: '8px 11px', borderRadius: 'var(--radius, 8px)', color: 'var(--destructive-foreground, #fff)', background: 'var(--destructive, oklch(0.58 0.22 27))' }}>
            ⚠ Short circuit: {shorted.map((p) => getPart(p.kind)?.label ?? p.kind).join(', ')} {shorted.length > 1 ? 'have' : 'has'} both terminals on the same net. To clear it: select the part and un-ground a terminal (the ⏚ grounded button), or click the shorting wire to delete it. A source needs a component (bulb, resistor) in the loop between + and −.
          </div>
        )}
        {damaged.length > 0 && (
          <div role="alert" style={{ fontSize: 12.5, lineHeight: 1.4, padding: '8px 11px', borderRadius: 'var(--radius, 8px)', color: 'var(--destructive-foreground, #fff)', background: 'var(--destructive, oklch(0.58 0.22 27))' }}>
            🔥 Overload: {damaged.map((d) => `${getPart(d.p.kind)?.label ?? d.p.kind} (${d.st.damage === 'overvoltage' ? `${Math.abs(d.st.v).toFixed(1)} V across` : `${d.st.power.toFixed(2)} W`})`).join(', ')} {damaged.length > 1 ? 'exceed their ratings' : 'exceeds its rating'} and would burn out. Lower the supply voltage, raise the resistance, or increase the part's rating in the inspector.
          </div>
        )}
        <div ref={hostRef} style={{ touchAction: 'none' }}>
          <CircuitScene
            doc={doc}
            ariaLabel="circuit editor canvas"
            selectedId={selected ?? undefined}
            editor={{ showPins: true, onPinPointerDown, onSelect: (id) => { setSelected(id); setSelectedWire(null); }, onPartPointerDown, onBackground, onWireClick, selectedWireId: selectedWire ?? undefined, onWireBodyDown, onWireWaypointDown, onWireEndDown, wirePreview: endDrag ? { from: endDrag.fixedPos, to: endDrag.to, valid: endDrag.valid } : pending && preview ? { from: terminalOf(doc, pending.from) ?? preview.to, mids: pending.mids, to: preview.to, valid: preview.valid } : undefined }}
          />
        </div>
      </div>

      {/* inspector */}
      <Panel title="Inspector">
        {selectedWire ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground, #1c1c1c)' }}>Wire</span>
            <div style={{ fontSize: 13, color: 'var(--muted-foreground, #777)', lineHeight: 1.5 }}>Drag the wire (or a square bend handle) to position its path. Drag an end ring off its pin to detach / re-attach it. Drag a bend onto the straight line to remove it.</div>
            <EBtn variant="danger" title="delete wire" onClick={() => { onChange(disconnectWire(doc, selectedWire)); setSelectedWire(null); }}>🗑 delete wire</EBtn>
          </div>
        ) : !sel || !selDef ? (
          <div style={{ fontSize: 13, color: 'var(--muted-foreground, #777)', lineHeight: 1.5 }}>Select a part or wire on the canvas to edit it, or add a part from the palette.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <PartThumb kind={sel.kind} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground, #1c1c1c)' }}>{selDef.label}</span>
            </div>
            {(selDef.controls?.length || Object.keys(selDef.defaultProps ?? {}).length > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {/* the part's own declared tunables: friendly label + unit + bounds */}
                {selDef.controls?.map((c) => {
                  const cur = Number(sel.props?.[c.key] ?? selDef.defaultProps?.[c.key] ?? 0);
                  const clamp = (v: number): number => Math.min(c.max ?? Infinity, Math.max(c.min ?? -Infinity, v));
                  return <Field key={c.key} label={c.unit ? `${c.label} (${c.unit})` : c.label}><NumInput value={cur} onChange={(v) => set({ [c.key]: clamp(v) })} step={c.step ?? 1} min={c.min} ariaLabel={c.label} /></Field>;
                })}
                {/* any remaining props (name, on/off …) the part did not declare as a control */}
                {Object.entries(selDef.defaultProps ?? {}).filter(([key]) => !selDef.controls?.some((c) => c.key === key)).map(([key, dflt]) => {
                  const cur = sel.props?.[key] ?? dflt;
                  if (typeof dflt === 'boolean') {
                    return <Field key={key} label={key}><input type="checkbox" checked={!!cur} onChange={(e) => set({ [key]: e.target.checked })} aria-label={key} /></Field>;
                  }
                  if (typeof dflt === 'string') {
                    return <Field key={key} label={key}><TextInput value={String(cur)} onChange={(v) => set({ [key]: v })} ariaLabel={key} /></Field>;
                  }
                  return <Field key={key} label={key}><NumInput value={Number(cur)} onChange={(v) => set({ [key]: v })} step={key === 'k' || key === 'farads' ? 0.1 : 1} ariaLabel={key} /></Field>;
                })}
              </div>
            )}
            <div style={{ height: 1, background: 'var(--border, #e4e4e7)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--muted-foreground, #999)' }}>Ground</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selDef.pins.map((pin) => {
                  const grounded = sel.props && sel.pins[pin] === 'gnd';
                  return (
                    <EBtn key={pin} active={!!grounded} title={grounded ? `disconnect ${pin} from ground` : `tie ${pin} to ground`} onClick={() => onChange(setGround(doc, { partId: sel.id, pin }))}>
                      {pin} {grounded ? '⏚' : '→ gnd'}
                    </EBtn>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <EBtn variant="ghost" title="rotate 90°" onClick={() => onChange(rotatePart(doc, sel.id))}>⟳ rotate</EBtn>
              <EBtn variant="danger" title="delete part" onClick={() => { onChange(deletePart(doc, sel.id)); setSelected(null); }}>🗑 delete</EBtn>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
