'use client';

/**
 * LogicEditor — the drag-and-drop digital-logic canvas (the gate-circuit counterpart of the
 * analog CircuitEditor, reusing its editor-UI kit and click-vs-drag interaction). Drop a
 * source, an LED, or any gate from the palette; drag nodes to lay them out; click an OUTPUT
 * dot then an INPUT slot to wire them; toggle a source by clicking it. The doc evaluates live,
 * so wires glow and LEDs light as you build. Emits the LogicDoc via `onChange`.
 */

import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { LogicEditScene } from './LogicEditScene.js';
import { listGates } from './registry.js';
import { GateGlyph, type GateType } from '../kit/logic-gates.js';
import { addNode, moveNode, deleteNode, connect, disconnect, toggleInput, relabel, setGoal, type PortRef } from './edit-ops.js';
import { Panel, EBtn, Field, TextInput } from '../build/editor-ui.js';
import type { LogicDoc } from './contract.js';

export interface LogicEditorProps {
  value: LogicDoc;
  onChange: (doc: LogicDoc) => void;
}

const SNAP = 10;
const snap = (n: number): number => Math.round(n / SNAP) * SNAP;
const emptyDoc: LogicDoc = { inputs: [], gates: [], outputs: [], size: { w: 640, h: 360 } };

type PaletteItem = { kind: string; label: string; glyph?: GateType };

function PaletteThumb({ glyph }: { glyph?: GateType }): ReactNode {
  if (!glyph) return <span style={{ width: 30, textAlign: 'center', fontSize: 16 }} aria-hidden>●</span>;
  return <svg viewBox="0 0 34 34" width={30} height={22} aria-hidden style={{ flexShrink: 0 }}><GateGlyph x={2} y={2} size={30} type={glyph} /></svg>;
}

