'use client';

/**
 * A state diagram that draws itself from the pattern, over the input it is reading.
 *
 * The layout carries the lesson. States sit in one row, ordered by how much of the pattern they
 * have matched, so "making progress" is literally moving right. Every transition then falls into
 * one of three shapes, and each shape means one thing:
 *
 * - a straight arrow to the right: the bit matched, one step closer;
 * - a loop above a state: the bit changed nothing about how much is matched;
 * - an arc below: the bit broke the match, and the arc lands on whatever part of the pattern is
 *   still usable. Its depth grows with how far back it goes, so the arcs nest instead of piling up.
 *
 * The arcs below are the answer to the question students get wrong, because an arc that lands
 * anywhere other than the start is visibly shorter than one that goes all the way back.
 *
 * Underneath, the input sits on a tape with the newest bit on the right, and every position where
 * the machine output a 1 is marked, so overlapping and non-overlapping detection differ on the tape
 * where a student can count them.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha, tint } from '../kit/figure/index.js';
import type { Detector } from './detector.js';

const W = 680;
const H = 400;

const ROW_Y = 134;
const R = 30;
const TAPE = { y: 330, cell: 30, max: 18 };

const LIVE = 'var(--stage-live)';

export interface DetectorSceneProps {
  machine: Detector;
  /** Bits fed so far, oldest first. */
  input: string;
  /** State before any input, then after each bit (from `runDetector`). */
  path: number[];
  detections: number[];
  label: string;
}

/** A filled arrowhead at (x, y), pointing along (dx, dy). */
function head(x: number, y: number, dx: number, dy: number, fill: string): ReactNode {
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const size = 8;
  const bx = x - ux * size;
  const by = y - uy * size;
  const px = -uy * (size * 0.55);
  const py = ux * (size * 0.55);
  return <path d={`M${x},${y} L${bx + px},${by + py} L${bx - px},${by - py} Z`} fill={fill} />;
}

