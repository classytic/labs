'use client';

/**
 * The sixteen patterns on a wheel, and the adder's working beside it.
 *
 * The wheel IS the explanation. Patterns run clockwise from 0000 at the top, so adding b is walking
 * b steps round, and wrapping past 1111 back to 0000 is what a 4-bit adder does anyway when it
 * drops the fifth bit. The two halves are coloured by what the pattern MEANS: 0000 to 0111 are 0 to
 * 7, 1000 to 1111 are −8 to −1. Two lines are drawn across the wheel: at the top, where the patterns
 * wrap (harmless for signed numbers: −1 + 1 = 0), and at the bottom, between 7 and −8, where
 * walking across means the signed answer no longer fits. Crossing that line is overflow, and the
 * arc turns red when it does.
 *
 * Negation is a mirror across the vertical axis through 0 and −8. Every value has a partner on the
 * other side except those two, which sit on the axis itself. That is the asymmetric range, visible.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha, tint } from '../kit/figure/index.js';
import { bitsOf, toSigned, type Pattern } from './twos.js';

const W = 680;
const H = 360;
const CX = 188;
const CY = 180;
const R_NODE = 132;
const R_ARC = 92;

const POS = HUE[1];
const NEG = HUE[2];
const LIVE = 'var(--stage-live)';

const angle = (pattern: Pattern): number => -Math.PI / 2 + (pattern * Math.PI * 2) / 16;
const at = (pattern: Pattern, r: number): [number, number] => [
  CX + r * Math.cos(angle(pattern)),
  CY + r * Math.sin(angle(pattern)),
];
/** A real minus sign: a hyphen reads as a dash, and this is a number. */
const fmt = (value: number): string => (value < 0 ? `−${-value}` : `${value}`);
/** A radial line BETWEEN two neighbouring patterns, half a step round from each. */
const boundary = (
  after: number,
  r1: number,
  r2: number,
): { x1: number; y1: number; x2: number; y2: number } => {
  const t = -Math.PI / 2 + ((after + 0.5) * Math.PI * 2) / 16;
  return {
    x1: CX + r1 * Math.cos(t),
    y1: CY + r1 * Math.sin(t),
    x2: CX + r2 * Math.cos(t),
    y2: CY + r2 * Math.sin(t),
  };
};

export type TwosOperation = 'add' | 'subtract' | 'negate';

export interface TwosSceneProps {
  operation: TwosOperation;
  a: Pattern;
  /** The addend actually fed to the adder (b, or the negation of b when subtracting). */
  addend: Pattern;
  b: Pattern;
  result: Pattern;
  overflow: boolean;
  carryOut: boolean;
  inverted?: Pattern;
  /** Hidden until the learner has predicted. */
  revealed: boolean;
  label: string;
}

