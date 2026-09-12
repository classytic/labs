'use client';

/**
 * A timing diagram in which the answer is shaded.
 *
 * Four rows on one time axis: the clock, D, and the Q of each circuit. The rising edges are drawn
 * as lines through every row, because the edge is the only moment the flip-flop looks, and a line
 * through all four rows makes "at this instant" a place on the page rather than a phrase.
 *
 * Each Q row carries its own rule as a subtitle, said once and in the place it applies: the latch
 * row is tinted over every clock-high window (the latch is open there) and the flip-flop row is
 * not. The slots where the two Qs disagree are shaded across both rows. That shading IS the exam
 * answer, and it lands exactly on the parts of D that fall inside an open window without touching
 * an edge.
 *
 * The D row is drawn, not typed: every slot is a target, so the learner can put a pulse wherever
 * they want and watch which circuit notices it.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha } from '../kit/figure/index.js';
import { risingEdges, type Wave } from './timing.js';

const W = 680;
const H = 336;

const LABEL_X = 18;
const WAVE_X = 172;
const WAVE_RIGHT = 660;
const AMP = 22;

const ROWS = { clock: 62, d: 136, latch: 222, flipFlop: 302 };

const LIVE = 'var(--stage-live)';
/**
 * One colour, one meaning. D and the dots where the flip-flop reads it share a hue, because a dot
 * is "D, at this instant". Red is reserved for disagreement. Under the physics palette HUE[2] is red,
 * which made the D wave and the exam-answer shading the same colour, so this figure uses the math
 * palette's third hue instead.
 */
const D_INK = HUE[3];

export interface TimingSceneProps {
  clock: Wave;
  d: Wave;
  latch: Wave;
  flipFlop: Wave;
  disagree: number[];
  violations: number[];
  /** The Q rows stay hidden until the learner has predicted. */
  revealed: boolean;
  onToggleD?: (slot: number) => void;
  label: string;
}

