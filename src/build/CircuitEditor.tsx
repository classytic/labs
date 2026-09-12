'use client';

/**
 * CircuitEditor — the authoring surface. Pick a part from the palette to drop it on
 * the canvas, drag parts to lay them out, click two pins to wire them, and tune the
 * selected part in the inspector. The doc solves live as you build, so the lamp lights
 * and current flows while you author. Emits the CircuitDoc via `onChange`; the UI is
 * themed from the host's design tokens (see editor-ui).
 */

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { CircuitScene } from './CircuitScene.js';
import { listParts, getPart } from './registry.js';
import {
  addPart,
  movePart,
  updateProps,
  rotatePart,
  deletePart,
  addWire,
  disconnectWire,
  retargetWire,
  setGround,
  spliceIntoWire,
  tapWire,
  terminalOf,
  wirePolyline,
  setWireWaypoints,
  type PinRef,
} from './editor-ops.js';
import { solveCircuit, partState } from './solve.js';
import { EBtn, Field, NumInput, TextInput, ZoomBar } from './editor-ui.js';
import { useCanvasViewport, boundsOf } from './viewport.js';
import { Activity } from '../kit/activity.js';
import { Plus, RotateCw, Trash2, Undo2, Redo2 } from 'lucide-react';
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
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / len2)) : 0;
  return Math.hypot(p.x - (a[0] + t * dx), p.y - (a[1] + t * dy));
}

/** the part pin whose terminal is within `thresh` px of point `at` (nearest wins, or null). */
function pinAt(doc: CircuitDoc, at: { x: number; y: number }, thresh = 16): PinRef | null {
  let best: PinRef | null = null,
    bd = thresh;
  for (const p of doc.parts) {
    const def = getPart(p.kind);
    if (!def) continue;
    for (const pin of def.pins) {
      const t = def.terminalAt(p, pin);
      const d = Math.hypot(at.x - t.x, at.y - t.y);
      if (d < bd) {
        bd = d;
        best = { partId: p.id, pin };
      }
    }
  }
  return best;
}

/** The full routed polyline of a wire (through its bend points), as tuples. */
function wirePts(doc: CircuitDoc, w: NonNullable<CircuitDoc['wires']>[number]): [number, number][] {
  const ta = terminalOf(doc, w.a),
    tb = terminalOf(doc, w.b);
  if (!ta || !tb) return [];
  return wirePolyline(ta, w.mid ?? [], tb).map((p): [number, number] => [p.x, p.y]);
}

/** the wire whose routed path passes within `thresh` px of point `at` (or null). */
function wireAt(doc: CircuitDoc, at: { x: number; y: number }, thresh = 16): string | null {
  let best: string | null = null,
    bestD = thresh;
  for (const w of doc.wires ?? []) {
    const route = wirePts(doc, w);
    for (let i = 0; i < route.length - 1; i++) {
      const d = segDist(at, route[i]!, route[i + 1]!);
      if (d < bestD) {
        bestD = d;
        best = w.id;
      }
    }
  }
  return best;
}

/** A tiny preview of a part's own glyph for the palette (label cropped out of view). */
function PartThumb({ kind }: { kind: string }): ReactNode {
  const def = getPart(kind);
  if (!def) return null;
  const inst = {
    id: '_t',
    kind,
    at: { x: 40, y: 34 },
    orient: 'h' as const,
    props: def.defaultProps,
    pins: {},
  };
  const st = { live: false, i: 0, v: 0, power: 0, pinV: () => 0 };
  return (
    <svg viewBox="6 18 68 30" width={46} height={20} aria-hidden className="circuit-editor-part-thumb">
      {def.render(inst, st)}
    </svg>
  );
}