export function TwosScene({
  operation,
  a,
  addend,
  b,
  result,
  overflow,
  carryOut,
  inverted,
  revealed,
  label,
}: TwosSceneProps): ReactNode {
  /**
   * The walk goes the way the SIGNED addend says: forward for a positive number, backward for a
   * negative one. The adder cannot tell 11 steps forward from 5 back (same landing place), but only
   * the signed walk makes the rule on the wheel true: it crosses the red line exactly when the
   * answer overflows. Walking 11 forward for 2 − 5 crossed the line on a sum that fits.
   */
  const signed = operation === 'negate' ? 0 : toSigned(addend);
  const steps = Math.abs(signed);
  const direction = signed < 0 ? -1 : 1;
  const walk: string[] = [];
  for (let s = 0; s <= steps * 4; s++) {
    const turn = angle(a) + direction * (s / 4) * (Math.PI / 8);
    const [x, y] = [CX + R_ARC * Math.cos(turn), CY + R_ARC * Math.sin(turn)];
    walk.push(`${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const arcInk = overflow ? HUE.hot : LIVE;
  // Only subtraction has a middle row (b, before it is negated). Without it the working moves up a
  // row rather than leaving an empty line between a and the sum.
  const lift = operation === 'subtract' ? 0 : 32;

  // The column working, one FigText per bit so the columns line up.
  const COL = 26;
  const WX = 470;
  const bitRow = (
    pattern: Pattern,
    y: number,
    key: string,
    tone: 'ink' | 'soft' | 'hot' = 'ink',
  ): ReactNode =>
    bitsOf(pattern)
      .split('')
      .map((bit, i) => (
        <FigText key={`${key}-${i}`} x={WX + i * COL} y={y} size="label" anchor="middle" tone={tone}>
          {bit}
        </FigText>
      ));
  const note = (text: string, y: number, key: string, tone: 'ink' | 'soft' | 'hot' = 'soft'): ReactNode => (
    <FigText key={key} x={WX + 4 * COL + 8} y={y} size="note" tone={tone}>
      {text}
    </FigText>
  );

  return (
    <Figure viewBox={[W, H]} domain="math" label={label}>
      {/* ── the two lines that matter ─────────────────────────────────────── */}
      <line
        {...boundary(15, R_ARC - 14, R_NODE + 26)}
        stroke={alpha(HUE.soft, 60)}
        strokeWidth={STROKE.hair}
        strokeDasharray="3 3"
      />
      <FigText
        x={boundary(15, 0, R_NODE + 30).x2 - 6}
        y={CY - R_NODE - 24}
        size="note"
        anchor="end"
        tone="soft"
      >
        wraps here
      </FigText>
      <line {...boundary(7, R_ARC - 14, R_NODE + 26)} stroke={HUE.hot} strokeWidth={STROKE.line} />
      <FigText x={boundary(7, 0, R_NODE + 30).x2 + 6} y={CY + R_NODE + 34} size="note" tone="hot">
        overflow line
      </FigText>

      {/* negation is a mirror across the vertical axis */}
      {operation === 'negate' && (
        <line
          x1={CX}
          y1={CY - R_NODE}
          x2={CX}
          y2={CY + R_NODE}
          stroke={alpha(HUE.ink, 45)}
          strokeWidth={STROKE.line}
          strokeDasharray="6 4"
        />
      )}

      {/* ── the walk ──────────────────────────────────────────────────────── */}
      {revealed && operation !== 'negate' && steps > 0 && (
        <g>
          <path
            d={walk.join(' ')}
            fill="none"
            stroke={arcInk}
            strokeWidth={STROKE.bold}
            strokeLinecap="round"
          />
          {(() => {
            // Arrowhead on the walk's last point, pointing along the circle in the walk's direction.
            const end = angle(a) + direction * steps * (Math.PI / 8);
            const [ex, ey] = [CX + R_ARC * Math.cos(end), CY + R_ARC * Math.sin(end)];
            const [tx, ty] = [-Math.sin(end) * direction, Math.cos(end) * direction];
            const [nx, ny] = [-ty, tx];
            return (
              <path
                d={`M${ex + tx * 9},${ey + ty * 9} L${ex + nx * 6},${ey + ny * 6} L${ex - nx * 6},${ey - ny * 6} Z`}
                fill={arcInk}
              />
            );
          })()}
          <FigText x={CX} y={CY + 5} size="label" anchor="middle" tone="ink">
            {steps} step{steps === 1 ? '' : 's'} {direction > 0 ? 'clockwise' : 'anticlockwise'}
          </FigText>
        </g>
      )}
      {revealed && operation === 'negate' && (
        <line
          x1={at(a, R_NODE - 18)[0]}
          y1={at(a, R_NODE - 18)[1]}
          x2={at(result, R_NODE - 18)[0]}
          y2={at(result, R_NODE - 18)[1]}
          stroke={overflow ? HUE.hot : LIVE}
          strokeWidth={STROKE.edge}
        />
      )}

      {/* ── the sixteen patterns ──────────────────────────────────────────── */}
      {Array.from({ length: 16 }, (_, p) => {
        const [x, y] = at(p, R_NODE);
        const ink = p >= 8 ? NEG : POS;
        const isA = p === a;
        const isResult = revealed && p === result;
        return (
          <g key={p}>
            <circle
              cx={x}
              cy={y}
              r={19}
              fill={isResult ? tint(overflow ? HUE.hot : LIVE, 45) : tint(ink, isA ? 45 : 18)}
              stroke={isResult ? (overflow ? HUE.hot : LIVE) : isA ? ink : alpha(ink, 45)}
              strokeWidth={isA || isResult ? STROKE.edge : STROKE.hair}
            />
            <FigText x={x} y={y + 1} size="label" anchor="middle" tone="ink" halo={false}>
              {fmt(toSigned(p))}
            </FigText>
            <FigText x={x} y={y + 13} size="note" anchor="middle" tone="soft" halo={false}>
              {bitsOf(p)}
            </FigText>
          </g>
        );
      })}

      {/* ── the adder's working ───────────────────────────────────────────── */}
      <FigText x={WX - 34} y={64} size="note" tone="soft">
        {operation === 'negate'
          ? 'negate a'
          : operation === 'subtract'
            ? 'a − b on the adder'
            : 'a + b on the adder'}
      </FigText>
      <FigText x={WX - 34} y={98} size="label" tone="ink">
        a
      </FigText>
      {bitRow(a, 98, 'a')}
      {note(fmt(toSigned(a)), 98, 'na', 'ink')}

      {operation === 'subtract' && (
        <>
          <FigText x={WX - 34} y={130} size="note" tone="soft">
            b
          </FigText>
          {bitRow(b, 130, 'b', 'soft')}
          {note(`invert, add 1`, 130, 'nb')}
        </>
      )}
      {operation === 'negate' && inverted !== undefined && (
        <>
          <FigText x={WX - 34} y={130} size="note" tone="soft">
            invert
          </FigText>
          {bitRow(inverted, 130, 'inv', 'soft')}
          {note('then add 1', 130, 'ninv')}
        </>
      )}
      {operation !== 'negate' && (
        <>
          <FigText x={WX - 34} y={162 - lift} size="label" tone="ink">
            +
          </FigText>
          {bitRow(addend, 162 - lift, 'add')}
          {note(fmt(toSigned(addend)), 162 - lift, 'nadd', 'ink')}
        </>
      )}
      <line
        x1={WX - 34}
        y1={178 - lift}
        x2={WX + 4 * COL + 40}
        y2={178 - lift}
        stroke={HUE.ink}
        strokeWidth={STROKE.line}
      />
      {revealed ? (
        <>
          {bitRow(result, 204 - lift, 'res', overflow ? 'hot' : 'ink')}
          {note(fmt(toSigned(result)), 204 - lift, 'nres', overflow ? 'hot' : 'ink')}
          {operation !== 'negate' && (
            <FigText x={WX - 34} y={240 - lift} size="note" tone={carryOut ? 'ink' : 'soft'}>
              carry out {carryOut ? '1, dropped' : '0'}
            </FigText>
          )}
          <FigText x={WX - 34} y={266 - lift} size="note" tone={overflow ? 'hot' : 'soft'}>
            {overflow ? 'overflow: the true answer does not fit in 4 bits' : 'fits in 4 bits'}
          </FigText>
        </>
      ) : (
        <FigText x={WX + 1.5 * COL} y={204 - lift} size="label" anchor="middle" tone="soft">
          predict first
        </FigText>
      )}
    </Figure>
  );
}