export function TimingScene({
  clock,
  d,
  latch,
  flipFlop,
  disagree,
  violations,
  revealed,
  onToggleD,
  label,
}: TimingSceneProps): ReactNode {
  const slots = clock.length;
  const slotW = (WAVE_RIGHT - WAVE_X) / slots;
  const xAt = (t: number): number => WAVE_X + t * slotW;
  const edges = risingEdges(clock);

  const path = (wave: Wave, base: number): string =>
    wave
      .map((level, t) => {
        const y = level ? base - AMP : base;
        return t === 0 ? `M${xAt(0)},${y} H${xAt(1)}` : `V${y} H${xAt(t + 1)}`;
      })
      .join(' ');

  // Runs of clock-high slots, where the latch is transparent.
  const openWindows: [number, number][] = [];
  clock.forEach((level, t) => {
    if (!level) return;
    const last = openWindows[openWindows.length - 1];
    if (last && last[1] === t - 1) last[1] = t;
    else openWindows.push([t, t]);
  });

  const rowLabel = (y: number, title: string, rule?: string): ReactNode => (
    <g>
      <FigText x={LABEL_X} y={y - AMP / 2 + (rule ? -2 : 5)} size="label" tone="ink">
        {title}
      </FigText>
      {rule && (
        <FigText x={LABEL_X} y={y - AMP / 2 + 14} size="note" tone="soft">
          {rule}
        </FigText>
      )}
    </g>
  );

  return (
    <Figure viewBox={[W, H]} domain="math" label={label}>
      {/* ── where the latch is open ─────────────────────────────────────────── */}
      {revealed &&
        openWindows.map(([from, to]) => (
          <rect
            key={`open-${from}`}
            x={xAt(from)}
            y={ROWS.latch - AMP - 8}
            width={(to - from + 1) * slotW}
            height={AMP + 16}
            fill={alpha(HUE[1], 10)}
          />
        ))}

      {/* ── where the two circuits disagree: the exam answer ──────────────────── */}
      {revealed &&
        disagree.map((t) => (
          <rect
            key={`diff-${t}`}
            x={xAt(t)}
            y={ROWS.latch - AMP - 8}
            width={slotW}
            height={ROWS.flipFlop - ROWS.latch + AMP + 16}
            fill={alpha(HUE.hot, 18)}
          />
        ))}

      {/* ── the rising edges, through every row ────────────────────────────── */}
      {edges.map((t) => (
        <g key={`edge-${t}`}>
          <line
            x1={xAt(t)}
            y1={ROWS.clock - AMP - 12}
            x2={xAt(t)}
            y2={ROWS.flipFlop + 10}
            stroke={alpha(D_INK, 55)}
            strokeWidth={STROKE.hair}
            strokeDasharray="4 3"
          />
          {/* Where the flip-flop reads D: a dot on the D wave at the edge. */}
          <circle cx={xAt(t)} cy={d[t] ? ROWS.d - AMP : ROWS.d} r={4} fill={D_INK} />
        </g>
      ))}
      {violations.map((t) => (
        <FigText key={`viol-${t}`} x={xAt(t) + 6} y={ROWS.d - AMP - 8} size="note" tone="hot">
          D moved on the edge
        </FigText>
      ))}

      {/* ── the rows ────────────────────────────────────────────────────────── */}
      {rowLabel(ROWS.clock, 'Clock')}
      <path d={path(clock, ROWS.clock)} fill="none" stroke={HUE.ink} strokeWidth={STROKE.line} />

      {rowLabel(ROWS.d, 'D', 'tap a slot to change it')}
      {onToggleD &&
        d.map((_, t) => (
          <rect
            key={`slot-${t}`}
            role="switch"
            aria-checked={d[t]}
            aria-label={`D at time ${t}`}
            tabIndex={0}
            x={xAt(t)}
            y={ROWS.d - AMP - 6}
            width={slotW}
            height={AMP + 12}
            fill={t % 2 === 0 ? alpha(HUE.soft, 4) : 'transparent'}
            style={{ cursor: 'pointer' }}
            onClick={() => onToggleD(t)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onToggleD(t);
              }
            }}
          />
        ))}
      <path
        d={path(d, ROWS.d)}
        fill="none"
        stroke={D_INK}
        strokeWidth={STROKE.edge}
        style={{ pointerEvents: 'none' }}
      />

      {rowLabel(ROWS.latch, 'Q, D latch', 'open while clock is high')}
      {rowLabel(ROWS.flipFlop, 'Q, flip-flop', 'reads D at each rising edge')}
      {revealed ? (
        <>
          <path d={path(latch, ROWS.latch)} fill="none" stroke={LIVE} strokeWidth={STROKE.edge} />
          <path d={path(flipFlop, ROWS.flipFlop)} fill="none" stroke={LIVE} strokeWidth={STROKE.edge} />
        </>
      ) : (
        <>
          {[ROWS.latch, ROWS.flipFlop].map((y) => (
            <g key={`hidden-${y}`}>
              <rect
                x={WAVE_X}
                y={y - AMP - 6}
                width={WAVE_RIGHT - WAVE_X}
                height={AMP + 12}
                rx={4}
                fill={alpha(HUE.soft, 8)}
                stroke={alpha(HUE.soft, 30)}
                strokeWidth={STROKE.hair}
                strokeDasharray="4 3"
              />
              {/* Exactly midway between the first two edges, the widest clear gap there is. The axis
                  midpoint IS the edge at 12, and three quarters of a period ran the words across
                  the next edge, so both earlier positions put a dashed line through the label. */}
              <FigText
                x={xAt(edges.length > 1 ? (edges[0]! + edges[1]!) / 2 : slots / 2)}
                y={y - AMP / 2 + 4}
                size="note"
                anchor="middle"
                tone="soft"
              >
                predict first
              </FigText>
            </g>
          ))}
        </>
      )}
    </Figure>
  );
}
