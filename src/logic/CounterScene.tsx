'use client';

/**
 * The register on top, and its history underneath.
 *
 * The top band is what a counter is right now: four flip-flops, most significant on the left as a
 * number is written, each lit when it holds a 1, with its place value under it. Beside it sits the
 * one gate that decides when to start again, labelled with exactly the bits it reads. For a full
 * 4-bit counter there is no gate, and the figure says so rather than drawing an idle one.
 *
 * The bottom band is the same four bits as waveforms, filled in one clock edge at a time as the
 * learner pulses the clock. Q0 sits nearest the clock because it follows it most closely, and each
 * row below changes half as often as the row above. That halving is the frequency-divider idea,
 * and it is visible without a word because the rows are stacked on one time axis.
 *
 * Every reset is marked where it happens. For a decade counter that mark is the gate acting, which
 * is the whole design, so it gets a line through every row rather than a footnote.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha, tint } from '../kit/figure/index.js';
import { GateGlyph } from '../kit/logic-gates/gate.js';
import { detectBits, detectLabel, type CounterRun } from './counter.js';

const W = 680;
const H = 404;

const CELL = { x: 40, y: 22, w: 58, h: 50, gap: 10 };
const LABEL_X = 18;
const WAVE_X = 132;
const WAVE_RIGHT = 660;
const ROW_Y = { clock: 160, first: 208, pitch: 46 };
const AMP = 18;

const LIVE = 'var(--stage-live)';
const PLACE = ['ones', 'twos', 'fours', 'eights'];

export interface CounterSceneProps {
  run: CounterRun;
  modulus: number;
  /** Rising edges applied so far. The waves are drawn up to here and no further. */
  edges: number;
  label: string;
}

