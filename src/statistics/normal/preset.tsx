'use client';

/**
 * NormalDistributionLab, the bell curve as a working instrument. Drag μ and σ and
 * the curve slides + widens; drag the two shaded handles and read P(a ≤ X ≤ b) as
 * the AREA under the curve, with each bound's z-score (how many σ from the mean).
 * A second mode draws the 68–95–99.7 rule as nested bands. This is the tool every
 * stats/ML lesson reaches for after the Galton board: from "a bell appears" to
 * "how likely is a value in THIS range, and how unusual is it (z)?".
 *
 * pdf/cdf/z come from the normal kernel; the lab only draws + shades them.
 */

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { normalPdf, normalBetween, zScore, withinSigma } from '../core/normal.js';
import { Tex } from '../../core/tex.js';
import { Chip, Segmented, Slider } from '../../kit/controls.js';
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
import { Bracket, Pointer, Spotlight } from '../../kit/annotate.js';
import { useControlSurface } from '@classytic/stage';
import { clearTicks } from '../../kit/ticks.js';

const CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'rule68',
    prompt: 'Roughly what fraction of a normal distribution lies within 1σ of the mean?',
    choices: [
      { value: '68', label: 'about 68%' },
      { value: '50', label: 'about 50%' },
      { value: '95', label: 'about 95%' },
    ],
    answer: '68',
    explain:
      'The 68–95–99.7 rule: ~68% within ±1σ, ~95% within ±2σ, ~99.7% within ±3σ. Switch to the 68–95–99.7 mode to see the bands.',
  },
  {
    id: 'z2',
    prompt: 'A value 2σ above the mean (z = 2) is…',
    choices: [
      { value: 'rare', label: 'unusual — only ~2.5% are higher' },
      { value: 'typical', label: 'quite typical' },
      { value: 'imposs', label: 'impossible' },
    ],
    answer: 'rare',
    explain:
      'Beyond +2σ sits only ~2.5% of the area, so z = 2 is genuinely unusual. That’s what a z-score measures: how many σ a value is from the mean.',
  },
];

export type NormalMode = 'area' | 'rule';
export interface NormalProps {
  mu?: number;
  sigma?: number;
  a?: number;
  b?: number;
  mode?: NormalMode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const W = 540,
  H = 324,
  ML = 30,
  MR = 16,
  MT = 18,
  MB = 64;
const PW = W - ML - MR,
  PH = H - MT - MB;
const BANDS = [
  { k: 1, p: withinSigma(1), op: 0.28 },
  { k: 2, p: withinSigma(2), op: 0.18 },
  { k: 3, p: withinSigma(3), op: 0.1 },
];
const f1 = (x: number): string => x.toFixed(1);

export function NormalDistributionLab({
  mu = 0,
  sigma = 1,
  a = -1,
  b = 1,
  mode: mode0 = 'area',
  title = 'The normal distribution',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: NormalProps): ReactNode {
  const [m, setM] = useState(mu);
  const [sig, setSig] = useState(sigma);
  const [lo, setLo] = useState(a);
  const [hi, setHi] = useState(b);
  const [mode, setMode] = useState<NormalMode>(mode0);
  const hints = useHints(hintList);
  const ch = useChallenge(CHALLENGE);
  useCheckpoint({
    solved: ch.allCorrect,
    activity: `normal:${title}`,
    hintsUsed: hints.count,
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<'a' | 'b' | null>(null);

  const xMin = m - 4 * sig,
    xMax = m + 4 * sig;
  const yMax = normalPdf(m, m, sig) * 1.12;
  const xOf = (x: number): number => ML + ((x - xMin) / (xMax - xMin)) * PW;
  const yOf = (y: number): number => MT + PH - (y / yMax) * PH;
  const vOf = (px: number): number => xMin + ((px - ML) / PW) * (xMax - xMin);

  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 160; i++) {
      const x = xMin + (i / 160) * (xMax - xMin);
      pts.push(`${xOf(x).toFixed(1)},${yOf(normalPdf(x, m, sig)).toFixed(1)}`);
    }
    return pts;
  }, [m, sig]);

  // area under the curve between two x's → an SVG fill path
  const bandPath = (x0: number, x1: number): string => {
    const a0 = Math.max(xMin, Math.min(x0, x1)),
      a1 = Math.min(xMax, Math.max(x0, x1));
    const pts: string[] = [`${xOf(a0).toFixed(1)},${yOf(0).toFixed(1)}`];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const x = a0 + (i / steps) * (a1 - a0);
      pts.push(`${xOf(x).toFixed(1)},${yOf(normalPdf(x, m, sig)).toFixed(1)}`);
    }
    pts.push(`${xOf(a1).toFixed(1)},${yOf(0).toFixed(1)}`);
    return `M${pts.join(' L')} Z`;
  };

  const area = normalBetween(lo, hi, m, sig);
  const za = zScore(lo, m, sig),
    zb = zScore(hi, m, sig);