export function DetectorScene({ machine, input, path, detections, label }: DetectorSceneProps): ReactNode {
  const count = machine.states.length;
  const spacing = Math.min(140, 520 / Math.max(1, count - 1));
  const x0 = W / 2 - (spacing * (count - 1)) / 2;
  const cx = (state: number): number => x0 + state * spacing;

  const current = path[path.length - 1] ?? 0;
  const previous = path.length > 1 ? path[path.length - 2]! : undefined;
  const lastBit = input.length ? Number(input[input.length - 1]) : undefined;
  const isTaken = (from: number, bit: number): boolean => previous === from && lastBit === bit;
  const mealy = machine.kind === 'mealy';
  const edgeWidth = (taken: boolean): number => (taken ? STROKE.bold : STROKE.line);

  const edges: ReactNode[] = [];
  machine.next.forEach(([zero, one], from) => {
    [zero, one].forEach((to, bit) => {
      const taken = isTaken(from, bit);
      const fires = mealy && machine.outputs[from]![bit]!;
      // In a Mealy machine the output lives on the arrow, so the arrow that just fired is the one
      // that lights up green; a Moore machine lights its output state instead.
      const ink = taken ? (fires ? LIVE : HUE[1]) : fires ? alpha(LIVE, 70) : alpha(HUE.soft, 70);
      const bitLabel = mealy ? `${bit}/${fires ? 1 : 0}` : `${bit}`;
      const key = `${from}-${bit}`;

      if (to === from + 1) {
        // Forward: the bit matched.
        const xa = cx(from) + R;
        const xb = cx(to) - R;
        edges.push(
          <g key={key}>
            <line x1={xa} y1={ROW_Y} x2={xb - 2} y2={ROW_Y} stroke={ink} strokeWidth={edgeWidth(taken)} />
            {head(xb, ROW_Y, 1, 0, ink)}
            <FigText x={(xa + xb) / 2} y={ROW_Y - 8} size="label" anchor="middle" tone="ink">
              {bitLabel}
            </FigText>
          </g>,
        );
      } else if (to === from) {
        // Self-loop: nothing about the match changed.
        const x = cx(from);
        const top = ROW_Y - R;
        const d = `M${x - 12},${top + 3} C${x - 30},${top - 44} ${x + 30},${top - 44} ${x + 12},${top + 3}`;
        edges.push(
          <g key={key}>
            <path d={d} fill="none" stroke={ink} strokeWidth={edgeWidth(taken)} />
            {head(x + 12, top + 3, -18, 44, ink)}
            <FigText x={x} y={top - 38} size="label" anchor="middle" tone="ink">
              {bitLabel}
            </FigText>
          </g>,
        );
      } else {
        // Back: the match broke. Offset by bit so two arcs leaving one state never coincide.
        const shift = bit === 0 ? -9 : 9;
        const xa = cx(from) + shift;
        const xb = cx(to) + shift;
        const ya = ROW_Y + R - 2;
        // Deeper by 28 per state skipped, so nested arcs sit 21 units apart at their lowest points.
        const depth = 26 + 28 * (from - to);
        const d = `M${xa},${ya} C${xa},${ya + depth} ${xb},${ya + depth} ${xb},${ya + 2}`;
        edges.push(
          <g key={key}>
            <path d={d} fill="none" stroke={ink} strokeWidth={edgeWidth(taken)} />
            {head(xb, ya + 2, 0, -1, ink)}
            {/* Just INSIDE the arc's lowest point. Below it, the label landed on the next arc down;
                inside, the only thing nearby is the arc it names. */}
            <FigText x={(xa + xb) / 2} y={ya + depth * 0.75 - 6} size="label" anchor="middle" tone="ink">
              {bitLabel}
            </FigText>
          </g>,
        );
      }
    });
  });

  const tape = input.slice(-TAPE.max);
  const tapeOffset = input.length - tape.length;
  const tapeX = W / 2 - (tape.length * TAPE.cell) / 2;

  return (
    <Figure viewBox={[W, H]} domain="math" label={label}>
      {/* The way in: every run starts in the leftmost state. */}
      <line
        x1={cx(0) - R - 34}
        y1={ROW_Y}
        x2={cx(0) - R - 2}
        y2={ROW_Y}
        stroke={HUE.ink}
        strokeWidth={STROKE.line}
      />
      {head(cx(0) - R, ROW_Y, 1, 0, HUE.ink)}

      {edges}

      {machine.states.map((state) => {
        const x = cx(state.id);
        const here = state.id === current;
        const found = here && state.output;
        const fill = found ? tint(LIVE, 55) : here ? tint(HUE[1], 70) : HUE.paper;
        const stroke = found ? LIVE : here ? HUE[1] : alpha(HUE.ink, 60);
        return (
          <g key={state.id}>
            <circle
              cx={x}
              cy={ROW_Y}
              r={R}
              fill={fill}
              stroke={stroke}
              strokeWidth={here ? STROKE.edge : STROKE.line}
            />
            {/* Moore machine: the output lives in the state, so the output state gets the double ring. */}
            {state.output && (
              <circle cx={x} cy={ROW_Y} r={R - 5} fill="none" stroke={stroke} strokeWidth={STROKE.hair} />
            )}
            <FigText x={x} y={ROW_Y + 2} size="label" anchor="middle" tone="ink" halo={false}>
              {state.matched || 'start'}
            </FigText>
            <FigText x={x} y={ROW_Y + 16} size="note" anchor="middle" tone="soft" halo={false}>
              S{state.id}
            </FigText>
          </g>
        );
      })}

      {/* ── the input tape ─────────────────────────────────────────────────── */}
      <FigText x={tapeX} y={TAPE.y - 12} size="note" tone="soft">
        {tape.length ? 'input, newest on the right' : 'feed some bits to start'}
      </FigText>
      {tape.split('').map((bit, index) => {
        const position = tapeOffset + index;
        const hit = detections.includes(position);
        const newest = position === input.length - 1;
        const x = tapeX + index * TAPE.cell;
        return (
          <g key={position}>
            <rect
              x={x}
              y={TAPE.y}
              width={TAPE.cell - 3}
              height={TAPE.cell}
              rx={4}
              fill={hit ? tint(LIVE, 60) : newest ? tint(HUE[1], 75) : alpha(HUE.soft, 8)}
              stroke={hit ? LIVE : newest ? HUE[1] : alpha(HUE.soft, 40)}
              strokeWidth={hit || newest ? STROKE.line : STROKE.hair}
            />
            <FigText
              x={x + (TAPE.cell - 3) / 2}
              y={TAPE.y + 20}
              size="label"
              anchor="middle"
              tone="ink"
              halo={false}
            >
              {bit}
            </FigText>
          </g>
        );
      })}
      {detections.length > 0 && (
        <FigText x={W / 2} y={TAPE.y + TAPE.cell + 22} size="note" anchor="middle" tone="ink">
          found {detections.length} time{detections.length === 1 ? '' : 's'}: green cells are where the
          pattern ended
        </FigText>
      )}
    </Figure>
  );
}
