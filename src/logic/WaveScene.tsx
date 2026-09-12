'use client';

/**
 * A timing diagram built from rows: the general form of `TimingScene`.
 *
 * Every sequential lab ends up drawing the same picture: a clock, some inputs, some outputs, and
 * the rising edges as lines through all of them. What differs is which rows the learner may draw
 * on, and what gets written at each edge. So those are the two things a caller supplies, and the
 * drawing rules stay in one place: edges run through every row, a dot marks where an edge SAMPLES
 * a row, and the label at an edge sits under the last row so it can never land on a wave.
 *
 * Rows marked `editable` are drawn on by tapping a slot, like a pencil on graph paper. Hidden rows
 * are boxed "predict first", which is how a lab keeps its answer off the page until it is earned.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha } from '../kit/figure/index.js';
import type { Wave } from './timing.js';

const W = 680;
const LABEL_X = 18;
const WAVE_X = 172;
const WAVE_RIGHT = 660;
const AMP = 22;
const TOP = 58;
const PITCH = 78;

export interface WaveRow {
  key: string;
  label: string;
  /** The row's rule, said once and where it applies. */
  rule?: string;
  wave: Wave;
  /** 'clock' draws in ink, 'input' in the input hue, 'output' in the live colour. */
  role: 'clock' | 'input' | 'output';
  editable?: boolean;
  hidden?: boolean;
}

export interface WaveMark {
  t: number;
  text: string;
  tone?: 'ink' | 'soft' | 'hot';
}

export interface WaveSceneProps {
  rows: WaveRow[];
  edges: number[];
  /** Rows the edges read from: a dot is drawn on each of them at every edge. */
  sampled?: string[];
  /** Words written under the diagram at an edge, such as what a flip-flop did there. */
  marks?: WaveMark[];
  /** Edges to draw heavier, such as the ones where something changed. */
  emphasis?: number[];
  onToggle?: (row: string, slot: number) => void;
  label: string;
}

const INPUT_INK = HUE[3];
const LIVE = 'var(--stage-live)';

export function WaveScene({
  rows,
  edges,
  sampled = [],
  marks = [],
  emphasis = [],
  onToggle,
  label,
}: WaveSceneProps): ReactNode {
  const slots = rows[0]?.wave.length ?? 1;
  const slotW = (WAVE_RIGHT - WAVE_X) / slots;
  const xAt = (t: number): number => WAVE_X + t * slotW;
  const rowY = (index: number): number => TOP + index * PITCH;
  const lastY = rowY(rows.length - 1);
  const H = lastY + (marks.length ? 52 : 24);

  const path = (wave: Wave, base: number): string =>
    wave
      .map((level, t) => {
        const y = level ? base - AMP : base;
        return t === 0 ? `M${xAt(0)},${y} H${xAt(1)}` : `V${y} H${xAt(t + 1)}`;
      })
      .join(' ');

  return (
    <Figure viewBox={[W, H]} domain="math" label={label}>
      {/* The edges, through every row, drawn first so the waves sit on top. */}
      {edges.map((t) => (
        <line
          key={`edge-${t}`}
          x1={xAt(t)}
          y1={TOP - AMP - 12}
          x2={xAt(t)}
          y2={lastY + 10}
          stroke={alpha(INPUT_INK, emphasis.includes(t) ? 90 : 50)}
          strokeWidth={emphasis.includes(t) ? STROKE.line : STROKE.hair}
          strokeDasharray={emphasis.includes(t) ? undefined : '4 3'}
        />
      ))}

      {rows.map((row, index) => {
        const y = rowY(index);
        const ink = row.role === 'clock' ? HUE.ink : row.role === 'input' ? INPUT_INK : LIVE;
        return (
          <g key={row.key}>
            <FigText x={LABEL_X} y={y - AMP / 2 + (row.rule ? -2 : 5)} size="label" tone="ink">
              {row.label}
            </FigText>
            {row.rule && (
              <FigText x={LABEL_X} y={y - AMP / 2 + 14} size="note" tone="soft">
                {row.rule}
              </FigText>
            )}
            {row.editable &&
              onToggle &&
              row.wave.map((level, t) => (
                <rect
                  key={`${row.key}-${t}`}
                  role="switch"
                  aria-checked={level}
                  aria-label={`${row.label} at time ${t}`}
                  tabIndex={0}
                  x={xAt(t)}
                  y={y - AMP - 6}
                  width={slotW}
                  height={AMP + 12}
                  fill={t % 2 === 0 ? alpha(HUE.soft, 4) : 'transparent'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onToggle(row.key, t)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onToggle(row.key, t);
                    }
                  }}
                />
              ))}
            {row.hidden ? (
              <g>
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
            ) : (
              <path
                d={path(row.wave, y)}
                fill="none"
                stroke={ink}
                strokeWidth={row.role === 'clock' ? STROKE.line : STROKE.edge}
                style={{ pointerEvents: 'none' }}
              />
            )}
            {sampled.includes(row.key) &&
              !row.hidden &&
              edges.map((t) => (
                <circle
                  key={`dot-${row.key}-${t}`}
                  cx={xAt(t)}
                  cy={row.wave[t] ? y - AMP : y}
                  r={4}
                  fill={ink}
                />
              ))}
          </g>
        );
      })}

      {marks.map((mark) => (
        <FigText
          key={`mark-${mark.t}`}
          x={xAt(mark.t)}
          y={lastY + 30}
          size="note"
          anchor="middle"
          tone={mark.tone ?? 'ink'}
        >
          {mark.text}
        </FigText>
      ))}
    </Figure>
  );
}