  const onMove = (e: React.PointerEvent): void => {
    if (!drag.current) return;
    const r = svgRef.current!.getBoundingClientRect();
    const x = vOf(((e.clientX - r.left) / r.width) * W);
    if (drag.current === 'a') setLo(Math.min(x, hi - 0.05 * sig));
    else setHi(Math.max(x, lo + 0.05 * sig));
  };
  const grab =
    (which: 'a' | 'b') =>
    (e: React.PointerEvent): void => {
      drag.current = which;
      (e.target as Element).setPointerCapture(e.pointerId);
    };
  const release = (): void => {
    drag.current = null;
  };

  const nudgeBound = (which: 'a' | 'b', direction: -1 | 1): void => {
    const step = Math.max(0.05, sig / 10);
    if (which === 'a') setLo((value) => Math.min(value + direction * step, hi - 0.05 * sig));
    else setHi((value) => Math.max(value + direction * step, lo + 0.05 * sig));
  };

  const reset = useCallback(() => {
    setM(mu);
    setSig(sigma);
    setLo(a);
    setHi(b);
  }, [mu, sigma, a, b]);

  useControlSurface(controlId, {
    mode: {
      type: 'enum',
      label: 'mode',
      options: ['area', 'rule'],
      get: () => mode,
      set: (v) => setMode(v as NormalMode),
    },
    mean: {
      type: 'number',
      label: 'mean μ',
      min: -5,
      max: 5,
      step: 0.1,
      get: () => m,
      set: setM,
    },
    sd: {
      type: 'number',
      label: 'std dev σ',
      min: 0.3,
      max: 3,
      step: 0.1,
      get: () => sig,
      set: setSig,
    },
    lower: {
      type: 'number',
      label: 'lower bound a',
      min: -10,
      max: 10,
      step: 0.1,
      get: () => lo,
      set: setLo,
    },
    upper: {
      type: 'number',
      label: 'upper bound b',
      min: -10,
      max: 10,
      step: 0.1,
      get: () => hi,
      set: setHi,
    },
    reset: { type: 'action', label: 'reset', invoke: reset },
  });

  const sigmaText = (k: number): string => (k === 0 ? 'μ' : `${k > 0 ? '+' : ''}${k}σ`);
  const sigmaLabels = new Set(
    clearTicks(
      [-3, -2, -1, 0, 1, 2, 3].map((k) => ({ at: xOf(m + k * sig), text: sigmaText(k), value: k })),
      mode === 'area' ? [lo, hi].map((b) => ({ at: xOf(b), half: 10 })) : [],
      9.5,
    ).map((t) => t.value),
  );