export function LogicEditor({ value, onChange }: LogicEditorProps): ReactNode {
  const doc = value ?? emptyDoc;
  const W = doc.size?.w ?? 640;
  const [selected, setSelected] = useState<string | null>(null);
  const [wireStart, setWireStart] = useState<PortRef | null>(null);
  // live cursor (canvas coords) while a wire is pending, so a rubber-band can follow it
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [full, setFull] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const docRef = useRef(doc); docRef.current = doc;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const wireRef = useRef<PortRef | null>(wireStart); wireRef.current = wireStart;

  const toCanvas = (cx: number, cy: number): { x: number; y: number } => {
    const host = hostRef.current;
    if (!host) return { x: 0, y: 0 };
    const r = host.getBoundingClientRect();
    const scale = r.width / W;
    return { x: (cx - r.left) / scale, y: (cy - r.top) / scale };
  };

  // While a wire is pending: the rubber-band follows the cursor (mouse released), and Esc cancels.
  useEffect(() => {
    if (!wireStart) { setCursor(null); return; }
    const move = (ev: PointerEvent): void => setCursor(toCanvas(ev.clientX, ev.clientY));
    const key = (ev: KeyboardEvent): void => { if (ev.key === 'Escape') setWireStart(null); };
    window.addEventListener('pointermove', move);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('keydown', key); };
  }, [wireStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const palette: PaletteItem[] = [
    { kind: 'input', label: 'Source (switch)' },
    ...listGates().map((g) => ({ kind: g.kind, label: g.label, glyph: g.glyph })),
    { kind: 'output', label: 'LED (output)' },
  ];

  const sel = [...doc.inputs, ...doc.gates, ...doc.outputs].find((n) => n.id === selected) ?? null;
  const selKind: 'input' | 'gate' | 'output' | null = !sel ? null
    : doc.inputs.some((n) => n.id === sel.id) ? 'input'
    : doc.gates.some((n) => n.id === sel.id) ? 'gate' : 'output';
  const selOutput = selKind === 'output' ? doc.outputs.find((o) => o.id === sel!.id) ?? null : null;
  const selInput = selKind === 'input' ? doc.inputs.find((i) => i.id === sel!.id) ?? null : null;

  const place = (kind: string, at: { x: number; y: number }): void => {
    const { doc: next, id } = addNode(docRef.current, kind, at);
    onChangeRef.current(next);
    setSelected(id);
  };
  const dropAt = (kind: string, clientX: number, clientY: number): void => {
    const host = hostRef.current;
    const n = docRef.current.gates.length + docRef.current.inputs.length;
    const fallback = { x: snap(120 + (n % 3) * 140), y: snap(70 + Math.floor(n / 3) * 80) };
    if (!host) return place(kind, fallback);
    const r = host.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return place(kind, fallback);
    const sc = r.width / W;
    place(kind, { x: snap((clientX - r.left) / sc), y: snap((clientY - r.top) / sc) });
  };
  const startPaletteDrag = (kind: string): void => {
    const up = (ev: PointerEvent): void => { window.removeEventListener('pointerup', up); dropAt(kind, ev.clientX, ev.clientY); };
    window.addEventListener('pointerup', up);
  };

  const portClick = (ref: PortRef): void => {
    if (ref.dir === 'out') { setWireStart((prev) => (prev && prev.nodeId === ref.nodeId ? null : ref)); return; }
    const start = wireRef.current;
    if (start) { onChangeRef.current(connect(docRef.current, start.nodeId, { nodeId: ref.nodeId, slot: ref.slot })); setWireStart(null); }
    else onChangeRef.current(disconnect(docRef.current, { nodeId: ref.nodeId, slot: ref.slot })); // tap a filled input to clear it
  };
  const nodeClick = (id: string): void => {
    setSelected(id);
    if (docRef.current.inputs.some((i) => i.id === id)) onChangeRef.current(toggleInput(docRef.current, id));
  };

  // click-vs-drag (window listeners survive the re-render that moveNode triggers; absolute pos)
  const beginDrag = (id: string, e: ReactPointerEvent, onClick: () => void): void => {
    const node = [...docRef.current.inputs, ...docRef.current.gates, ...docRef.current.outputs].find((n) => n.id === id);
    const host = hostRef.current;
    if (!node || !host) return;
    e.preventDefault();
    const scale = host.getBoundingClientRect().width / W;
    const sx = e.clientX, sy = e.clientY, ox = node.x ?? 0, oy = node.y ?? 0;
    let moved = false;
    const move = (ev: PointerEvent): void => {
      if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 4) { moved = true; setSelected(id); }
      if (moved) onChangeRef.current(moveNode(docRef.current, id, { x: snap(ox + (ev.clientX - sx) / scale), y: snap(oy + (ev.clientY - sy) / scale) }));
    };
    const up = (): void => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); if (!moved) onClick(); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const onNodePointerDown = (id: string, e: ReactPointerEvent): void => beginDrag(id, e, () => nodeClick(id));
  const onPortPointerDown = (ref: PortRef, e: ReactPointerEvent): void => beginDrag(ref.nodeId, e, () => portClick(ref));

  return (
    <div style={full
      ? { position: 'fixed', inset: 0, zIndex: 60, background: 'var(--background, #fff)', padding: 18, overflow: 'auto', display: 'grid', gridTemplateColumns: '188px 1fr 240px', gap: 16, alignItems: 'start' }
      : { display: 'grid', gridTemplateColumns: '180px 1fr 224px', gap: 14, alignItems: 'start' }}>
      {/* palette */}
      <Panel title="Add">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {palette.map((it) => (
            <button
              key={it.kind} type="button" onPointerDown={() => startPaletteDrag(it.kind)} title={`add ${it.label} (or drag onto the canvas)`}
              style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', padding: '6px 9px', fontSize: 13, fontWeight: 600, color: 'var(--foreground, #1c1c1c)', background: 'transparent', border: '1px solid transparent', borderRadius: 'calc(var(--radius, 0.6rem) - 2px)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent, #f1f1f3)'; e.currentTarget.style.borderColor = 'var(--border, #e4e4e7)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <PaletteThumb glyph={it.glyph} />
              <span style={{ flex: 1 }}>{it.label}</span>
              <span style={{ color: 'var(--muted-foreground, #999)', fontSize: 15, lineHeight: 1 }}>+</span>
            </button>
          ))}
        </div>
      </Panel>

      {/* canvas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--muted-foreground, #777)' }}>
          <span style={{ flex: 1 }}>
            {wireStart ? 'Now click an input slot to connect (the wire follows your cursor). Press Esc or click empty space to cancel.'
              : 'Drag to arrange. Wire: click an output dot ● then an input slot. Click a source to flip it. Click a filled input slot to unwire it.'}
          </span>
          {wireStart && <EBtn variant="ghost" onClick={() => setWireStart(null)}>cancel wire</EBtn>}
          <EBtn variant="ghost" onClick={() => setFull((f) => !f)}>{full ? '⤡ exit fullscreen' : '⤢ fullscreen'}</EBtn>
        </div>
        <div ref={hostRef}>
          <LogicEditScene
            doc={doc}
            selectedId={selected ?? undefined}
            wireStart={wireStart ?? undefined}
            previewCursor={wireStart ? cursor ?? undefined : undefined}
            onNodePointerDown={onNodePointerDown}
            onPortPointerDown={onPortPointerDown}
            onBackground={() => { setSelected(null); setWireStart(null); }}
            ariaLabel="logic circuit builder canvas"
          />
        </div>
      </div>

      {/* inspector */}
      <Panel title="Inspector">
        {!sel ? (
          <div style={{ fontSize: 13, color: 'var(--muted-foreground, #777)', lineHeight: 1.5 }}>Select a node to edit it, or add one from the palette.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="label"><TextInput value={sel.label ?? ''} onChange={(v) => onChange(relabel(doc, sel.id, v))} ariaLabel="node label" /></Field>
            {selInput && (
              <Field label="value"><EBtn active={!!selInput.value} onClick={() => onChange(toggleInput(doc, sel.id))}>{selInput.value ? '1 (HIGH)' : '0 (LOW)'}</EBtn></Field>
            )}
            {selOutput && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--muted-foreground, #999)' }}>Goal (this LED)</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <EBtn active={selOutput.goal === undefined} onClick={() => onChange(setGoal(doc, sel.id, undefined))}>none</EBtn>
                  <EBtn active={selOutput.goal === false} onClick={() => onChange(setGoal(doc, sel.id, false))}>want 0</EBtn>
                  <EBtn active={selOutput.goal === true} onClick={() => onChange(setGoal(doc, sel.id, true))}>want 1</EBtn>
                </div>
              </div>
            )}
            <div style={{ height: 1, background: 'var(--border, #e4e4e7)' }} />
            <EBtn variant="danger" title="delete node" onClick={() => { onChange(deleteNode(doc, sel.id)); setSelected(null); }}>🗑 delete</EBtn>
          </div>
        )}
      </Panel>
    </div>
  );
}
