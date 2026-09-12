'use client';

/**
 * LogicEditor — the drag-and-drop digital-logic canvas (the gate-circuit counterpart of the
 * analog CircuitEditor, reusing its editor-UI kit and click-vs-drag interaction). Drop a
 * source, an LED, or any gate from the palette; drag nodes to lay them out; click an OUTPUT
 * dot then an INPUT slot to wire them; toggle a source by clicking it. The doc evaluates live,
 * so wires glow and LEDs light as you build. Emits the LogicDoc via `onChange`.
 */

import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { LogicEditScene } from './LogicEditScene.js';
import { listGates } from './registry.js';
import { GateGlyph, type GateType } from '../kit/logic-gates/gate.js';
import {
  addNode,
  moveNode,
  deleteNode,
  connect,
  disconnect,
  toggleInput,
  relabel,
  setGoal,
  type PortRef,
} from './edit-ops.js';
import { EBtn, Field, TextInput, ZoomBar } from '../build/editor-ui.js';
import { useCanvasViewport, boundsOf } from '../build/viewport.js';
import { Activity } from '../kit/activity.js';
import { Plus, Trash2 } from 'lucide-react';
import type { LogicDoc } from './contract.js';

export interface LogicEditorProps {
  value: LogicDoc;
  onChange: (doc: LogicDoc) => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}

const SNAP = 10;
const snap = (n: number): number => Math.round(n / SNAP) * SNAP;
const emptyDoc: LogicDoc = {
  inputs: [],
  gates: [],
  outputs: [],
  size: { w: 640, h: 360 },
};

type PaletteItem = { kind: string; label: string; glyph?: GateType };

function PaletteThumb({ glyph }: { glyph?: GateType }): ReactNode {
  if (!glyph)
    return (
      <span className="logic-palette-dot" aria-hidden>
        ●
      </span>
    );
  return (
    <svg className="logic-palette-glyph" viewBox="0 0 34 34" width={30} height={22} aria-hidden>
      <GateGlyph x={2} y={2} size={30} type={glyph} />
    </svg>
  );
}

