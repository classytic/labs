'use client';

/**
 * A chain of stages on top, and its history underneath as a grid.
 *
 * The top row is the register now: an input on the left, four stages each holding one bit with its
 * parallel output drawn above it, and the far end where the oldest bit drops off. The arrows between
 * stages are the whole mechanism, so they are drawn as clearly as the stages themselves.
 *
 * The grid below keeps one row per clock edge, oldest at the top. A bit sent in on one edge appears
 * in the first column, then one column further right on each row after, so every bit draws a
 * diagonal. That diagonal is the explanation of why the word arrives reversed: the first bit has
 * simply been travelling longest. When the lab sets a target pattern it is drawn as a ghost row
 * under the grid, so the learner can see how far off the register is.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha, tint } from '../kit/figure/index.js';
import type { ShiftSnapshot } from './shift.js';

const W = 680;
const CELL = 54;
const GAP = 34;
const CHAIN_Y = 58;
const GRID_TOP = 150;
const ROW = 30;
const MAX_ROWS = 6;

const LIVE = 'var(--stage-live)';

export interface ShiftSceneProps {
  history: ShiftSnapshot[];
  /** Pattern the learner is trying to load, entry stage first. */
  target?: boolean[];
  label: string;
}

export function ShiftScene({ history, target, label }: ShiftSceneProps): ReactNode {
  const now = history[history.length - 1]!;
  const width = now.stages.length;
  const chainW = width * CELL + (width - 1) * GAP;
  const x0 = (W - chainW) / 2;
  const stageX = (index: number): number => x0 + index * (CELL + GAP);
  const rows = history.slice(-MAX_ROWS);
  const firstShown = history.length - rows.length;
  const gridBottom = GRID_TOP + rows.length * ROW;
  const H = gridBottom + (target ? 56 : 24);

  const arrow = (xa: number, xb: number, y: number, key: string, on: boolean): ReactNode => (
    <g key={key}>
      <line
        x1={xa}
        y1={y}
        x2={xb - 7}
        y2={y}
        stroke={on ? LIVE : alpha(HUE.ink, 55)}
        strokeWidth={STROKE.edge}
      />
      <path
        d={`M${xb},${y} L${xb - 9},${y - 5} L${xb - 9},${y + 5} Z`}
        fill={on ? LIVE : alpha(HUE.ink, 55)}
      />
    </g>
  );

  return (
    <Figure viewBox={[W, H]} domain="math" label={label}>
      {/* ── the chain ─────────────────────────────────────────────────────── */}
      <FigText x={x0 - 58} y={CHAIN_Y + CELL / 2 + 5} size="label" anchor="middle" tone="ink">
        in
      </FigText>
      {arrow(x0 - 40, x0, CHAIN_Y + CELL / 2, 'in', !!now.fed)}
      {now.stages.map((bit, index) => {
        const x = stageX(index);
        return (
          <g key={`stage-${index}`}>
            <rect
              x={x}
              y={CHAIN_Y}
              width={CELL}
              height={CELL}
              rx={6}
              fill={bit ? tint(LIVE, 70) : alpha(HUE.soft, 8)}
              stroke={bit ? LIVE : alpha(HUE.soft, 50)}
              strokeWidth={bit ? STROKE.edge : STROKE.line}
            />
            <FigText x={x + CELL / 2} y={CHAIN_Y + 35} size="title" anchor="middle" tone="ink" halo={false}>
              {bit ? '1' : '0'}
            </FigText>
            {/* The parallel output: every stage can be read at once, which is the point. */}
            <line
              x1={x + CELL / 2}
              y1={CHAIN_Y}
              x2={x + CELL / 2}
              y2={CHAIN_Y - 16}
              stroke={bit ? LIVE : alpha(HUE.soft, 60)}
              strokeWidth={STROKE.line}
            />
            <FigText x={x + CELL / 2} y={CHAIN_Y - 22} size="note" anchor="middle" tone="soft">
              stage {index + 1}
            </FigText>
            {index < width - 1 &&
              arrow(x + CELL, stageX(index + 1), CHAIN_Y + CELL / 2, `link-${index}`, bit)}
          </g>
        );
      })}
      {arrow(stageX(width - 1) + CELL, stageX(width - 1) + CELL + 40, CHAIN_Y + CELL / 2, 'out', !!now.out)}
      <FigText
        x={stageX(width - 1) + CELL + 58}
        y={CHAIN_Y + CELL / 2 + 5}
        size="label"
        anchor="middle"
        tone="ink"
      >
        out
      </FigText>

      {/* ── the history: one row per edge, so each bit draws a diagonal ────── */}
      <FigText x={x0} y={GRID_TOP - 12} size="note" tone="soft">
        after each clock edge
      </FigText>
      {rows.map((snapshot, r) => {
        const y = GRID_TOP + r * ROW;
        const edge = firstShown + r;
        const latest = r === rows.length - 1;
        return (
          <g key={`row-${edge}`}>
            <FigText x={x0 - 12} y={y + 19} size="note" anchor="end" tone={latest ? 'ink' : 'soft'}>
              {edge === 0 ? 'start' : `edge ${edge}, fed ${snapshot.fed ? 1 : 0}`}
            </FigText>
            {snapshot.stages.map((bit, index) => (
              <g key={`cell-${edge}-${index}`}>
                <rect
                  x={stageX(index) + 6}
                  y={y + 3}
                  width={CELL - 12}
                  height={ROW - 6}
                  rx={4}
                  fill={bit ? tint(LIVE, latest ? 75 : 45) : alpha(HUE.soft, 6)}
                  stroke={bit ? alpha(LIVE, latest ? 100 : 45) : alpha(HUE.soft, latest ? 45 : 25)}
                  strokeWidth={STROKE.hair}
                />
                <FigText
                  x={stageX(index) + CELL / 2}
                  y={y + 20}
                  size="note"
                  anchor="middle"
                  tone={bit ? 'ink' : 'soft'}
                  halo={false}
                >
                  {bit ? '1' : '0'}
                </FigText>
              </g>
            ))}
          </g>
        );
      })}

      {target && (
        <g>
          <FigText x={x0 - 12} y={gridBottom + 30} size="note" anchor="end" tone="ink">
            target
          </FigText>
          {target.map((bit, index) => {
            const match = now.stages[index] === bit;
            return (
              <g key={`target-${index}`}>
                <rect
                  x={stageX(index) + 6}
                  y={gridBottom + 12}
                  width={CELL - 12}
                  height={ROW - 6}
                  rx={4}
                  fill="none"
                  stroke={match ? LIVE : HUE.hot}
                  strokeWidth={STROKE.line}
                  strokeDasharray="4 3"
                />
                <FigText
                  x={stageX(index) + CELL / 2}
                  y={gridBottom + 29}
                  size="note"
                  anchor="middle"
                  tone={match ? 'ink' : 'hot'}
                  halo={false}
                >
                  {bit ? '1' : '0'}
                </FigText>
              </g>
            );
          })}
        </g>
      )}
    </Figure>
  );
}