  const handle = (x: number, which: 'a' | 'b', z: number): ReactNode => (
    <g
      className="statistics-bound-handle"
      onPointerDown={grab(which)}
      role="slider"
      aria-label={`${which === 'a' ? 'lower' : 'upper'} bound`}
      aria-valuenow={x}
      aria-valuemin={xMin}
      aria-valuemax={xMax}
      aria-valuetext={`${x.toFixed(2)}, z score ${z.toFixed(2)}`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        nudgeBound(which, event.key === 'ArrowLeft' ? -1 : 1);
      }}
    >
      <line
        x1={xOf(x)}
        y1={MT}
        x2={xOf(x)}
        y2={yOf(0)}
        stroke="var(--stage-accent)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      <circle
        cx={xOf(x)}
        cy={yOf(0)}
        r={8}
        fill="var(--stage-accent)"
        stroke="var(--stage-bg)"
        strokeWidth={2}
      />
      <text
        x={xOf(x)}
        y={yOf(0) + 26}
        textAnchor="middle"
        fontSize={10}
        fill="var(--stage-accent)"
        fontWeight={700}
      >
        z={z.toFixed(2)}
      </text>
    </g>
  );

  const figure = (
    <>
      <div className="lab-field-row">
        <Segmented
          ariaLabel="view"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'area', label: 'shade an area' },
            { value: 'rule', label: '68–95–99.7 rule' },
          ]}
        />
      </div>

      <div className="discrete-stage-scene statistics-interactive-scene">
        <svg
          className="statistics-chart"
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          onPointerMove={onMove}
          onPointerUp={release}
          onPointerLeave={release}
          role="img"
          aria-label={`normal curve, mean ${m}, sd ${sig}`}
        >
          {/* empirical-rule bands (widest first) */}
          {mode === 'rule' &&
            [...BANDS]
              .reverse()
              .map((band) => (
                <path
                  key={band.k}
                  d={bandPath(m - band.k * sig, m + band.k * sig)}
                  fill="var(--stage-accent)"
                  opacity={band.op}
                />
              ))}
          {/* shaded area between bounds */}
          {mode === 'area' && (
            <path d={bandPath(lo, hi)} fill="color-mix(in oklab, var(--stage-accent) 38%, transparent)" />
          )}
          {/* axis */}
          <line x1={ML} y1={yOf(0)} x2={W - MR} y2={yOf(0)} stroke="var(--stage-fg)" strokeWidth={1.5} />
          {/* σ ticks; in area mode the bound handles sit on the line and their numbers step aside */}
          {[-3, -2, -1, 0, 1, 2, 3].map((k) => {
            const x = m + k * sig;
            const shown = sigmaLabels.has(k);
            return (
              <g key={k}>
                <line
                  x1={xOf(x)}
                  y1={yOf(0)}
                  x2={xOf(x)}
                  y2={yOf(0) + 4}
                  stroke="var(--stage-muted)"
                  strokeWidth={1}
                />
                {shown && (
                  <text
                    className="lab-tabular"
                    x={xOf(x)}
                    y={yOf(0) + 15}
                    textAnchor="middle"
                    fontSize={9.5}
                    fill="var(--stage-muted)"
                  >
                    {sigmaText(k)}
                  </text>
                )}
              </g>
            );
          })}
          {/* the curve */}
          <polyline points={curve.join(' ')} fill="none" stroke="var(--stage-fg)" strokeWidth={2.5} />
          {/* μ line */}
          <line
            x1={xOf(m)}
            y1={MT}
            x2={xOf(m)}
            y2={yOf(0)}
            stroke="var(--stage-muted)"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
          {/* rule annotations (bracket per band + a peak callout) or drag handles */}
          {mode === 'rule' ? (
            <>
              <Bracket
                x1={xOf(m - sig)}
                x2={xOf(m + sig)}
                y={yOf(0) + 30}
                text={`±1σ → ${(withinSigma(1) * 100).toFixed(1)}% of all values`}
                tone="good"
                side="below"
              />
              <Spotlight cx={xOf(m + 2 * sig)} cy={yOf(normalPdf(m + 2 * sig, m, sig))} r={11} tone="warn" />
              <Pointer
                x={xOf(m + 2 * sig)}
                y={yOf(normalPdf(m + 2 * sig, m, sig))}
                dx={26}
                dy={-34}
                text="rare, beyond 2σ"
                tone="warn"
              />
            </>
          ) : (
            <>
              {handle(lo, 'a', za)}
              {handle(hi, 'b', zb)}
            </>
          )}
        </svg>
      </div>

      {mode === 'area' ? (
        <div className="statistics-area-summary">
          <span className="statistics-area-result">
            <Tex tex={`P(${f1(lo)} \\le X \\le ${f1(hi)}) = ${(area * 100).toFixed(1)}\\%`} />
          </span>
          <span className="statistics-z-range">
            <Tex tex={`z: ${za.toFixed(2)} \\to ${zb.toFixed(2)}`} />
          </span>
          <span className="statistics-interaction-hint">drag the dots ↔</span>
        </div>
      ) : (
        <div className="statistics-rule-summary">
          {BANDS.map((band) => (
            <span key={band.k}>
              <Tex tex={`\\pm${band.k}\\sigma \\to ${(band.p * 100).toFixed(band.k === 3 ? 1 : 1)}\\%`} />
            </span>
          ))}
        </div>
      )}
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      <Field label="mean μ" value={f1(m)}>
        <Slider value={m} min={-5} max={5} step={0.1} onChange={setM} ariaLabel="mean" />
      </Field>
      <Field label="std dev σ" value={f1(sig)}>
        <Slider value={sig} min={0.3} max={3} step={0.1} onChange={setSig} ariaLabel="standard deviation" />
      </Field>
      <Chip selected={false} onClick={reset}>
        reset
      </Chip>
    </div>
  );

  const footer = (
    <>
      <ChallengeCard questions={CHALLENGE} state={ch} title="Predict first" />
      <HintLadder hints={hints} />
    </>
  );

  return (
    <Activity.Root className="statistics-normal-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Probability distributions"
          title={title}
          description={
            prompt ??
            'Move the interval and distribution parameters to connect area, probability, and standardized distance.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{mode === 'area' ? `${(area * 100).toFixed(1)}% in interval` : '68–95–99.7 rule'}</strong>
        <span>μ {f1(m)}</span>
        <span>σ {f1(sig)}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Interactive normal distribution">{figure}</Activity.Canvas>
        <Activity.Inspector label="Distribution parameters">{controls}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {mode === 'area'
            ? `The shaded area is the probability between the two bounds; standardizing gives z = ${za.toFixed(2)} to ${zb.toFixed(2)}.`
            : 'The nested bands preserve the same curve while showing how probability accumulates by standard deviation.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Normal-distribution prediction and support">
        {footer}
      </section>
      <Activity.LiveRegion>
        {mode === 'area'
          ? `The interval from ${lo.toFixed(1)} to ${hi.toFixed(1)} contains ${(area * 100).toFixed(1)} percent of the distribution. Its z-score bounds are ${za.toFixed(2)} and ${zb.toFixed(2)}.`
          : `About 68 percent lies within one standard deviation, 95 percent within two, and 99.7 percent within three.`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{mode === 'area' ? 'Inspect the shaded interval' : 'Compare the sigma bands'}</strong>
          <span>{mode === 'area' ? `${f1(lo)} to ${f1(hi)}` : `μ ${f1(m)} · σ ${f1(sig)}`}</span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
