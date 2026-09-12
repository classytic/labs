'use client';

/**
 * CenterSpreadLab, centre & spread you can FEEL. Data points sit on a number
 * line; drag them and the mean rides under the line as a BALANCE-POINT fulcrum
 * (the mean is literally where the data balances), the median holds its ground,
 * the mode stack lights up, and a shaded mean ± σ band breathes wider as the data
 * spreads. The punchline lives in the dragging: yank one point far out and the
 * mean chases it while the median barely moves, why we report the median for
 * skewed data. Optional `challenge` turns it into "drag until the mean is 5".
 *
 * All numbers come from the descriptive-stats kernel; the lab only POINTS at them.
 */

import { useCallback, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { mean, median, mode, range, variance, stddev, frequencies } from '../core/descriptive.js';
import { Tex } from '../../core/tex.js';
import { ActionButton } from '../../kit/controls.js';
import { Activity } from '../../kit/activity.js';
import {
  useHints,
  HintLadder,
  useChallenge,
  ChallengeCard,
  useCheckpoint,
  type ChallengeQuestion,
} from '../../kit/pedagogy.js';
import { useControlSurface } from '@classytic/stage';
import { clearTicks } from '../../kit/ticks.js';

const CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'resist',
    prompt: 'Drag one point far away from the rest (an outlier). It pulls the ___ much more.',
    choices: [
      { value: 'mean', label: 'mean' },
      { value: 'median', label: 'median' },
    ],
    answer: 'mean',
    explain:
      'The mean is a balance point, so one far value tips it; the median is just the middle value, so it barely moves. That’s why skewed data is reported with the median.',
  },
];

