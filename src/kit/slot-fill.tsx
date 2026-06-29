'use client';

/**
 * SlotFill, the "tap a tile into the blank" answer interaction, the lightweight,
 * mobile-first commit Brilliant uses everywhere (fill Day 1 = ?, "translate by (▢,▢)",
 * "a total of ▢ items"). It beats a typed box for short numeric/word answers: nothing
 * to mistype, it reads as a game, and it works one-thumbed.
 *
 * HEADLESS by design: `useSlotFill` owns the tray + grading + checkpoint, and the
 * presentational pieces (<Blank> for one blank, <SlotTray> for the tile pool) read from
 * it. That's the reuse win, the SAME engine drives a tidy row (<SlotFill>) OR blanks
 * embedded inline in a sentence/expression (a receipt total, a translation vector), so
 * every fill-in lesson shares one tested core instead of re-rolling tile state.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useCheckpoint } from './pedagogy.js';

export interface FillSlot {
  id: string;
  answer: string | number;
  /** Small caption under the blank (e.g. "Day 1"). */
  label?: ReactNode;
}

const norm = (v: string | number): string => String(v).trim();

export interface SlotFillState {
  filled: Record<string, string>;
  activeId: string | null;
  solved: boolean;
  wrong: { slot: string; tile: number } | null;
  usedTiles: Set<number>;
  slots: FillSlot[];
  tiles: (string | number)[];
  /** Try to drop tile `i` into the active blank; wrong shakes + clears. */
  place: (tileIdx: number) => void;
  reset: () => void;
}

/** The headless engine: tile pool + per-slot grading + the shared checkpoint report. */
export function useSlotFill(
  slots: FillSlot[], tiles: (string | number)[], activity: string, onSolved?: () => void,
): SlotFillState {
  const [filled, setFilled] = useState<Record<string, string>>({});
  const [usedTiles, setUsedTiles] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<{ slot: string; tile: number } | null>(null);

  const activeId = slots.find((s) => filled[s.id] == null)?.id ?? null;
  const solved = slots.length > 0 && slots.every((s) => filled[s.id] != null && norm(filled[s.id]!) === norm(s.answer));

  useCheckpoint({ solved, activity });
  const fired = useRef(false);
  useEffect(() => {
    if (solved && !fired.current) { fired.current = true; onSolved?.(); }
  }, [solved, onSolved]);

  const place = (tileIdx: number): void => {
    if (!activeId || usedTiles.has(tileIdx)) return;
    const slot = slots.find((s) => s.id === activeId)!;
    const val = norm(tiles[tileIdx]!);
    if (val === norm(slot.answer)) {
      setFilled((f) => ({ ...f, [activeId]: String(tiles[tileIdx]) }));
      setUsedTiles((u) => new Set(u).add(tileIdx));
      setWrong(null);
    } else {
      setWrong({ slot: activeId, tile: tileIdx });
      setTimeout(() => setWrong(null), 450);
    }
  };

  const reset = (): void => { setFilled({}); setUsedTiles(new Set()); setWrong(null); fired.current = false; };

  return { filled, activeId, solved, wrong, usedTiles, slots, tiles, place, reset };
}

/** One inline blank, drops anywhere in a sentence/expression. Reads `fill` by slot id. */
export function Blank({ fill, id, width = 46 }: { fill: SlotFillState; id: string; width?: number }): ReactNode {
  const slot = fill.slots.find((s) => s.id === id);
  const v = fill.filled[id];
  const isActive = id === fill.activeId;
  const isWrong = fill.wrong?.slot === id;
  return (
    <span style={{ display: 'inline-grid', justifyItems: 'center', gap: 3, verticalAlign: 'middle' }}>
      <span
        aria-label={v ? `filled ${v}` : isActive ? 'active blank' : 'blank'}
        style={{
          minWidth: width, height: 42, padding: '0 8px', borderRadius: 9, display: 'grid', placeItems: 'center',
          fontSize: 17, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
          background: v ? 'color-mix(in oklab, var(--stage-good) 18%, transparent)' : 'transparent',
          border: `2px ${v ? 'solid' : 'dashed'} ${v ? 'var(--stage-good)' : isActive ? 'var(--stage-accent)' : 'color-mix(in oklab, var(--stage-fg) 30%, transparent)'}`,
          color: v ? 'var(--stage-good)' : 'var(--stage-fg)',
          animation: isWrong ? 'slotfill-shake 0.4s' : undefined,
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        {v ?? (isActive ? '▾' : '')}
      </span>
      {slot?.label != null && <span style={{ fontSize: 11, color: 'var(--stage-muted)', fontWeight: 600 }}>{slot.label}</span>}
    </span>
  );
}

/** The tile tray, tap a tile and it drops into the active blank. */
export function SlotTray({ fill }: { fill: SlotFillState }): ReactNode {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', padding: '10px 14px', borderRadius: 12, background: 'color-mix(in oklab, var(--stage-fg) 6%, transparent)' }}>
      {fill.tiles.map((t, i) => {
        const used = fill.usedTiles.has(i);
        const isWrong = fill.wrong?.tile === i;
        return (
          <button
            key={i}
            type="button"
            disabled={used || fill.solved}
            onClick={() => fill.place(i)}
            aria-label={`tile ${t}`}
            style={{
              minWidth: 44, height: 44, padding: '0 10px', borderRadius: 10, fontSize: 17, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
              cursor: used || fill.solved ? 'default' : 'pointer',
              background: used ? 'color-mix(in oklab, var(--stage-fg) 10%, transparent)' : 'var(--stage-bg)',
              color: used ? 'transparent' : 'var(--stage-fg)',
              border: `2px solid ${isWrong ? 'var(--stage-warn)' : used ? 'transparent' : 'color-mix(in oklab, var(--stage-fg) 26%, transparent)'}`,
              animation: isWrong ? 'slotfill-shake 0.4s' : undefined,
              transition: 'transform 0.1s',
            }}
          >
            {used ? '' : t}
          </button>
        );
      })}
      <style>{`@keyframes slotfill-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}60%{transform:translateX(5px)}}`}</style>
    </div>
  );
}

export interface SlotFillProps {
  slots: FillSlot[];
  /** The tile pool: the answers + a few distractors. Order is preserved. */
  tiles: (string | number)[];
  activity: string;
  prompt?: ReactNode;
  /** Fired once when every slot is correct (e.g. to reveal the figure values). */
  onSolved?: () => void;
}

/** Row layout: labelled blanks in a bordered strip + the tray. The common case. */
export function SlotFill({ slots, tiles, activity, prompt, onSolved }: SlotFillProps): ReactNode {
  const fill = useSlotFill(slots, tiles, activity, onSolved);
  return (
    <div className="not-prose" style={{ display: 'grid', gap: 12, justifyItems: 'center', marginTop: 8 }}>
      {prompt && <p style={{ margin: 0, fontWeight: 600, textAlign: 'center' }}>{prompt}</p>}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', padding: '10px 14px', borderRadius: 12, border: '1px solid color-mix(in oklab, var(--stage-fg) 14%, transparent)' }}>
        {slots.map((s) => <Blank key={s.id} fill={fill} id={s.id} />)}
      </div>
      <SlotTray fill={fill} />
      {fill.solved && <p role="status" style={{ margin: 0, color: 'var(--stage-good)', fontWeight: 700 }}>✓ Nice, that's the pattern.</p>}
    </div>
  );
}
