'use client';

/**
 * LabGallery — the visual lab PICKER primitive. Instead of a 80-item slash menu,
 * a host shows ONE "Insert lab" affordance that opens this gallery in a sheet: a
 * searchable, domain-grouped grid where each card is a LIVE mini-preview of the lab
 * (the block spec rendered in `preview` mode with default props), mounted lazily as
 * it scrolls into view. Picking a card calls `onPick(item)` — the host then inserts
 * that lab's concrete block. Editor-agnostic: it only needs the block metadata +
 * each spec's render `Component`.
 */

import { Component as ReactComponent, createElement, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/** The minimum a gallery card needs — structurally satisfied by a cms-ui BlockSpec. */
export interface LabPickItem {
  key: string;
  /** MDX tag / Plate node type the host inserts on pick. */
  tag?: string;
  label: string;
  description?: string;
  /** Subject grouping for the gallery (e.g. 'Math', 'Physics'). */
  group?: string;
  /** Renders the lab; called with `mode:'preview'` for the thumbnail. */
  Component: (props: { attributes: Record<string, unknown>; mode: string }) => ReactNode;
  /** Example attributes to preview with (defaults to {} → the lab's own defaults). */
  defaults?: Record<string, unknown>;
}

/** Isolate a single preview so one lab that throws can't take down the gallery. */
class PreviewBoundary extends ReactComponent<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } { return { failed: true }; }
  render(): ReactNode {
    if (this.state.failed) return <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--stage-muted)', fontSize: 12 }}>preview unavailable</div>;
    return this.props.children;
  }
}

function LivePreview({ item }: { item: LabPickItem }): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    if (typeof IntersectionObserver === 'undefined') { setShow(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setShow(true); io.disconnect(); } }, { rootMargin: '250px' });
    io.observe(el);
    return () => io.disconnect();
  }, [show]);
  return (
    <div ref={ref} aria-hidden style={{ pointerEvents: 'none', height: 150, overflow: 'hidden', borderRadius: 10, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      {show
        ? <PreviewBoundary>{createElement(item.Component as never, { attributes: item.defaults ?? {}, mode: 'preview' })}</PreviewBoundary>
        : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--stage-muted)', fontSize: 12 }}>preview…</div>}
    </div>
  );
}

export interface LabGalleryProps {
  blocks: LabPickItem[];
  onPick?: (item: LabPickItem) => void;
}

export function LabGallery({ blocks, onPick }: LabGalleryProps): ReactNode {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const groups = useMemo(() => [...new Set(blocks.map((b) => b.group ?? 'Other'))].sort(), [blocks]);
  const ql = q.trim().toLowerCase();
  const items = blocks.filter((b) =>
    (!group || (b.group ?? 'Other') === group) &&
    (!ql || `${b.label} ${b.description ?? ''} ${b.group ?? ''}`.toLowerCase().includes(ql)),
  );

  return (
    <div className="lab-gallery" style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 200 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <input
          className="lab-input" value={q} placeholder="Search labs…" aria-label="search labs"
          onChange={(e) => setQ(e.currentTarget.value)} style={{ flex: '1 1 200px' }}
        />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button type="button" className="lab-choice" data-picked={group === null || undefined} onClick={() => setGroup(null)}>All</button>
        {groups.map((g) => (
          <button key={g} type="button" className="lab-choice" data-picked={group === g || undefined} onClick={() => setGroup((c) => (c === g ? null : g))}>{g}</button>
        ))}
      </div>
      {items.length === 0 ? (
        <p style={{ color: 'var(--stage-muted)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>No labs match “{q}”.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {items.map((b) => (
            // a div (not <button>) — the live preview contains the lab's own buttons,
            // and button-inside-button is invalid HTML. role+keydown keep it accessible.
            <div
              key={b.key} role="button" tabIndex={0} onClick={() => onPick?.(b)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick?.(b); } }}
              className="lab-gallery-card" aria-label={`Insert ${b.label}`}
              style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left', padding: 10, borderRadius: 12, border: '1px solid var(--border, color-mix(in oklab, currentColor 16%, transparent))', background: 'var(--card, transparent)', cursor: 'pointer' }}
            >
              <LivePreview item={b} />
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{b.label}</span>
              {b.description && <span style={{ fontSize: 12, color: 'var(--stage-muted, color-mix(in oklab, currentColor 55%, transparent))', lineHeight: 1.35 }}>{b.description}</span>}
              {b.group && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--stage-muted)' }}>{b.group}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