export function CircuitEditor({ value, onChange }: CircuitEditorProps): ReactNode {
  const doc = value ?? emptyDoc;
  const W = doc.size?.w ?? 560;
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedWire, setSelectedWire] = useState<string | null>(null);
  // a STICKY pending wire: it stays armed after the mouse is released and follows the cursor,
  // so you click one pin, click empty space to drop routing bends, then click another pin (or a
  // wire) to finish. `mids` are the bend points clicked so far.
  const [pending, setPending] = useState<{
    from: PinRef;
    mids: { x: number; y: number }[];
  } | null>(null);
  const [preview, setPreview] = useState<{
    to: { x: number; y: number };
    valid: boolean;
  } | null>(null);
  // dragging one END of the selected wire off its pin (detach / re-target)
  const [endDrag, setEndDrag] = useState<{
    fixedPos: { x: number; y: number };
    to: { x: number; y: number };
    valid: boolean;
  } | null>(null);
  const vp = useCanvasViewport({ world: { w: W, h: doc.size?.h ?? 300 } });
  const hostRef = vp.hostRef;
  // latest doc/onChange/pending for window-level handlers (which outlive a single render)
  const docRef = useRef(doc);
  docRef.current = doc;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const previewRef = useRef(preview);
  previewRef.current = preview;

  // UNDO / REDO: an in-editor history of doc snapshots. Every edit goes through `commit`,
  // which pushes the pre-edit doc onto `past` (clearing `future`). Rapid same-`key` edits
  // within one gesture (dragging a slider or a part) coalesce into a single undo step.
  const [past, setPast] = useState<CircuitDoc[]>([]);
  const [future, setFuture] = useState<CircuitDoc[]>([]);
  const pastRef = useRef(past);
  pastRef.current = past;
  const futureRef = useRef(future);
  futureRef.current = future;
  const lastEdit = useRef<{ key: string | null; t: number }>({
    key: null,
    t: 0,
  });
  const commit = (next: CircuitDoc, key?: string): void => {
    const now = Date.now();
    const coalesce = !!key && key === lastEdit.current.key && now - lastEdit.current.t < 600;
    if (!coalesce) setPast((p) => [...p, docRef.current].slice(-80));
    lastEdit.current = { key: key ?? null, t: now };
    setFuture([]);
    onChange(next);
  };
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const undo = (): void => {
    const p = pastRef.current;
    if (!p.length) return;
    lastEdit.current = { key: null, t: 0 };
    setFuture((f) => [docRef.current, ...f].slice(0, 80));
    setPast((pp) => pp.slice(0, -1));
    onChange(p[p.length - 1]!);
  };
  const redo = (): void => {
    const f = futureRef.current;
    if (!f.length) return;
    lastEdit.current = { key: null, t: 0 };
    setPast((pp) => [...pp, docRef.current].slice(-80));
    setFuture((ff) => ff.slice(1));
    onChange(f[0]!);
  };
  const undoRef = useRef(undo);
  undoRef.current = undo;
  const redoRef = useRef(redo);
  redoRef.current = redo;

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
    const at = {
      x: snap(120 + (n % 3) * 150),
      y: snap(80 + Math.floor(n / 3) * 90),
    };
    const next = addPart(d, kind, at);
    commitRef.current(next);
    setSelected(next.parts[next.parts.length - 1]?.id ?? null);
  };

  // Drag a palette part onto the canvas: drop ON a wire splices it in series, drop on
  // empty canvas places it there; a plain click (released on the palette) cascade-adds.
  const dropAt = (kind: string, clientX: number, clientY: number): void => {
    const host = hostRef.current;
    if (!host) {
      place(kind);
      return;
    }
    const r = host.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) {
      place(kind);
      return;
    }
    const p = vp.toScene(clientX, clientY);
    const at = { x: snap(p.x), y: snap(p.y) };
    const d = docRef.current;
    const wid = wireAt(d, at);
    // a Node dropped on a wire TAPS it (splits the wire + joins the junction in); a 2-pin part
    // dropped on a wire splices in series; anything dropped on empty canvas just lands there.
    if (wid && kind === 'node') {
      const { doc: next, pin } = tapWire(d, wid, at);
      commitRef.current(next);
      setSelected(pin.partId);
      return;
    }
    const next = wid ? spliceIntoWire(d, wid, kind, at) : addPart(d, kind, at);
    commitRef.current(next);
    setSelected(next.parts[next.parts.length - 1]?.id ?? null);
  };
  const startPaletteDrag = (kind: string): void => {
    const up = (ev: PointerEvent): void => {
      window.removeEventListener('pointerup', up);
      dropAt(kind, ev.clientX, ev.clientY);
    };
    window.addEventListener('pointerup', up);
  };

  const toCanvas = (cx: number, cy: number): { x: number; y: number } => vp.toScene(cx, cy);

  // While a wire is pending, the rubber-band follows the cursor WITHOUT the button held; Esc
  // (or a click on empty canvas) cancels. This is the click-to-start / click-to-finish model.
  // keyboard: Delete / Backspace removes the selected wire or part (unless typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (selectedWire) {
        e.preventDefault();
        commitRef.current(disconnectWire(docRef.current, selectedWire));
        setSelectedWire(null);
      } else if (selected) {
        e.preventDefault();
        commitRef.current(deletePart(docRef.current, selected));
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, selectedWire, onChange]); // eslint-disable-line react-hooks/exhaustive-deps

  // keyboard: ⌘/Ctrl-Z undo, ⌘/Ctrl-Shift-Z or Ctrl-Y redo (not while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoRef.current();
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault();
        redoRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!pending) {
      setPreview(null);
      return;
    }
    const move = (ev: PointerEvent): void => {
      const at = toCanvas(ev.clientX, ev.clientY);
      const d = docRef.current;
      setPreview({ to: at, valid: !!pinAt(d, at) || !!wireAt(d, at) });
    };
    const key = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') setPending(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('keydown', key);
    };
  }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Create the wire the user drew (a→b) carrying its routing bends. Uses addWire (not connect)
   *  so it is created even between pins already on the same net — a drawn wire never vanishes. */
  const connectWithMids = (
    d: CircuitDoc,
    a: PinRef,
    b: PinRef,
    mids: { x: number; y: number }[],
  ): CircuitDoc => addWire(d, a, b, mids);

  // Click a pin: with nothing pending it ARMS a wire there; with a wire pending it FINISHES it
  // (carrying any bends), or cancels if you click the same pin again.
  const handlePinClick = (from: PinRef): void => {
    const p = pendingRef.current;
    if (!p) {
      setPending({ from, mids: [] });
      setSelected(from.partId);
      setSelectedWire(null);
      return;
    }
    if (p.from.partId === from.partId && p.from.pin === from.pin) {
      setPending(null);
      return;
    }
    commitRef.current(connectWithMids(docRef.current, p.from, from, p.mids));
    setPending(null);
    setSelected(from.partId);
  };

  // Drag a part / junction BODY to move it (grid-snapped); a plain click runs `onClick`.
  const beginMove = (partId: string, e: ReactPointerEvent, onClick: () => void): void => {
    const part = docRef.current.parts.find((p) => p.id === partId);
    const host = hostRef.current;
    if (!part || !host) return;
    e.preventDefault();
    const scale = vp.scale();
    const sx = e.clientX,
      sy = e.clientY,
      ox = part.at.x,
      oy = part.at.y;
    let moved = false;
    const move = (ev: PointerEvent): void => {
      if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 4) moved = true;
      if (moved)
        commitRef.current(
          movePart(docRef.current, partId, {
            x: snap(ox + (ev.clientX - sx) / scale),
            y: snap(oy + (ev.clientY - sy) / scale),
          }),
          `move:${partId}`,
        );
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
    beginMove(partId, e, () => {
      setSelected(partId);
      setSelectedWire(null);
      setPending(null);
    });

  // A pin handle: a junction DRAGS to move (and clicks to wire); a part pin CLICKS to wire.
  const onPinPointerDown = (partId: string, pin: string, e: ReactPointerEvent): void => {
    const isJunction = docRef.current.parts.find((p) => p.id === partId)?.kind === 'node';
    if (isJunction) {
      beginMove(partId, e, () => handlePinClick({ partId, pin }));
      return;
    }
    e.preventDefault();
    const sx = e.clientX,
      sy = e.clientY;
    let moved = false;
    const move = (ev: PointerEvent): void => {
      if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 4) moved = true;
    };
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
      commitRef.current(connectWithMids(d2, p.from, jp, p.mids));
      setPending(null);
      setSelected(jp.partId);
    } else {
      setSelectedWire(wireId);
      setSelected(null);
    }
  };

  // Click empty space: while DRAWING a wire it drops a routing bend there and keeps going (so you
  // route the wire point by point); otherwise it just clears the selection. A bend is only ever
  // born as part of an in-progress wire, never floating.
  const onBackground = (e: ReactPointerEvent): void => {
    const p = pendingRef.current;
    if (p) {
      const at = toCanvas(e.clientX, e.clientY);
      setPending({
        from: p.from,
        mids: [...p.mids, { x: snap(at.x), y: snap(at.y) }],
      });
      return;
    }
    setSelected(null);
    setSelectedWire(null);
  };

  // ── Position the wire's path: drag a bend handle to move it, or grab the wire body to add a
  // new bend and pull it where you want. Bends grid-snap; a bend dragged back onto the straight
  // line between its neighbours is dropped, so the wire never keeps a useless kink. ──
  const snapPt = (p: { x: number; y: number }): { x: number; y: number } => ({
    x: snap(p.x),
    y: snap(p.y),
  });

  const pruneCollinear = (
    ta: { x: number; y: number },
    mids: { x: number; y: number }[],
    tb: { x: number; y: number },
  ): { x: number; y: number }[] => {
    const anchors = [ta, ...mids, tb];
    return mids.filter(
      (m, i) => segDist(m, [anchors[i]!.x, anchors[i]!.y], [anchors[i + 2]!.x, anchors[i + 2]!.y]) > 3,
    );
  };

  const dragBend = (
    wireId: string,
    startMids: { x: number; y: number }[],
    index: number,
    e: ReactPointerEvent,
  ): void => {
    e.preventDefault();
    const d0 = docRef.current;
    const w0 = (d0.wires ?? []).find((x) => x.id === wireId);
    const ta = w0 && terminalOf(d0, w0.a),
      tb = w0 && terminalOf(d0, w0.b);
    if (!ta || !tb) return;
    let mids = startMids;
    let moved = false;
    const move = (ev: PointerEvent): void => {
      moved = true;
      const at = snapPt(toCanvas(ev.clientX, ev.clientY));
      mids = mids.map((m, i) => (i === index ? at : m));
      commitRef.current(setWireWaypoints(docRef.current, wireId, mids), `wp:${wireId}`);
    };
    const up = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (moved)
        commitRef.current(
          setWireWaypoints(docRef.current, wireId, pruneCollinear(ta, mids, tb)),
          `wp:${wireId}`,
        );
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
    const ta = w && terminalOf(d, w.a),
      tb = w && terminalOf(d, w.b);
    if (!w || !ta || !tb) return;
    const at = toCanvas(e.clientX, e.clientY);
    const mids = [...(w.mid ?? [])];
    // grabbing near an existing bend → move it; otherwise insert a new bend on the nearest leg
    let idx = mids.findIndex((m) => Math.hypot(at.x - m.x, at.y - m.y) < 10);
    if (idx < 0) {
      const anchors = [ta, ...mids, tb];
      let seg = 0,
        sd = Infinity;
      for (let i = 0; i < anchors.length - 1; i++) {
        const dd = segDist(at, [anchors[i]!.x, anchors[i]!.y], [anchors[i + 1]!.x, anchors[i + 1]!.y]);
        if (dd < sd) {
          sd = dd;
          seg = i;
        }
      }
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
    let moved = false,
      last = fixedPos;
    const move = (ev: PointerEvent): void => {
      moved = true;
      const at = toCanvas(ev.clientX, ev.clientY);
      last = at;
      setEndDrag({
        fixedPos,
        to: at,
        valid: !!pinAt(docRef.current, at) || !!wireAt(docRef.current, at),
      });
    };
    const up = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setEndDrag(null);
      if (!moved) return;
      const pin = pinAt(docRef.current, last);
      if (pin) {
        commitRef.current(retargetWire(docRef.current, wireId, end, pin));
        return;
      }
      const wid = wireAt(docRef.current, last);
      if (wid && wid !== wireId) {
        const { doc: d2, pin: jp } = tapWire(docRef.current, wid, last);
        commitRef.current(retargetWire(d2, wireId, end, jp));
        return;
      }
      // released on empty → snap back (no change)
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const set = (patch: Record<string, number | string | boolean>): void => {
    if (sel) commit(updateProps(doc, sel.id, patch), `prop:${sel.id}`);
  };

  return (
    <Activity.Root className="circuit-editor-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Circuit studio"
          title="Build and test a circuit"
          description="Place components, connect their pins, and inspect the live electrical behavior."
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{doc.parts.length} parts</strong>
        <span>{(doc.wires ?? []).length} wires</span>
        <span className="circuit-editor-status-hint">
          {pending
            ? 'Wiring: choose another pin, wire, or bend point'
            : selectedWire
              ? 'Wire selected'
              : selDef
                ? `${selDef.label} selected`
                : 'Select a part or add one'}
        </span>
        <span className="circuit-editor-history">
          <EBtn variant="ghost" title="undo (⌘/Ctrl-Z)" disabled={past.length === 0} onClick={undo}>
            <Undo2 aria-hidden="true" />
            <span>Undo</span>
          </EBtn>
          <EBtn variant="ghost" title="redo (⌘/Ctrl-Shift-Z)" disabled={future.length === 0} onClick={redo}>
            <Redo2 aria-hidden="true" />
            <span>Redo</span>
          </EBtn>
        </span>
      </Activity.Status>
      <Activity.Workspace>
        {/* palette */}
        <Activity.Inspector label="Add components">
          <div className="circuit-editor-panel-head">Components</div>
          <div className="circuit-editor-palette">
            {listParts().map((d) => (
              <Button
                key={d.kind}
                type="button"
                onPointerDown={() => startPaletteDrag(d.kind)}
                title={`add ${d.label}, or drag onto a wire to splice it in`}
                variant="ghost"
                className="circuit-editor-palette-item"
              >
                <PartThumb kind={d.kind} />
                <span className="circuit-editor-palette-label">{d.label}</span>
                <Plus aria-hidden="true" />
              </Button>
            ))}
          </div>
        </Activity.Inspector>

        {/* canvas */}
        <Activity.Canvas label="Circuit editor canvas">
          <div className="circuit-editor-guidance">
            <span>
              {pending
                ? 'Click another pin to finish the wire (or a wire to branch off it). Click empty space to drop a bend and keep routing. Press Esc to cancel.'
                : 'Click a pin dot to start a wire, then click another pin to finish. Drag a part to move it. Scroll to pan, ⌘/Ctrl-scroll or Space-drag to zoom/pan.'}
            </span>
          </div>
          {shorted.length > 0 && (
            <div role="alert" className="circuit-editor-alert">
              ⚠ Short circuit: {shorted.map((p) => getPart(p.kind)?.label ?? p.kind).join(', ')}{' '}
              {shorted.length > 1 ? 'have' : 'has'} both terminals on the same net. To clear it: select the
              part and un-ground a terminal (the ⏚ grounded button), or click the shorting wire to delete it.
              A source needs a component (bulb, resistor) in the loop between + and −.
            </div>
          )}
          {damaged.length > 0 && (
            <div role="alert" className="circuit-editor-alert">
              🔥 Overload:{' '}
              {damaged
                .map(
                  (d) =>
                    `${getPart(d.p.kind)?.label ?? d.p.kind} (${d.st.damage === 'overvoltage' ? `${Math.abs(d.st.v).toFixed(1)} V across` : `${d.st.power.toFixed(2)} W`})`,
                )
                .join(', ')}{' '}
              {damaged.length > 1 ? 'exceed their ratings' : 'exceeds its rating'} and would burn out. Lower
              the supply voltage, raise the resistance, or increase the part's rating in the inspector.
            </div>
          )}
          <div
            ref={hostRef}
            onPointerDown={vp.onHostPointerDown}
            className="circuit-editor-viewport"
            style={{
              ...vp.gridStyle,
              ...vp.hostStyle,
            }}
          >
            <CircuitScene
              doc={doc}
              ariaLabel="circuit editor canvas"
              selectedId={selected ?? undefined}
              viewBox={vp.viewBox}
              bare
              editor={{
                showPins: true,
                wireStart: pending?.from,
                onPinPointerDown,
                onPinActivate: (partId, pin) => handlePinClick({ partId, pin }),
                onSelect: (id) => {
                  setSelected(id);
                  setSelectedWire(null);
                },
                onPartPointerDown,
                onBackground,
                onWireClick,
                selectedWireId: selectedWire ?? undefined,
                onWireBodyDown,
                onWireWaypointDown,
                onWireEndDown,
                wirePreview: endDrag
                  ? {
                      from: endDrag.fixedPos,
                      to: endDrag.to,
                      valid: endDrag.valid,
                    }
                  : pending && preview
                    ? {
                        from: terminalOf(doc, pending.from) ?? preview.to,
                        mids: pending.mids,
                        to: preview.to,
                        valid: preview.valid,
                      }
                    : undefined,
              }}
            />
            <ZoomBar
              zoom={vp.zoom}
              onZoomIn={vp.zoomIn}
              onZoomOut={vp.zoomOut}
              onFit={() =>
                vp.fit(boundsOf(doc.parts.map((p) => ({ x: p.at.x - 30, y: p.at.y - 24 }))) ?? undefined)
              }
            />
          </div>
        </Activity.Canvas>

        {/* inspector */}
        <Activity.Inspector label="Properties">
          <div className="circuit-editor-panel-head">Properties</div>
          <div className="circuit-editor-properties">
            {selectedWire ? (
              <div className="circuit-editor-property-stack">
                <span className="circuit-editor-property-title">Wire</span>
                <div className="circuit-editor-property-copy">
                  Drag the wire or a square bend handle to position its path. Drag an end ring off its pin to
                  reconnect it. Drag a bend onto the straight line to remove it.
                </div>
                <EBtn
                  variant="danger"
                  title="delete wire"
                  onClick={() => {
                    commit(disconnectWire(doc, selectedWire));
                    setSelectedWire(null);
                  }}
                >
                  <Trash2 aria-hidden="true" />
                  Delete wire
                </EBtn>
              </div>
            ) : !sel || !selDef ? (
              <div className="circuit-editor-property-copy">
                Select a part or wire on the canvas to edit it, or add a part from the palette.
              </div>
            ) : (
              <div className="circuit-editor-property-stack" data-spacious="true">
                <div className="circuit-editor-property-heading">
                  <PartThumb kind={sel.kind} />
                  <span className="circuit-editor-property-title">{selDef.label}</span>
                </div>
                {(selDef.controls?.length || Object.keys(selDef.defaultProps ?? {}).length > 0) && (
                  <div className="circuit-editor-field-list">
                    {/* the part's own declared tunables: friendly label + unit + bounds */}
                    {selDef.controls?.map((c) => {
                      const cur = Number(sel.props?.[c.key] ?? selDef.defaultProps?.[c.key] ?? 0);
                      const clamp = (v: number): number =>
                        Math.min(c.max ?? Infinity, Math.max(c.min ?? -Infinity, v));
                      return (
                        <Field key={c.key} label={c.unit ? `${c.label} (${c.unit})` : c.label}>
                          <NumInput
                            value={cur}
                            onChange={(v) => set({ [c.key]: clamp(v) })}
                            step={c.step ?? 1}
                            min={c.min}
                            ariaLabel={c.label}
                          />
                        </Field>
                      );
                    })}
                    {/* any remaining props (name, on/off …) the part did not declare as a control */}
                    {Object.entries(selDef.defaultProps ?? {})
                      .filter(([key]) => !selDef.controls?.some((c) => c.key === key))
                      .map(([key, dflt]) => {
                        const cur = sel.props?.[key] ?? dflt;
                        if (typeof dflt === 'boolean') {
                          return (
                            <Field key={key} label={key}>
                              <Checkbox
                                checked={!!cur}
                                onCheckedChange={(value) => set({ [key]: value === true })}
                                aria-label={key}
                              />
                            </Field>
                          );
                        }
                        if (typeof dflt === 'string') {
                          return (
                            <Field key={key} label={key}>
                              <TextInput
                                value={String(cur)}
                                onChange={(v) => set({ [key]: v })}
                                ariaLabel={key}
                              />
                            </Field>
                          );
                        }
                        return (
                          <Field key={key} label={key}>
                            <NumInput
                              value={Number(cur)}
                              onChange={(v) => set({ [key]: v })}
                              step={key === 'k' || key === 'farads' ? 0.1 : 1}
                              ariaLabel={key}
                            />
                          </Field>
                        );
                      })}
                  </div>
                )}
                <div className="circuit-editor-separator" />
                <div className="circuit-editor-property-section">
                  <span className="circuit-editor-section-label">Ground</span>
                  <div className="circuit-editor-action-row">
                    {selDef.pins.map((pin) => {
                      const grounded = sel.props && sel.pins[pin] === 'gnd';
                      return (
                        <EBtn
                          key={pin}
                          active={!!grounded}
                          title={grounded ? `disconnect ${pin} from ground` : `tie ${pin} to ground`}
                          onClick={() => commit(setGround(doc, { partId: sel.id, pin }))}
                        >
                          {pin} {grounded ? '⏚' : '→ gnd'}
                        </EBtn>
                      );
                    })}
                  </div>
                </div>
                <div className="circuit-editor-action-row">
                  <EBtn variant="ghost" title="rotate 90°" onClick={() => commit(rotatePart(doc, sel.id))}>
                    <RotateCw aria-hidden="true" />
                    Rotate
                  </EBtn>
                  <EBtn
                    variant="danger"
                    title="delete part"
                    onClick={() => {
                      commit(deletePart(doc, sel.id));
                      setSelected(null);
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                    Delete
                  </EBtn>
                </div>
              </div>
            )}
          </div>
        </Activity.Inspector>
      </Activity.Workspace>
    </Activity.Root>
  );
}
