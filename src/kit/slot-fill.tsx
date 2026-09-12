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
  /** slot id → the tile index that filled it (so a blank can be un-filled). */
  slotTile: Record<string, number>;
  slots: FillSlot[];
  tiles: (string | number)[];
  /** Try to drop tile `i` into the active blank; wrong shakes + clears. */
  place: (tileIdx: number) => void;
  /** Take the tile back out of a filled blank (returns it to the tray). No-op once solved. */
  clear: (slotId: string) => void;
  reset: () => void;
}

/** The headless engine: tile pool + per-slot grading + the shared checkpoint report. */
export function useSlotFill(
  slots: FillSlot[],
  tiles: (string | number)[],
  activity: string,
  onSolved?: () => void,
): SlotFillState {
  const [filled, setFilled] = useState<Record<string, string>>({});
  const [usedTiles, setUsedTiles] = useState<Set<number>>(new Set());
  const [slotTile, setSlotTile] = useState<Record<string, number>>({});
  const [wrong, setWrong] = useState<{ slot: string; tile: number } | null>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeId = slots.find((s) => filled[s.id] == null)?.id ?? null;
  const solved =
    slots.length > 0 && slots.every((s) => filled[s.id] != null && norm(filled[s.id]!) === norm(s.answer));

  useCheckpoint({ solved, activity });
  const fired = useRef(false);
  useEffect(() => {
    if (solved && !fired.current) {
      fired.current = true;
      onSolved?.();
    }
  }, [solved, onSolved]);
  useEffect(
    () => () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    },
    [],
  );

  const place = (tileIdx: number): void => {
    if (!activeId || usedTiles.has(tileIdx)) return;
    const slot = slots.find((s) => s.id === activeId)!;
    const val = norm(tiles[tileIdx]!);
    if (val === norm(slot.answer)) {
      setFilled((f) => ({ ...f, [activeId]: String(tiles[tileIdx]) }));
      setUsedTiles((u) => new Set(u).add(tileIdx));
      setSlotTile((m) => ({ ...m, [activeId]: tileIdx }));
      setWrong(null);
    } else {
      setWrong({ slot: activeId, tile: tileIdx });
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrong(null), 450);
    }
  };

  const clear = (slotId: string): void => {
    // Don't unpick after every blank is right — the checkpoint has already reported.
    if (solved || filled[slotId] == null) return;
    const tileIdx = slotTile[slotId];
    setFilled((f) => {
      const n = { ...f };
      delete n[slotId];
      return n;
    });
    setSlotTile((m) => {
      const n = { ...m };
      delete n[slotId];
      return n;
    });
    if (tileIdx != null)
      setUsedTiles((u) => {
        const n = new Set(u);
        n.delete(tileIdx);
        return n;
      });
    setWrong(null);
  };

  const reset = (): void => {
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    setFilled({});
    setUsedTiles(new Set());
    setSlotTile({});
    setWrong(null);
    fired.current = false;
  };

  return { filled, activeId, solved, wrong, usedTiles, slotTile, slots, tiles, place, clear, reset };
}

/** One inline blank, drops anywhere in a sentence/expression. Reads `fill` by slot id.
 *  A filled blank is tappable to clear (returns its tile to the tray) until solved. */
export function Blank({
  fill,
  id,
  width = 46,
}: {
  fill: SlotFillState;
  id: string;
  width?: number;
}): ReactNode {
  const slot = fill.slots.find((s) => s.id === id);
  const v = fill.filled[id];
  const isActive = id === fill.activeId;
  const isWrong = fill.wrong?.slot === id;
  const clearable = v != null && !fill.solved;
  const cellStyle = {
    position: 'relative' as const,
    minWidth: width,
    height: 42,
    padding: '0 8px',
    borderRadius: 9,
    display: 'grid',
    placeItems: 'center',
    fontSize: 17,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums' as const,
    fontFamily: 'inherit',
    appearance: 'none' as const,
    background: v ? 'color-mix(in oklab, var(--stage-good) 18%, transparent)' : 'transparent',
    border: `2px ${v ? 'solid' : 'dashed'} ${v ? 'var(--stage-good)' : isActive ? 'var(--stage-accent)' : 'color-mix(in oklab, var(--stage-fg) 30%, transparent)'}`,
    color: v ? 'var(--stage-good)' : 'var(--stage-fg)',
    cursor: clearable ? 'pointer' : 'default',
    animation: isWrong ? 'slotfill-shake 0.4s' : undefined,
    transition: 'border-color 0.15s, background 0.15s',
  };
  const label = v
    ? clearable
      ? `filled ${v}, tap to clear`
      : `filled ${v}`
    : isActive
      ? 'active blank'
      : 'blank';
  const content = (
    <>
      {v ?? (isActive ? '▾' : '')}
      {clearable && (
        <span
          aria-hidden
          className="absolute -right-[7px] -top-[7px] grid size-4 place-items-center rounded-full bg-[var(--stage-good)] text-[11px] font-black leading-none text-[var(--stage-bg)] shadow-sm"
        >
          ×
        </span>
      )}
    </>
  );
  return (
    <span className="inline-grid justify-items-center gap-[3px] align-middle">
      {clearable ? (
        <button
          type="button"
          onClick={() => fill.clear(id)}
          aria-label={label}
          title="Tap to clear"
          style={cellStyle}
        >
          {content}
        </button>
      ) : (
        <span aria-label={label} style={cellStyle}>
          {content}
        </span>
      )}
      {slot?.label != null && (
        <span className="text-[11px] font-semibold text-[var(--stage-muted)]">{slot.label}</span>
      )}
    </span>
  );
}

/** The tile tray, tap a tile and it drops into the active blank. */
export function SlotTray({ fill }: { fill: SlotFillState }): ReactNode {
  // fit-content + auto margins + alignSelf: the tray centers itself under the
  // figure whatever the lab's container is (block, grid, or start-aligned flex
  // column) — left-hugging trays read as misaligned clutter.
  return (
    <div className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-2.5 self-center rounded-xl bg-[color-mix(in_oklab,var(--stage-fg)_6%,transparent)] px-3.5 py-2.5">
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
              minWidth: 44,
              height: 44,
              padding: '0 10px',
              borderRadius: 10,
              fontSize: 17,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
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
    <div className="not-prose mt-2 grid justify-items-center gap-3">
      {prompt && <p className="m-0 text-center font-semibold">{prompt}</p>}
      <div className="flex flex-wrap justify-center gap-3 rounded-xl border border-[color-mix(in_oklab,var(--stage-fg)_14%,transparent)] px-3.5 py-2.5">
        {slots.map((s) => (
          <Blank key={s.id} fill={fill} id={s.id} />
        ))}
      </div>
      <SlotTray fill={fill} />
      {fill.solved && (
        <p role="status" className="m-0 font-bold text-[var(--stage-good)]">
          ✓ Nice, that's the pattern.
        </p>
      )}
    </div>
  );
}
