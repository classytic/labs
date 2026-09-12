'use client';

/**
 * Probability glyph kit, proper dice + coins for chance/statistics labs (the
 * Brilliant-grade replacement for the ⚀⚁⚂ emoji). Pixel space, token-coloured,
 * pure SVG. A DiceGlyph draws the standard pip layout for value 1–6; a CoinGlyph
 * draws a ridged heads/tails coin. Both take a `live`/`highlight` accent so a lab
 * can flash the rolled face. Reusable by SampleSpace, MonteCarlo, sequences, etc.
 */

import type { CSSProperties, ReactNode } from 'react';

export interface ProbabilityBoardOutcome {
  label: string;
  probability: number;
  value: number;
  color?: string;
}

/**
 * Renderer-independent board for expected-value activities. It deliberately uses
 * length (not bubble area) for probability and contribution so learners compare
 * quantities on a common scale.
 */
export function ProbabilityContributionBoard({
  outcomes,
  expectation,
  cost,
  average,
}: {
  outcomes: ProbabilityBoardOutcome[];
  expectation: number;
  cost?: number;
  average?: number | null;
}): ReactNode {
  const totalProbability = outcomes.reduce((sum, outcome) => sum + outcome.probability, 0) || 1;
  const normalized = outcomes.map((outcome) => ({
    ...outcome,
    probability: outcome.probability / totalProbability,
  }));
  const scaleMax = Math.max(1, cost ?? 0, expectation, average ?? 0) * 1.12;
  const percent = (value: number): string => `${Math.max(0, Math.min(100, (value / scaleMax) * 100))}%`;

  return (
    <div
      className="probability-contribution-board"
      role="img"
      aria-label={`Expected payout ${expectation.toFixed(2)}`}
    >
      <div className="probability-board-heading">
        <span>Every 100 plays</span>
        <span>Probability × payout</span>
      </div>
      <div className="probability-outcome-strip" aria-hidden="true">
        {normalized.map((outcome, index) => (
          <div
            key={`${outcome.label}-${index}`}
            className="probability-outcome-segment"
            style={
              {
                '--probability-width': `${outcome.probability * 100}%`,
                '--probability-color': outcome.color ?? `var(--stage-cat-${(index % 6) + 1})`,
              } as CSSProperties
            }
          >
            <strong>{Math.round(outcome.probability * 100)}%</strong>
            <span>{outcome.label}</span>
          </div>
        ))}
      </div>
      <div className="probability-contribution-list">
        {normalized.map((outcome, index) => {
          const contribution = outcome.probability * outcome.value;
          return (
            <div className="probability-contribution-row" key={`${outcome.label}-contribution-${index}`}>
              <span className="probability-contribution-label">{outcome.label}</span>
              <span className="probability-contribution-track" aria-hidden="true">
                <span
                  className="probability-contribution-fill"
                  style={
                    {
                      '--contribution-width': percent(contribution),
                      '--probability-color': outcome.color ?? `var(--stage-cat-${(index % 6) + 1})`,
                    } as CSSProperties
                  }
                />
              </span>
              <span className="probability-contribution-math">
                {Math.round(outcome.probability * 100)}% × {outcome.value} ={' '}
                <strong>{contribution.toFixed(2)}</strong>
              </span>
            </div>
          );
        })}
      </div>
      <div className="probability-benchmark">
        <div className="probability-benchmark-track" aria-hidden="true">
          <span
            className="probability-expectation-fill"
            style={{ '--benchmark-width': percent(expectation) } as CSSProperties}
          />
          {cost != null && (
            <span
              className="probability-cost-marker"
              style={{ '--marker-position': percent(cost) } as CSSProperties}
            />
          )}
          {average != null && (
            <span
              className="probability-average-marker"
              style={{ '--marker-position': percent(average) } as CSSProperties}
            />
          )}
        </div>
        <div className="probability-benchmark-legend">
          <span>
            <i data-kind="expectation" /> expected {expectation.toFixed(2)}
          </span>
          {cost != null && (
            <span>
              <i data-kind="cost" /> price {cost.toFixed(2)}
            </span>
          )}
          {average != null && (
            <span>
              <i data-kind="average" /> sample average {average.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const FG = 'var(--stage-fg)';
// percentages must sum to 100%, a smaller sum leaks transparency into the fill
const FACE = 'color-mix(in oklab, var(--stage-bg) 92%, var(--stage-fg))';
const METAL = 'var(--stage-metal)';
const GOLD = 'var(--stage-warn)';
const GOOD = 'var(--stage-good)';
const SHEEN = 'color-mix(in oklab, var(--stage-sheen, white) 60%, transparent)';

// pip cells (col,row) in a 3×3 grid, per face value
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [2, 0],
    [0, 2],
    [2, 2],
  ],
  5: [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ],
  6: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
  ],
};

/** A six-sided die showing `value` (1–6) in box (x,y) of side `size`. */
export function DiceGlyph({
  x,
  y,
  size: s,
  value,
  highlight = false,
}: {
  x: number;
  y: number;
  size: number;
  value: number;
  highlight?: boolean;
}): ReactNode {
  const r = s * 0.2;
  const pipR = s * 0.082;
  const pos = PIPS[Math.max(1, Math.min(6, Math.round(value)))] ?? PIPS[1]!;
  return (
    <g>
      {highlight && (
        <rect
          x={x - 3}
          y={y - 3}
          width={s + 6}
          height={s + 6}
          rx={r + 3}
          fill="none"
          stroke={GOOD}
          strokeWidth={3}
        />
      )}
      <rect
        x={x}
        y={y}
        width={s}
        height={s}
        rx={r}
        fill={FACE}
        stroke={METAL}
        strokeWidth={Math.max(1, s * 0.025)}
      />
      {/* top-left sheen */}
      <path
        d={`M${x + r},${y + s * 0.06} H${x + s * 0.62}`}
        stroke={SHEEN}
        strokeWidth={s * 0.04}
        strokeLinecap="round"
        opacity={0.5}
      />
      {pos.map(([c, rr], i) => (
        <circle key={i} cx={x + s * (0.25 + 0.25 * c)} cy={y + s * (0.25 + 0.25 * rr)} r={pipR} fill={FG} />
      ))}
    </g>
  );
}

/** A coin in box centred (cx,cy) radius `r`, showing 'H' or 'T'. */
export function CoinGlyph({
  cx,
  cy,
  r,
  face = 'H',
  highlight = false,
}: {
  cx: number;
  cy: number;
  r: number;
  face?: 'H' | 'T' | string;
  highlight?: boolean;
}): ReactNode {
  const heads = face === 'H' || face === 'h';
  const base = heads ? GOLD : METAL;
  return (
    <g>
      {highlight && <circle cx={cx} cy={cy} r={r * 1.22} fill="none" stroke={GOOD} strokeWidth={2.5} />}
      {/* edge / thickness */}
      <circle cx={cx} cy={cy + r * 0.12} r={r} fill={`color-mix(in oklab, ${base} 55%, black)`} />
      {/* face */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={base}
        stroke={`color-mix(in oklab, ${base} 60%, black)`}
        strokeWidth={Math.max(1, r * 0.08)}
      />
      {/* inner ridge ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.82}
        fill="none"
        stroke={`color-mix(in oklab, ${base} 70%, black)`}
        strokeWidth={Math.max(1, r * 0.05)}
        opacity={0.6}
      />
      {/* sheen */}
      <path
        d={`M${cx - r * 0.5},${cy - r * 0.45} A${r * 0.7},${r * 0.7} 0 0 1 ${cx + r * 0.3},${cy - r * 0.62}`}
        fill="none"
        stroke={SHEEN}
        strokeWidth={r * 0.14}
        strokeLinecap="round"
        opacity={0.7}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={r * 1.05}
        fontWeight={800}
        fill={`color-mix(in oklab, ${base} 30%, black)`}
      >
        {heads ? 'H' : 'T'}
      </text>
    </g>
  );
}