export function CounterScene({ run, modulus, edges, label }: CounterSceneProps): ReactNode {
  const width = run.bits.length;
  const slots = run.clock.length;
  const slotW = (WAVE_RIGHT - WAVE_X) / slots;
  const xAt = (t: number): number => WAVE_X + t * slotW;
  // After `edges` rising edges the learner has seen every slot up to and including 2 * edges.
  const shownSlots = Math.min(slots, edges * 2 + 1);
  const countAt = (t: number): number =>
    run.bits.reduce((sum, wave, bit) => sum + (wave[t] ? 2 ** bit : 0), 0);
  const current = countAt(Math.max(0, shownSlots - 1));
  const full = modulus >= 2 ** width;
  const detect = detectBits(modulus);

  const rowY = (bit: number): number => ROW_Y.first + bit * ROW_Y.pitch;
  const path = (wave: boolean[], base: number): string =>
    wave
      .slice(0, shownSlots)
      .map((level, t) => {
        const y = level ? base - AMP : base;
        return t === 0 ? `M${xAt(0)},${y} H${xAt(1)}` : `V${y} H${xAt(t + 1)}`;
      })
      .join(' ');

  // Resets: the slots where the count drops back to 0 on an edge.
  const resets: number[] = [];
  for (let t = 1; t < shownSlots; t++) if (countAt(t) === 0 && countAt(t - 1) !== 0) resets.push(t);

  return (
    <Figure viewBox={[W, H]} domain="math" label={label}>
      {/* ── the register, as it is now ─────────────────────────────────────── */}
      {Array.from({ length: width }, (_, index) => {
        const bit = width - 1 - index; // most significant on the left, as a number is written
        const on = Math.floor(current / 2 ** bit) % 2 === 1;
        const x = CELL.x + index * (CELL.w + CELL.gap);
        return (
          <g key={bit}>
            <rect
              x={x}
              y={CELL.y}
              width={CELL.w}
              height={CELL.h}
              rx={6}
              fill={on ? tint(LIVE, 70) : alpha(HUE.soft, 8)}
              stroke={on ? LIVE : alpha(HUE.soft, 50)}
              strokeWidth={on ? STROKE.edge : STROKE.line}
            />
            <FigText x={x + CELL.w / 2} y={CELL.y + 33} size="title" anchor="middle" tone="ink" halo={false}>
              {on ? '1' : '0'}
            </FigText>
            <FigText x={x + CELL.w / 2} y={CELL.y + CELL.h + 16} size="note" anchor="middle" tone="soft">
              Q{bit} · {2 ** bit}
            </FigText>
          </g>
        );
      })}

      <FigText x={CELL.x + width * (CELL.w + CELL.gap) + 14} y={CELL.y + 36} size="title" tone="ink">
        = {current}
      </FigText>

      {/* ── the gate that decides when to start again ──────────────────────── */}
      {full ? (
        <FigText x={WAVE_RIGHT} y={CELL.y + 30} size="note" anchor="end" tone="soft">
          no gate needed: 4 bits wrap after 15 by themselves
        </FigText>
      ) : (
        <g>
          <FigText x={484} y={CELL.y + 30} size="label" anchor="end" tone="ink">
            {detectLabel(modulus)}
          </FigText>
          {/* One detected bit needs no gate at all, just a wire. A NOT glyph here would claim an
              inversion that is not there, so the single-bit case is drawn as what it is. */}
          {detect.length > 1 ? (
            <GateGlyph
              x={492}
              y={CELL.y + 6}
              size={44}
              type="AND"
              live={detect.every((bit) => Math.floor(current / 2 ** bit) % 2 === 1)}
            />
          ) : (
            <line
              x1={492}
              y1={CELL.y + 28}
              x2={544}
              y2={CELL.y + 28}
              stroke={Math.floor(current / 2 ** (detect[0] ?? 0)) % 2 === 1 ? LIVE : 'var(--stage-wire)'}
              strokeWidth={STROKE.edge}
            />
          )}
          <FigText x={552} y={CELL.y + 32} size="label" tone="ink">
            reset
          </FigText>
          <FigText x={WAVE_RIGHT} y={CELL.y + CELL.h + 16} size="note" anchor="end" tone="soft">
            fires at {modulus - 1}, clears on the next edge
          </FigText>
        </g>
      )}

      {/* ── resets, through every row ──────────────────────────────────────── */}
      {resets.map((t) => (
        <g key={`reset-${t}`}>
          <line
            x1={xAt(t)}
            y1={ROW_Y.clock - AMP - 10}
            x2={xAt(t)}
            y2={rowY(width - 1) + 8}
            stroke={alpha(HUE[2], 70)}
            strokeWidth={STROKE.line}
          />
          <FigText x={xAt(t)} y={ROW_Y.clock - AMP - 14} size="note" anchor="middle" tone="ink">
            {full ? 'wrap' : 'reset'}
          </FigText>
        </g>
      ))}

      {/* ── the waves, filled in as far as the clock has gone ──────────────── */}
      <FigText x={LABEL_X} y={ROW_Y.clock - 4} size="label" tone="ink">
        Clock
      </FigText>
      <path d={path(run.clock, ROW_Y.clock)} fill="none" stroke={HUE.ink} strokeWidth={STROKE.line} />

      {run.bits.map((wave, bit) => (
        <g key={`wave-${bit}`}>
          <FigText x={LABEL_X} y={rowY(bit) - 4} size="label" tone="ink">
            Q{bit}
          </FigText>
          {/* Place names, not "1s, 2s": in a lab that ends on a watch, "4s" reads as four seconds. */}
          <FigText x={LABEL_X + 30} y={rowY(bit) - 4} size="note" tone="soft">
            {PLACE[bit] ?? `${2 ** bit}`}
          </FigText>
          <line
            x1={xAt(shownSlots)}
            y1={rowY(bit)}
            x2={WAVE_RIGHT}
            y2={rowY(bit)}
            stroke={alpha(HUE.soft, 25)}
            strokeWidth={STROKE.hair}
            strokeDasharray="3 4"
          />
          <path d={path(wave, rowY(bit))} fill="none" stroke={LIVE} strokeWidth={STROKE.edge} />
        </g>
      ))}

      {/* ── the count between edges, under the waves ───────────────────────── */}
      {Array.from({ length: Math.floor((shownSlots + 1) / 2) }, (_, k) => {
        const t = k * 2;
        return (
          <FigText
            key={`count-${k}`}
            x={k === 0 ? xAt(0) + slotW / 2 : xAt(t)}
            y={rowY(width - 1) + 26}
            size="note"
            anchor="middle"
            tone={k * 2 === shownSlots - 1 ? 'ink' : 'soft'}
          >
            {countAt(t)}
          </FigText>
        );
      })}
    </Figure>
  );
}