export interface CenterSpreadProps {
  data?: number[];
  min?: number;
  max?: number;
  step?: number;
  showSigma?: boolean;
  challenge?: { stat: 'mean' | 'median'; target: number };
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const W = 500,
  H = 210,
  M = 34,
  AXIS = 150;

export function CenterSpreadLab({
  data = [2, 3, 3, 5, 8],
  min = 0,
  max = 10,
  step = 1,
  showSigma = true,
  challenge,
  title = 'Centre & spread',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: CenterSpreadProps): ReactNode {
  const [vals, setVals] = useState<number[]>(data);
  const hints = useHints(hintList);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<number | null>(null);

  const lo = min,
    hi = max;
  const xOf = (v: number): number => M + ((v - lo) / (hi - lo)) * (W - 2 * M);
  const vOf = (px: number): number => {
    const v = lo + ((px - M) / (W - 2 * M)) * (hi - lo);
    return Math.max(lo, Math.min(hi, Math.round(v / step) * step));
  };

  const mu = mean(vals),
    md = median(vals),
    mo = mode(vals),
    rg = range(vals),
    sd = stddev(vals);
  const freqs = frequencies(vals);
  const maxCount = Math.max(1, ...freqs.map((f) => f.count));

  // assign each value a stack height (duplicates pile up → shows frequency + mode)
  const stacked = useMemo(() => {
    const seen = new Map<number, number>();
    return vals.map((v, i) => {
      const k = seen.get(v) ?? 0;
      seen.set(v, k + 1);
      return { v, i, level: k };
    });
  }, [vals]);

  const pointerVal = (e: React.PointerEvent): number => {
    const r = svgRef.current!.getBoundingClientRect();
    return vOf(((e.clientX - r.left) / r.width) * W);
  };
  const onDown =
    (i: number) =>
    (e: React.PointerEvent): void => {
      drag.current = i;
      (e.target as Element).setPointerCapture(e.pointerId);
    };
  const onMove = (e: React.PointerEvent): void => {
    if (drag.current == null) return;
    const nv = pointerVal(e);
    setVals((arr) => arr.map((x, k) => (k === drag.current ? nv : x)));
  };
  const onUp = (): void => {
    drag.current = null;
  };
  const nudgePoint = (index: number, direction: -1 | 1): void => {
    setVals((current) =>
      current.map((value, pointIndex) =>
        pointIndex === index
          ? Math.max(lo, Math.min(hi, Math.round((value + direction * step) / step) * step))
          : value,
      ),
    );
  };

  const reset = useCallback(() => setVals(data), [data]);
  const addPoint = useCallback(
    () => setVals((a) => [...a, Math.round((lo + hi) / 2 / step) * step]),
    [lo, hi, step],
  );
  const removePoint = useCallback(() => setVals((a) => (a.length > 1 ? a.slice(0, -1) : a)), []);
  const addOutlier = useCallback(() => setVals((a) => [...a, hi]), [hi]);

  const ch = useChallenge(CHALLENGE);
  const solved = challenge
    ? Math.abs((challenge.stat === 'mean' ? mu : md) - challenge.target) < 1e-6
    : ch.allCorrect;
  useCheckpoint({
    solved,
    activity: `center-spread:${title}`,
    hintsUsed: hints.count,
  });

  useControlSurface(controlId, {
    add: { type: 'action', label: 'add a point', invoke: addPoint },
    remove: { type: 'action', label: 'remove a point', invoke: removePoint },
    outlier: { type: 'action', label: 'add an outlier', invoke: addOutlier },
    reset: { type: 'action', label: 'reset data', invoke: reset },
  });

  const sigmaL = Math.max(lo, mu - sd),
    sigmaR = Math.min(hi, mu + sd);
  const ticks = Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step).filter(
    (_, i, a) => a.length <= 12 || i % Math.ceil(a.length / 12) === 0,
  );
  // The mean fulcrum hangs below the line, over the tick numbers, so the number under it steps aside.
  const printed = new Set(
    clearTicks(
      ticks.map((t) => ({ at: xOf(t), text: String(t), value: t })),
      [{ at: xOf(mu), half: 11 }],
    ).map((t) => t.value),
  );

  const stat = (label: ReactNode, value: string, color = 'var(--stage-fg)'): ReactNode => (
    <span className="statistics-stat">
      <span className="statistics-stat-label">{label}</span>
      <span className="statistics-stat-value" style={{ '--statistics-color': color } as CSSProperties}>
        {value}
      </span>
    </span>
  );

  const figure = (
    <>
      {challenge && (
        <p className="statistics-challenge" data-solved={solved || undefined}>
          {solved ? '✓ ' : '🎯 '}Drag the points until the <b>{challenge.stat}</b> = {challenge.target}.
        </p>
      )}

      <div className="discrete-stage-scene statistics-interactive-scene">
        <svg
          className="statistics-chart statistics-chart-centered"
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          role="group"
          aria-label={`Interactive number line; mean ${mu.toFixed(2)}, median ${md}`}
        >
          {/* mean ± σ band */}
          {showSigma && sd > 0 && (
            <rect
              x={xOf(sigmaL)}
              y={AXIS - 96}
              width={xOf(sigmaR) - xOf(sigmaL)}
              height={96}
              fill="color-mix(in oklab, var(--stage-accent) 12%, transparent)"
            />
          )}
          {/* axis */}
          <line x1={M} y1={AXIS} x2={W - M} y2={AXIS} stroke="var(--stage-fg)" strokeWidth={2} />
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={xOf(t)}
                y1={AXIS}
                x2={xOf(t)}
                y2={AXIS + 5}
                stroke="var(--stage-muted)"
                strokeWidth={1.5}
              />
              {printed.has(t) && (
                <text
                  className="lab-tabular"
                  x={xOf(t)}
                  y={AXIS + 18}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--stage-muted)"
                >
                  {t}
                </text>
              )}
            </g>
          ))}
          {/* median marker */}
          <line
            x1={xOf(md)}
            y1={AXIS - 104}
            x2={xOf(md)}
            y2={AXIS}
            stroke="var(--stage-accent-2, #d6336c)"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
          <text
            x={xOf(md)}
            y={AXIS - 110}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill="var(--stage-accent-2, #d6336c)"
          >
            median {md}
          </text>
          {/* data points (draggable, stacked) */}
          {stacked.map(({ v, i, level }) => {
            const cy = AXIS - 14 - level * 19;
            const isMode = mo.includes(v) && mo.length > 0;
            return (
              <circle
                key={i}
                cx={xOf(v)}
                cy={cy}
                r={9}
                fill={isMode ? 'var(--stage-warn)' : 'var(--stage-accent)'}
                stroke="var(--stage-bg)"
                strokeWidth={2}
                className="statistics-data-point"
                data-dragging={drag.current === i || undefined}
                onPointerDown={onDown(i)}
                role="slider"
                tabIndex={0}
                aria-label={`Data point ${i + 1}`}
                aria-valuemin={lo}
                aria-valuemax={hi}
                aria-valuenow={v}
                aria-valuetext={`${v}; point ${i + 1} of ${vals.length}`}
                onKeyDown={(event) => {
                  if (
                    event.key !== 'ArrowLeft' &&
                    event.key !== 'ArrowRight' &&
                    event.key !== 'ArrowDown' &&
                    event.key !== 'ArrowUp'
                  )
                    return;
                  event.preventDefault();
                  nudgePoint(i, event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 1);
                }}
              />
            );
          })}
          {/* mean fulcrum (balance point) */}
          <g
            className="statistics-mean-marker"
            data-dragging={drag.current != null || undefined}
            style={
              {
                '--statistics-translate': `${xOf(mu) - W / 2}px`,
              } as CSSProperties
            }
          >
            <path d={`M${W / 2},${AXIS + 1} l-9,16 h18 Z`} fill="var(--stage-good)" />
            <text
              x={W / 2}
              y={AXIS + 30}
              textAnchor="middle"
              fontSize={11}
              fontWeight={800}
              fill="var(--stage-good)"
            >
              mean {mu.toFixed(2)}
            </text>
          </g>
        </svg>
      </div>

      <div className="statistics-stat-strip">
        {stat('mean', mu.toFixed(2), 'var(--stage-good)')}
        {stat('median', String(md), 'var(--stage-accent-2, #d6336c)')}
        {stat('mode', mo.length ? mo.join(', ') : '-', 'var(--stage-warn)')}
        {stat('range', String(rg))}
        {stat('variance', variance(vals).toFixed(2))}
        {stat(<Tex tex={'\\sigma'} />, sd.toFixed(2), 'var(--stage-accent)')}
        {stat('n', String(vals.length))}
      </div>
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      <ActionButton onClick={addPoint}>+ point</ActionButton>
      <ActionButton onClick={removePoint} disabled={vals.length <= 1}>
        − point
      </ActionButton>
      <ActionButton onClick={addOutlier}>add outlier</ActionButton>
      <ActionButton onClick={reset}>reset</ActionButton>
      <span className="statistics-interaction-hint">drag or use arrow keys</span>
    </div>
  );

  const footer = (
    <>
      <ChallengeCard questions={CHALLENGE} state={ch} title="Predict first" />
      <HintLadder hints={hints} />
    </>
  );

  return (
    <Activity.Root className="statistics-center-spread-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Descriptive statistics"
          title={title}
          description={
            prompt ?? 'Move the data and watch centre, spread, and resistance update from one shared dataset.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>mean {mu.toFixed(2)}</strong>
        <span>median {md}</span>
        <span>σ {sd.toFixed(2)}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Interactive centre-and-spread model">{figure}</Activity.Canvas>
        <Activity.Inspector label="Dataset actions">{controls}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          The mean behaves like a balance point, while the median follows position; moving an extreme point
          reveals which summary resists outliers.
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Centre-and-spread prediction and support">
        {footer}
      </section>
      <Activity.LiveRegion>
        Mean {mu.toFixed(2)}, median {md}, range {rg}, standard deviation {sd.toFixed(2)}.
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{vals.length} data points</strong>
          <span>
            range {rg} · σ {sd.toFixed(2)}
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
