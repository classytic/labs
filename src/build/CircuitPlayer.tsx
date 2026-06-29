'use client';

/**
 * CircuitPlayer — a CircuitScene you can operate. The authored `doc` is the source of truth (so a
 * parent can drive it, e.g. a slider that changes a resistor's ohms), and the learner's taps
 * (close a switch, flip a component) are kept as a small per-part OVERLAY on top. That way an
 * external doc change is adopted live AND the user's taps survive it. The engine re-solves on
 * every change; CircuitScene stays a pure render.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { getPart } from './registry.js';
import { CircuitScene } from './CircuitScene.js';
import type { CircuitDoc } from './contract.js';

export interface CircuitPlayerProps {
  doc: CircuitDoc;
  flow?: boolean;
  ariaLabel?: string;
  /** notified after every tap with the new doc (e.g. to check a goal). */
  onChange?: (doc: CircuitDoc) => void;
}

type Overlay = Record<string, Record<string, number | string | boolean>>;

const applyOverlay = (doc: CircuitDoc, overlay: Overlay): CircuitDoc => ({
  ...doc,
  parts: doc.parts.map((p) => (overlay[p.id] ? { ...p, props: { ...p.props, ...overlay[p.id] } } : p)),
});

export function CircuitPlayer({ doc: authored, flow = true, ariaLabel, onChange }: CircuitPlayerProps): ReactNode {
  // taps accumulate as prop overrides keyed by part id; the authored doc (props) stays the base, so
  // a parent re-rendering with new component values flows through while taps persist.
  const [overlay, setOverlay] = useState<Overlay>({});
  const doc = useMemo(() => applyOverlay(authored, overlay), [authored, overlay]);

  const tap = (partId: string): void => {
    const part = doc.parts.find((p) => p.id === partId);
    if (!part) return;
    const patch = getPart(part.kind)?.tap?.(part);
    if (!patch) return;
    const next: Overlay = { ...overlay, [partId]: { ...(overlay[partId] ?? {}), ...patch } };
    setOverlay(next);
    onChange?.(applyOverlay(authored, next));
  };

  return <CircuitScene doc={doc} flow={flow} ariaLabel={ariaLabel} onPartTap={tap} />;
}