export function LogicEditor({
  value,
  onChange,
  title = 'Build digital logic',
  description = 'Place gates, connect ports, and watch each signal propagate live.',
  children,
}: LogicEditorProps): ReactNode {
  const doc = value ?? emptyDoc;
  const W = doc.size?.w ?? 640;
  const [selected, setSelected] = useState<string | null>(null);
  const [wireStart, setWireStart] = useState<PortRef | null>(null);
  // live cursor (canvas coords) while a wire is pending, so a rubber-band can follow it
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const vp = useCanvasViewport({ world: { w: W, h: doc.size?.h ?? 360 } });
  const hostRef = vp.hostRef;
  const docRef = useRef(doc);
  docRef.current = doc;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const wireRef = useRef<PortRef | null>(wireStart);
  wireRef.current = wireStart;

  const toCanvas = (cx: number, cy: number): { x: number; y: number } => vp.toScene(cx, cy);

  // While a wire is pending: the rubber-band follows the cursor (mouse released), and Esc cancels.
  useEffect(() => {
    if (!wireStart) {
      setCursor(null);
      return;
    }
    const move = (ev: PointerEvent): void => setCursor(toCanvas(ev.clientX, ev.clientY));
    const key = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') setWireStart(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('keydown', key);
    };
  }, [wireStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const palette: PaletteItem[] = [
    { kind: 'input', label: 'Source (switch)' },
    ...listGates().map((g) => ({
      kind: g.kind,
      label: g.label,
      glyph: g.glyph,
    })),
    { kind: 'output', label: 'LED (output)' },
  ];

  const sel = [...doc.inputs, ...doc.gates, ...doc.outputs].find((n) => n.id === selected) ?? null;
  const selKind: 'input' | 'gate' | 'output' | null = !sel
    ? null
    : doc.inputs.some((n) => n.id === sel.id)
      ? 'input'
      : doc.gates.some((n) => n.id === sel.id)
        ? 'gate'
        : 'output';
  const selOutput = selKind === 'output' ? (doc.outputs.find((o) => o.id === sel!.id) ?? null) : null;
  const selInput = selKind === 'input' ? (doc.inputs.find((i) => i.id === sel!.id) ?? null) : null;

  const place = (kind: string, at: { x: number; y: number }): void => {
    const { doc: next, id } = addNode(docRef.current, kind, at);
    onChangeRef.current(next);
    setSelected(id);
  };
  const dropAt = (kind: string, clientX: number, clientY: number): void => {
    const host = hostRef.current;
    const n = docRef.current.gates.length + docRef.current.inputs.length;
    const fallback = {
      x: snap(120 + (n % 3) * 140),
      y: snap(70 + Math.floor(n / 3) * 80),
    };
    if (!host) return place(kind, fallback);
    const r = host.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom)
      return place(kind, fallback);
    const p = vp.toScene(clientX, clientY);
    place(kind, { x: snap(p.x), y: snap(p.y) });
  };
  const startPaletteDrag = (kind: string): void => {
    const up = (ev: PointerEvent): void => {
      window.removeEventListener('pointerup', up);
      dropAt(kind, ev.clientX, ev.clientY);
    };
    window.addEventListener('pointerup', up);
  };

  const portClick = (ref: PortRef): void => {
    if (ref.dir === 'out') {
      setWireStart((prev) => (prev && prev.nodeId === ref.nodeId ? null : ref));
      return;
    }
    const start = wireRef.current;
    if (start) {
      onChangeRef.current(
        connect(docRef.current, start.nodeId, {
          nodeId: ref.nodeId,
          slot: ref.slot,
        }),
      );
      setWireStart(null);
    } else onChangeRef.current(disconnect(docRef.current, { nodeId: ref.nodeId, slot: ref.slot })); // tap a filled input to clear it
  };
  const nodeClick = (id: string): void => {
    setSelected(id);
    if (docRef.current.inputs.some((i) => i.id === id)) onChangeRef.current(toggleInput(docRef.current, id));
  };

  // click-vs-drag (window listeners survive the re-render that moveNode triggers; absolute pos)
  const beginDrag = (id: string, e: ReactPointerEvent, onClick: () => void): void => {
    const node = [...docRef.current.inputs, ...docRef.current.gates, ...docRef.current.outputs].find(
      (n) => n.id === id,
    );
    const host = hostRef.current;
    if (!node || !host) return;
    e.preventDefault();
    const scale = vp.scale();
    const sx = e.clientX,
      sy = e.clientY,
      ox = node.x ?? 0,
      oy = node.y ?? 0;
    let moved = false;
    const move = (ev: PointerEvent): void => {
      if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 4) {
        moved = true;
        setSelected(id);
      }
      if (moved)
        onChangeRef.current(
          moveNode(docRef.current, id, {
            x: snap(ox + (ev.clientX - sx) / scale),
            y: snap(oy + (ev.clientY - sy) / scale),
          }),
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
  const onNodePointerDown = (id: string, e: ReactPointerEvent): void => beginDrag(id, e, () => nodeClick(id));
  const onPortPointerDown = (ref: PortRef, e: ReactPointerEvent): void =>
    beginDrag(ref.nodeId, e, () => portClick(ref));

  return (
    <Activity.Root className="editor-studio logic-editor-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading eyebrow="Logic studio" title={title} description={description} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{doc.gates.length} gates</strong>
        <span>{doc.inputs.length} sources</span>
        <span>{doc.outputs.length} outputs</span>
        <span className="circuit-editor-status-hint">
          {wireStart
            ? 'Wiring: choose an input port'
            : sel
              ? `${selKind} selected`
              : 'Select a node or add one'}
        </span>
        {wireStart && (
          <span className="circuit-editor-history">
            <EBtn variant="ghost" onClick={() => setWireStart(null)}>
              Cancel wire
            </EBtn>
          </span>
        )}
      </Activity.Status>
      {children}
      <Activity.Workspace>
        {/* palette */}
        <Activity.Inspector label="Add gates and nodes">
          <div className="circuit-editor-panel-head">Components</div>
          <div className="logic-palette-list">
            {palette.map((it) => (
              <Button
                key={it.kind}
                type="button"
                onPointerDown={() => startPaletteDrag(it.kind)}
                title={`add ${it.label} (or drag onto the canvas)`}
                variant="ghost"
                className="logic-palette-item"
              >
                <PaletteThumb glyph={it.glyph} />
                <span>{it.label}</span>
                <Plus className="logic-palette-add" aria-hidden />
              </Button>
            ))}
          </div>
        </Activity.Inspector>

        {/* canvas */}
        <Activity.Canvas label="Logic editor canvas">
          <div className="circuit-editor-guidance">
            <span>
              {wireStart
                ? 'Now click an input slot to connect (the wire follows your cursor). Press Esc or click empty space to cancel.'
                : 'Drag to arrange. Wire: click an output dot ● then an input slot. Scroll to pan, ⌘/Ctrl-scroll or Space-drag to zoom/pan.'}
            </span>
          </div>
          <div
            className="logic-editor-viewport"
            ref={hostRef}
            onPointerDown={vp.onHostPointerDown}
            style={{
              ...vp.gridStyle,
              ...vp.hostStyle,
            }}
          >
            <LogicEditScene
              doc={doc}
              selectedId={selected ?? undefined}
              wireStart={wireStart ?? undefined}
              previewCursor={wireStart ? (cursor ?? undefined) : undefined}
              onNodePointerDown={onNodePointerDown}
              onPortPointerDown={onPortPointerDown}
              onBackground={() => {
                setSelected(null);
                setWireStart(null);
              }}
              ariaLabel="logic circuit builder canvas"
              viewBox={vp.viewBox}
            />
            <ZoomBar
              zoom={vp.zoom}
              onZoomIn={vp.zoomIn}
              onZoomOut={vp.zoomOut}
              onFit={() => vp.fit(boundsOf([...doc.inputs, ...doc.gates, ...doc.outputs]) ?? undefined)}
            />
          </div>
        </Activity.Canvas>

        {/* inspector */}
        <Activity.Inspector label="Node properties">
          <div className="circuit-editor-panel-head">Properties</div>
          <div className="circuit-editor-properties">
            {!sel ? (
              <div className="logic-editor-empty">Select a node to edit it, or add one from the palette.</div>
            ) : (
              <div className="logic-editor-form">
                <Field label="label">
                  <TextInput
                    value={sel.label ?? ''}
                    onChange={(v) => onChange(relabel(doc, sel.id, v))}
                    ariaLabel="node label"
                  />
                </Field>
                {selInput && (
                  <Field label="value">
                    <EBtn active={!!selInput.value} onClick={() => onChange(toggleInput(doc, sel.id))}>
                      {selInput.value ? '1 (HIGH)' : '0 (LOW)'}
                    </EBtn>
                  </Field>
                )}
                {selOutput && (
                  <div className="logic-editor-goal">
                    <span>Goal (this LED)</span>
                    <div>
                      <EBtn
                        active={selOutput.goal === undefined}
                        onClick={() => onChange(setGoal(doc, sel.id, undefined))}
                      >
                        none
                      </EBtn>
                      <EBtn
                        active={selOutput.goal === false}
                        onClick={() => onChange(setGoal(doc, sel.id, false))}
                      >
                        want 0
                      </EBtn>
                      <EBtn
                        active={selOutput.goal === true}
                        onClick={() => onChange(setGoal(doc, sel.id, true))}
                      >
                        want 1
                      </EBtn>
                    </div>
                  </div>
                )}
                <div className="logic-editor-divider" />
                <EBtn
                  variant="danger"
                  title="delete node"
                  onClick={() => {
                    onChange(deleteNode(doc, sel.id));
                    setSelected(null);
                  }}
                >
                  <Trash2 aria-hidden /> Delete
                </EBtn>
              </div>
            )}
          </div>
        </Activity.Inspector>
      </Activity.Workspace>
    </Activity.Root>
  );
}
