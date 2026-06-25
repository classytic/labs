'use client';

/**
 * HistogramBoxLab — the SHAPE of data. A histogram (adjustable bins) sits above a
 * box-and-whisker on a SHARED axis, so the two views of the same numbers line up:
 * the histogram shows the distribution's shape, the box plot its five-number summary
 * (min · Q1 · median · Q3 · max) and outliers (beyond 1.5·IQR). Click in the plot to
 * DROP a data point and watch both update live; flip between symmetric / skewed /
 * bimodal presets to see how shape reads differently in each view.
 *
 * Every statistic comes from the descriptive-stats kernel (fiveNumber/frequencies);
 * the lab only draws them.
 */

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { mean, median, fiveNumber } from '../core/descriptive.js';
import { Chip, Slider } from '../../kit/controls.js';
import { useHints, HintLadder } from '../../kit/pedagogy.js';
import { LabFrame, ControlBar, Field } from '../../kit/frame.js';
import { useControlSurface } from '@classytic/stage';

export interface HistogramBoxProps {
  data?: number[];
  bins?: number;
  min?: number;
  max?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const W = 540, H = 320, ML = 38, MR = 16, MT = 14;
const AXIS = H * 0.6;                  // shared x-axis baseline
const BOX_TOP = AXIS + 26, BOX_H = 46; // box-plot strip

const PRESETS: Record<string, number[]> = {
  symmetric: [6, 7, 8, 8, 9, 9, 9, 10, 10, 10, 10, 11, 11, 11, 12, 12, 13, 14],
  'right-skewed': [2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 8, 10, 13, 17],
  bimodal: [3, 4, 4, 5, 5, 6, 13, 14, 14, 15, 15, 16, 17],
};

export function HistogramBoxLab({ data = PRESETS.symmetric, bins = 8, min = 0, max = 20, title = 'Histogram & box plot', prompt, objectives, hints: hintList, controlId }: HistogramBoxProps): ReactNode {
  const [vals, setVals] = useState<number[]>(data!);
  const [binCount, setBinCount] = useState(bins);
  const hints = useHints(hintList);
  const svgRef = useRef<SVGSVGElement>(null);

  const lo = min, hi = max;
  const xOf = (v: number): number => ML + ((v - lo) / (hi - lo)) * (W - ML - MR);
  const vOf = (px: number): number => Math.max(lo, Math.min(hi, lo + ((px - ML) / (W - ML - MR)) * (hi - lo)));

  const { bars, maxCount } = useMemo(() => {
    const bw = (hi - lo) / binCount;
    const counts = new Array(binCount).fill(0);
    for (const v of vals) { const b = Math.min(binCount - 1, Math.floor((v - lo) / bw)); if (b >= 0) counts[b]++; }
    return { bars: counts.map((c: number, i: number) => ({ c, x0: lo + i * bw, x1: lo + (i + 1) * bw })), maxCount: Math.max(1, ...counts) };
  }, [vals, binCount, lo, hi]);

  const fn = fiveNumber(vals);
  const lowFence = fn.q1 - 1.5 * fn.iqr, highFence = fn.q3 + 1.5 * fn.iqr;
  const inliers = vals.filter((v) => v >= lowFence && v <= highFence);
  const whiskLo = inliers.length ? Math.min(...inliers) : fn.min;
  const whiskHi = inliers.length ? Math.max(...inliers) : fn.max;
  const outliers = vals.filter((v) => v < lowFence || v > highFence);

  const addAt = (px: number): void => setVals((a) => [...a, Math.round(vOf(px))]);
  const onClick = (e: React.MouseEvent): void => {
    const r = svgRef.current!.getBoundingClientRect();
    addAt(((e.clientX - r.left) / r.width) * W);
  };

  const reset = useCallback(() => setVals(data!), [data]);
  const usePreset = useCallback((k: string) => setVals(PRESETS[k]!.slice()), []);

  useControlSurface(controlId, {
    bins: { type: 'number', label: 'bin count', min: 2, max: 16, step: 1, get: () => binCount, set: setBinCount },
    clear: { type: 'action', label: 'clear data', invoke: () => setVals([]) },
    reset: { type: 'action', label: 'reset', invoke: reset },
  });

  const histBottom = AXIS, histTop = MT + 6;
  const yBar = (c: number): number => histBottom - (c / maxCount) * (histBottom - histTop);
  const ticks = Array.from({ length: Math.floor((hi - lo) / Math.max(1, Math.round((hi - lo) / 10))) + 1 }, (_, i) => lo + i * Math.max(1, Math.round((hi - lo) / 10)));
  const boxMid = BOX_TOP + BOX_H / 2;

  const stat = (label: string, v: string): ReactNode => (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 52 }}>
      <span style={{ fontSize: 11, color: 'var(--stage-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
    </span>
  );

  const figure = (
    <>
      <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 8 }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, height: 'auto', display: 'block', cursor: 'crosshair' }} onClick={onClick} role="img" aria-label={`histogram and box plot; median ${fn.median}`}>
          {/* histogram bars */}
          {bars.map((b, i) => {
            const x = xOf(b.x0), w = xOf(b.x1) - xOf(b.x0);
            return <g key={i}>
              <rect x={x + 1} y={yBar(b.c)} width={Math.max(1, w - 2)} height={histBottom - yBar(b.c)} fill="color-mix(in oklab, var(--stage-accent) 78%, transparent)" />
              {b.c > 0 && <text x={x + w / 2} y={yBar(b.c) - 3} textAnchor="middle" fontSize={10} fill="var(--stage-muted)">{b.c}</text>}
            </g>;
          })}
          {/* shared axis */}
          <line x1={ML} y1={AXIS} x2={W - MR} y2={AXIS} stroke="var(--stage-fg)" strokeWidth={1.5} />
          {ticks.map((t) => <g key={t}>
            <line x1={xOf(t)} y1={AXIS} x2={xOf(t)} y2={AXIS + 4} stroke="var(--stage-muted)" strokeWidth={1} />
            <text x={xOf(t)} y={AXIS + 15} textAnchor="middle" fontSize={10} fill="var(--stage-muted)">{t}</text>
          </g>)}
          {/* box plot */}
          {vals.length > 0 && <>
            <line x1={xOf(whiskLo)} y1={boxMid} x2={xOf(fn.q1)} y2={boxMid} stroke="var(--stage-fg)" strokeWidth={1.5} />
            <line x1={xOf(fn.q3)} y1={boxMid} x2={xOf(whiskHi)} y2={boxMid} stroke="var(--stage-fg)" strokeWidth={1.5} />
            {[whiskLo, whiskHi].map((v, i) => <line key={i} x1={xOf(v)} y1={BOX_TOP + 8} x2={xOf(v)} y2={BOX_TOP + BOX_H - 8} stroke="var(--stage-fg)" strokeWidth={1.5} />)}
            <rect x={xOf(fn.q1)} y={BOX_TOP} width={Math.max(1, xOf(fn.q3) - xOf(fn.q1))} height={BOX_H} rx={4} fill="color-mix(in oklab, var(--stage-accent) 16%, transparent)" stroke="var(--stage-accent)" strokeWidth={1.5} />
            <line x1={xOf(fn.median)} y1={BOX_TOP} x2={xOf(fn.median)} y2={BOX_TOP + BOX_H} stroke="var(--stage-accent-2, #d6336c)" strokeWidth={2.5} />
            {outliers.map((v, i) => <circle key={i} cx={xOf(v)} cy={boxMid} r={3.5} fill="none" stroke="var(--stage-danger, #e03131)" strokeWidth={1.5} />)}
            {/* labels */}
            <text x={xOf(fn.median)} y={BOX_TOP - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--stage-accent-2, #d6336c)">med {fn.median}</text>
            <text x={xOf(fn.q1)} y={BOX_TOP + BOX_H + 13} textAnchor="middle" fontSize={9.5} fill="var(--stage-muted)">Q1 {fn.q1}</text>
            <text x={xOf(fn.q3)} y={BOX_TOP + BOX_H + 13} textAnchor="middle" fontSize={9.5} fill="var(--stage-muted)">Q3 {fn.q3}</text>
          </>}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', margin: '10px 0', padding: '8px 0', borderTop: '1px solid var(--stage-grid)', borderBottom: '1px solid var(--stage-grid)' }}>
        {stat('n', String(vals.length))}
        {stat('mean', vals.length ? mean(vals).toFixed(1) : '—')}
        {stat('median', vals.length ? String(median(vals)) : '—')}
        {stat('Q1', vals.length ? String(fn.q1) : '—')}
        {stat('Q3', vals.length ? String(fn.q3) : '—')}
        {stat('IQR', vals.length ? String(fn.iqr) : '—')}
        {stat('outliers', String(outliers.length))}
      </div>
    </>
  );

  const controls = (
    <ControlBar>
      <span style={{ fontSize: 12, color: 'var(--stage-muted)' }}>shape:</span>
      {Object.keys(PRESETS).map((k) => <Chip key={k} selected={false} onClick={() => usePreset(k)}>{k}</Chip>)}
      <Chip selected={false} onClick={() => setVals([])}>clear</Chip>
      <Chip selected={false} onClick={reset}>reset</Chip>
      <Field label="bins" value={binCount}><Slider value={binCount} min={2} max={16} step={1} onChange={setBinCount} ariaLabel="bin count" /></Field>
      <span style={{ fontSize: 12, color: 'var(--stage-muted)' }}>· click the plot to add a point</span>
    </ControlBar>
  );

  return (
    <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={<HintLadder hints={hints} />}>
      {figure}
    </LabFrame>
  );
}
