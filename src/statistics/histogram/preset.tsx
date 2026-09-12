'use client';

/**
 * HistogramBoxLab, the SHAPE of data. A histogram (adjustable bins) sits above a
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
import { ActionButton, Chip, Slider } from '../../kit/controls.js';
import { Activity } from '../../kit/activity.js';
import {
  useHints,
  HintLadder,
  useChallenge,
  ChallengeCard,
  useCheckpoint,
  type ChallengeQuestion,
} from '../../kit/pedagogy.js';
import { Field } from '../../kit/frame.js';
import { useControlSurface } from '@classytic/stage';

const CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'skew',
    prompt: 'For right-skewed data (a long tail to the right), the mean is…',
    choices: [
      { value: 'gt', label: 'greater than the median' },
      { value: 'eq', label: 'equal to the median' },
      { value: 'lt', label: 'less than the median' },
    ],
    answer: 'gt',
    explain:
      'The long right tail drags the mean toward it while the median barely moves, so mean > median. Try the right-skewed preset.',
  },
  {
    id: 'outlier',
    prompt: 'Adding one far-out value (an outlier) shifts the ___ the most.',
    choices: [
      { value: 'mean', label: 'mean' },
      { value: 'median', label: 'median' },
      { value: 'iqr', label: 'IQR' },
    ],
    answer: 'mean',
    explain:
      'The mean uses every value, so an outlier pulls it; the median and IQR are resistant. Click far out on the plot to see it.',
  },
];

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

const W = 540,
  H = 320,
  ML = 38,
  MR = 16,
  MT = 14;
const AXIS = H * 0.6; // shared x-axis baseline
const BOX_TOP = AXIS + 26,
  BOX_H = 46; // box-plot strip

const PRESETS: Record<string, number[]> = {
  symmetric: [6, 7, 8, 8, 9, 9, 9, 10, 10, 10, 10, 11, 11, 11, 12, 12, 13, 14],
  'right-skewed': [2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 8, 10, 13, 17],
  bimodal: [3, 4, 4, 5, 5, 6, 13, 14, 14, 15, 15, 16, 17],
};
const matchingPreset = (values: number[]): string | null =>
  Object.entries(PRESETS).find(
    ([, preset]) =>
      preset.length === values.length && preset.every((value, index) => value === values[index]),
  )?.[0] ?? null;

export function HistogramBoxLab({
  data = PRESETS.symmetric,
  bins = 8,
  min = 0,
  max = 20,
  title = 'Histogram & box plot',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: HistogramBoxProps): ReactNode {
  const [vals, setVals] = useState<number[]>(data!);
  const [binCount, setBinCount] = useState(bins);
  const [newValue, setNewValue] = useState(Math.round((min + max) / 2));
  const [presetName, setPresetName] = useState<string | null>(() => matchingPreset(data!));
  const hints = useHints(hintList);
  const ch = useChallenge(CHALLENGE);
  useCheckpoint({
    solved: ch.allCorrect,
    activity: `histogram:${title}`,
    hintsUsed: hints.count,
  });
  const svgRef = useRef<SVGSVGElement>(null);

  const lo = min,
    hi = max;
  const xOf = (v: number): number => ML + ((v - lo) / (hi - lo)) * (W - ML - MR);
  const vOf = (px: number): number =>
    Math.max(lo, Math.min(hi, lo + ((px - ML) / (W - ML - MR)) * (hi - lo)));

  const { bars, maxCount } = useMemo(() => {
    const bw = (hi - lo) / binCount;
    const counts = new Array(binCount).fill(0);
    for (const v of vals) {
      const b = Math.min(binCount - 1, Math.floor((v - lo) / bw));
      if (b >= 0) counts[b]++;
    }
    return {
      bars: counts.map((c: number, i: number) => ({
        c,
        x0: lo + i * bw,
        x1: lo + (i + 1) * bw,
      })),
      maxCount: Math.max(1, ...counts),
    };
  }, [vals, binCount, lo, hi]);

  const fn = fiveNumber(vals);
  const lowFence = fn.q1 - 1.5 * fn.iqr,
    highFence = fn.q3 + 1.5 * fn.iqr;
  const inliers = vals.filter((v) => v >= lowFence && v <= highFence);
  const whiskLo = inliers.length ? Math.min(...inliers) : fn.min;
  const whiskHi = inliers.length ? Math.max(...inliers) : fn.max;
  const outliers = vals.filter((v) => v < lowFence || v > highFence);

  const addValue = (value: number): void => {
    setVals((current) => [...current, Math.round(value)]);
    setPresetName(null);
  };
  const addAt = (px: number): void => addValue(vOf(px));
  const onClick = (e: React.MouseEvent): void => {
    const r = svgRef.current!.getBoundingClientRect();
    addAt(((e.clientX - r.left) / r.width) * W);
  };

  const reset = useCallback(() => {
    setVals(data!);
    setPresetName(matchingPreset(data!));
  }, [data]);
  const usePreset = useCallback((k: string) => {
    setVals(PRESETS[k]!.slice());
    setPresetName(k);
  }, []);

  useControlSurface(controlId, {
    bins: {
      type: 'number',
      label: 'bin count',
      min: 2,
      max: 16,
      step: 1,
      get: () => binCount,
      set: setBinCount,
    },
    value: {
      type: 'number',
      label: 'new data value',
      min: lo,
      max: hi,
      step: 1,
      get: () => newValue,
      set: setNewValue,
    },
    add: { type: 'action', label: 'add data value', invoke: () => addValue(newValue) },
    clear: {
      type: 'action',
      label: 'clear data',
      invoke: () => {
        setVals([]);
        setPresetName(null);
      },
    },
    reset: { type: 'action', label: 'reset', invoke: reset },
  });

  const histBottom = AXIS,
    histTop = MT + 6;
  const yBar = (c: number): number => histBottom - (c / maxCount) * (histBottom - histTop);
  const ticks = Array.from(
    {
      length: Math.floor((hi - lo) / Math.max(1, Math.round((hi - lo) / 10))) + 1,
    },
    (_, i) => lo + i * Math.max(1, Math.round((hi - lo) / 10)),
  );
  const boxMid = BOX_TOP + BOX_H / 2;

  const stat = (label: string, v: string): ReactNode => (
    <span className="statistics-stat statistics-stat-compact">
      <span className="statistics-stat-label">{label}</span>
      <span className="statistics-stat-value">{v}</span>
    </span>
  );

  const figure = (
    <>
      <div className="discrete-stage-scene statistics-interactive-scene">
        <svg
          className="statistics-chart statistics-chart-crosshair"
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          onClick={onClick}
          role="img"
          aria-label={`Histogram and box plot with ${vals.length} values; median ${fn.median}. Click the plot as an optional shortcut to add a value.`}
        >
          {/* histogram bars */}
          {bars.map((b, i) => {
            const x = xOf(b.x0),
              w = xOf(b.x1) - xOf(b.x0);
            return (
              <g key={i}>
                <rect
                  x={x + 1}
                  y={yBar(b.c)}
                  width={Math.max(1, w - 2)}
                  height={histBottom - yBar(b.c)}
                  fill="color-mix(in oklab, var(--stage-accent) 78%, transparent)"
                />
                {b.c > 0 && (
                  <text
                    x={x + w / 2}
                    y={yBar(b.c) - 3}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--stage-muted)"
                  >
                    {b.c}
                  </text>
                )}
              </g>
            );
          })}
          {/* shared axis */}
          <line x1={ML} y1={AXIS} x2={W - MR} y2={AXIS} stroke="var(--stage-fg)" strokeWidth={1.5} />
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={xOf(t)}
                y1={AXIS}
                x2={xOf(t)}
                y2={AXIS + 4}
                stroke="var(--stage-muted)"
                strokeWidth={1}
              />
              <text x={xOf(t)} y={AXIS + 15} textAnchor="middle" fontSize={10} fill="var(--stage-muted)">
                {t}
              </text>
            </g>
          ))}
          {/* box plot */}
          {vals.length > 0 && (
            <>
              <line
                x1={xOf(whiskLo)}
                y1={boxMid}
                x2={xOf(fn.q1)}
                y2={boxMid}
                stroke="var(--stage-fg)"
                strokeWidth={1.5}
              />
              <line
                x1={xOf(fn.q3)}
                y1={boxMid}
                x2={xOf(whiskHi)}
                y2={boxMid}
                stroke="var(--stage-fg)"
                strokeWidth={1.5}
              />
              {[whiskLo, whiskHi].map((v, i) => (
                <line
                  key={i}
                  x1={xOf(v)}
                  y1={BOX_TOP + 8}
                  x2={xOf(v)}
                  y2={BOX_TOP + BOX_H - 8}
                  stroke="var(--stage-fg)"
                  strokeWidth={1.5}
                />
              ))}
              <rect
                x={xOf(fn.q1)}
                y={BOX_TOP}
                width={Math.max(1, xOf(fn.q3) - xOf(fn.q1))}
                height={BOX_H}
                rx={4}
                fill="color-mix(in oklab, var(--stage-accent) 16%, transparent)"
                stroke="var(--stage-accent)"
                strokeWidth={1.5}
              />
              <line
                x1={xOf(fn.median)}
                y1={BOX_TOP}
                x2={xOf(fn.median)}
                y2={BOX_TOP + BOX_H}
                stroke="var(--stage-accent-2, #d6336c)"
                strokeWidth={2.5}
              />
              {outliers.map((v, i) => (
                <circle
                  key={i}
                  cx={xOf(v)}
                  cy={boxMid}
                  r={3.5}
                  fill="none"
                  stroke="var(--stage-danger, #e03131)"
                  strokeWidth={1.5}
                />
              ))}
              {/* labels */}
              <text
                x={xOf(fn.median)}
                y={BOX_TOP - 4}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill="var(--stage-accent-2, #d6336c)"
              >
                med {fn.median}
              </text>
              <text
                x={xOf(fn.q1)}
                y={BOX_TOP + BOX_H + 13}
                textAnchor="middle"
                fontSize={9.5}
                fill="var(--stage-muted)"
              >
                Q1 {fn.q1}
              </text>
              <text
                x={xOf(fn.q3)}
                y={BOX_TOP + BOX_H + 13}
                textAnchor="middle"
                fontSize={9.5}
                fill="var(--stage-muted)"
              >
                Q3 {fn.q3}
              </text>
            </>
          )}
        </svg>
      </div>

      <div className="statistics-stat-strip">
        {stat('n', String(vals.length))}
        {stat('mean', vals.length ? mean(vals).toFixed(1) : '-')}
        {stat('median', vals.length ? String(median(vals)) : '-')}
        {stat('Q1', vals.length ? String(fn.q1) : '-')}
        {stat('Q3', vals.length ? String(fn.q3) : '-')}
        {stat('IQR', vals.length ? String(fn.iqr) : '-')}
        {stat('outliers', String(outliers.length))}
      </div>
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      <span className="lab-field-label">shape:</span>
      {Object.keys(PRESETS).map((k) => (
        <Chip
          key={k}
          selected={presetName === k}
          onClick={() => usePreset(k)}
          aria-pressed={presetName === k}
        >
          {k}
        </Chip>
      ))}
      <ActionButton
        onClick={() => {
          setVals([]);
          setPresetName(null);
        }}
      >
        clear
      </ActionButton>
      <ActionButton onClick={reset}>reset</ActionButton>
      <Field label="bins" value={binCount}>
        <Slider value={binCount} min={2} max={16} step={1} onChange={setBinCount} ariaLabel="bin count" />
      </Field>
      <Field label="new value" value={newValue}>
        <Slider
          value={newValue}
          min={lo}
          max={hi}
          step={1}
          onChange={setNewValue}
          ariaLabel="new data value"
        />
      </Field>
      <span className="statistics-interaction-hint">plot click is a shortcut</span>
    </div>
  );

  const footer = (
    <>
      <ChallengeCard questions={CHALLENGE} state={ch} title="Predict first" />
      <HintLadder hints={hints} />
    </>
  );

  return (
    <Activity.Root className="statistics-histogram-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Distribution shape"
          title={title}
          description={
            prompt ??
            'Change one dataset and compare its histogram, box plot, five-number summary, and outliers on a shared scale.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{vals.length} values</strong>
        <span>{binCount} bins</span>
        <span>{outliers.length} outliers</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Histogram and aligned box plot">{figure}</Activity.Canvas>
        <Activity.Inspector label="Dataset presets and controls">{controls}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          The histogram exposes shape while the aligned box plot compresses the same values into quartiles and
          outlier fences.
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Distribution-shape prediction and support">
        {footer}
      </section>
      <Activity.LiveRegion>
        Dataset has {vals.length} values; mean {vals.length ? mean(vals).toFixed(1) : 'not available'}, median{' '}
        {vals.length ? fn.median : 'not available'}, IQR {vals.length ? fn.iqr : 'not available'}, and{' '}
        {outliers.length} outliers.
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{presetName ?? 'Custom dataset'}</strong>
          <span>new value {newValue}</span>
        </div>
        <ActionButton onClick={() => addValue(newValue)}>add value</ActionButton>
      </Activity.Transport>
    </Activity.Root>
  );
}
