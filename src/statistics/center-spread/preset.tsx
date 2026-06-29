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

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { mean, median, mode, range, variance, stddev, frequencies } from '../core/descriptive.js';
import { Tex } from '../../core/tex.js';
import { Chip } from '../../kit/controls.js';
import { useHints, HintLadder, useCheckpoint } from '../../kit/pedagogy.js';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { useControlSurface } from '@classytic/stage';

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

const W = 500, H = 210, M = 34, AXIS = 150;

export function CenterSpreadLab({
  data = [2, 3, 3, 5, 8], min = 0, max = 10, step = 1, showSigma = true, challenge,
  title = 'Centre & spread', prompt, objectives, hints: hintList, controlId,
}: CenterSpreadProps): ReactNode {
  const [vals, setVals] = useState<number[]>(data);
  const hints = useHints(hintList);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<number | null>(null);

  const lo = min, hi = max;
  const xOf = (v: number): number => M + ((v - lo) / (hi - lo)) * (W - 2 * M);
  const vOf = (px: number): number => {
    const v = lo + ((px - M) / (W - 2 * M)) * (hi - lo);
    return Math.max(lo, Math.min(hi, Math.round(v / step) * step));
  };

  const mu = mean(vals), md = median(vals), mo = mode(vals), rg = range(vals), sd = stddev(vals);
  const freqs = frequencies(vals);
  const maxCount = Math.max(1, ...freqs.map((f) => f.count));

  // assign each value a stack height (duplicates pile up → shows frequency + mode)
  const stacked = useMemo(() => {
    const seen = new Map<number, number>();
    return vals.map((v, i) => { const k = seen.get(v) ?? 0; seen.set(v, k + 1); return { v, i, level: k }; });
  }, [vals]);

  const pointerVal = (e: React.PointerEvent): number => {
    const r = svgRef.current!.getBoundingClientRect();
    return vOf(((e.clientX - r.left) / r.width) * W);
  };
  const onDown = (i: number) => (e: React.PointerEvent): void => { drag.current = i; (e.target as Element).setPointerCapture(e.pointerId); };
  const onMove = (e: React.PointerEvent): void => {
    if (drag.current == null) return;
    const nv = pointerVal(e);
    setVals((arr) => arr.map((x, k) => (k === drag.current ? nv : x)));
  };
  const onUp = (): void => { drag.current = null; };

  const reset = useCallback(() => setVals(data), [data]);
  const addPoint = useCallback(() => setVals((a) => [...a, Math.round((lo + hi) / 2 / step) * step]), [lo, hi, step]);
  const removePoint = useCallback(() => setVals((a) => (a.length > 1 ? a.slice(0, -1) : a)), []);
  const addOutlier = useCallback(() => setVals((a) => [...a, hi]), [hi]);

  const solved = challenge ? Math.abs((challenge.stat === 'mean' ? mu : md) - challenge.target) < 1e-6 : false;
  useCheckpoint({ solved, activity: `center-spread:${title}`, hintsUsed: hints.count });

  useControlSurface(controlId, {
    add: { type: 'action', label: 'add a point', invoke: addPoint },
    remove: { type: 'action', label: 'remove a point', invoke: removePoint },
    outlier: { type: 'action', label: 'add an outlier', invoke: addOutlier },
    reset: { type: 'action', label: 'reset data', invoke: reset },
  });

  const sigmaL = Math.max(lo, mu - sd), sigmaR = Math.min(hi, mu + sd);
  const ticks = Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step).filter((_, i, a) => a.length <= 12 || i % Math.ceil(a.length / 12) === 0);

  const stat = (label: ReactNode, value: string, color = 'var(--stage-fg)'): ReactNode => (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 64 }}>
      <span style={{ fontSize: 11, color: 'var(--stage-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 17, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </span>
  );

  const figure = (
    <>
      {challenge && <p style={{ fontWeight: 600, color: solved ? 'var(--stage-good)' : 'var(--stage-fg)' }}>{solved ? '✓ ' : '🎯 '}Drag the points until the <b>{challenge.stat}</b> = {challenge.target}.</p>}

      <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 8, touchAction: 'none' }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, height: 'auto', display: 'block', margin: '0 auto' }}
          onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} role="img" aria-label={`number line; mean ${mu.toFixed(2)}, median ${md}`}>
          {/* mean ± σ band */}
          {showSigma && sd > 0 && <rect x={xOf(sigmaL)} y={AXIS - 96} width={xOf(sigmaR) - xOf(sigmaL)} height={96} fill="color-mix(in oklab, var(--stage-accent) 12%, transparent)" />}
          {/* axis */}
          <line x1={M} y1={AXIS} x2={W - M} y2={AXIS} stroke="var(--stage-fg)" strokeWidth={2} />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={xOf(t)} y1={AXIS} x2={xOf(t)} y2={AXIS + 5} stroke="var(--stage-muted)" strokeWidth={1.5} />
              <text x={xOf(t)} y={AXIS + 18} textAnchor="middle" fontSize={11} fill="var(--stage-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>{t}</text>
            </g>
          ))}
          {/* median marker */}
          <line x1={xOf(md)} y1={AXIS - 104} x2={xOf(md)} y2={AXIS} stroke="var(--stage-accent-2, #d6336c)" strokeWidth={2} strokeDasharray="5 4" />
          <text x={xOf(md)} y={AXIS - 110} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--stage-accent-2, #d6336c)">median {md}</text>
          {/* data points (draggable, stacked) */}
          {stacked.map(({ v, i, level }) => {
            const cy = AXIS - 14 - level * 19;
            const isMode = mo.includes(v) && mo.length > 0;
            return (
              <circle key={i} cx={xOf(v)} cy={cy} r={9} fill={isMode ? 'var(--stage-warn)' : 'var(--stage-accent)'} stroke="var(--stage-bg)" strokeWidth={2}
                onPointerDown={onDown(i)} style={{ cursor: 'grab', transition: drag.current === i ? 'none' : 'cx .08s, cy .08s' }} />
            );
          })}
          {/* mean fulcrum (balance point) */}
          <g style={{ transition: drag.current == null ? 'transform .1s' : 'none', transform: `translateX(${xOf(mu) - W / 2}px)` }}>
            <path d={`M${W / 2},${AXIS + 1} l-9,16 h18 Z`} fill="var(--stage-good)" />
            <text x={W / 2} y={AXIS + 30} textAnchor="middle" fontSize={11} fontWeight={800} fill="var(--stage-good)">mean {mu.toFixed(2)}</text>
          </g>
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', margin: '12px 0', padding: '8px 0', borderTop: '1px solid var(--stage-grid)', borderBottom: '1px solid var(--stage-grid)' }}>
        {stat('mean', mu.toFixed(2), 'var(--stage-good)')}
        {stat('median', String(md), 'var(--stage-accent-2, #d6336c)')}
        {stat('mode', mo.length ? mo.join(', ') : ', ', 'var(--stage-warn)')}
        {stat('range', String(rg))}
        {stat('variance', variance(vals).toFixed(2))}
        {stat(<Tex tex="\\sigma" />, sd.toFixed(2), 'var(--stage-accent)')}
        {stat('n', String(vals.length))}
      </div>
    </>
  );

  const controls = (
    <ControlBar>
      <Chip selected={false} onClick={addPoint}>+ point</Chip>
      <Chip selected={false} onClick={removePoint}>− point</Chip>
      <Chip selected={false} onClick={addOutlier}>add outlier</Chip>
      <Chip selected={false} onClick={reset}>reset</Chip>
      <span style={{ fontSize: 12, color: 'var(--stage-muted)', alignSelf: 'center' }}>drag the dots ↔</span>
    </ControlBar>
  );

  return (
    <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={<HintLadder hints={hints} />}>
      {figure}
    </LabFrame>
  );
}
