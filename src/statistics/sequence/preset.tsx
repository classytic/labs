'use client';

/**
 * SequenceLab, arithmetic & geometric sequences you can watch grow. Each term is
 * a bar (the pattern: a steady ladder for arithmetic, an explosion or a fading
 * tail for geometric); a line traces the RUNNING TOTAL across them. The magic
 * moment is geometric convergence: when |r|<1 the running-total line flattens onto
 * a dashed S∞ guide, an infinite sum with a finite answer, seen, not just stated.
 *
 * Closed forms come from the sequences kernel and are shown (KaTeX) beside the
 * brute running total, so formula and picture are provably the same thing.
 */

import { useMemo, useState, type ReactNode } from 'react';
import {
  type SeqKind,
  type SeqSpec,
  nthTerm,
  terms,
  partialSum,
  partialSums,
  infiniteSum,
} from '../core/sequences.js';
import { Tex } from '../../core/tex.js';
import { Segmented, Slider } from '../../kit/controls.js';
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

export interface SequenceProps {
  kind?: SeqKind;
  first?: number;
  step?: number;
  count?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const W = 540,
  H = 250,
  ML = 36,
  MR = 16,
  MT = 20,
  MB = 30;
const PW = W - ML - MR,
  PH = H - MT - MB;
const r2 = (x: number): number => Math.round(x * 100) / 100;
const fnum = (x: number): string => (Number.isInteger(x) ? String(x) : r2(x).toString());

export function SequenceLab({
  kind = 'geometric',
  first = 1,
  step = 0.5,
  count = 8,
  title = 'Sequences & series',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: SequenceProps): ReactNode {
  const [k, setK] = useState<SeqKind>(kind);
  const [a1, setA1] = useState(first);
  const [d, setD] = useState(step);
  const [n, setN] = useState(count);
  const hints = useHints(hintList);

  // Predict-first gate: does the DEFAULT series settle on a finite sum or grow forever?
  // Default config decides the correct answer: arithmetic always diverges; geometric
  // converges only when |r| < 1.
  const defaultConverges = kind === 'geometric' && Math.abs(step) < 1;
  const predictQ = useMemo<ChallengeQuestion[]>(
    () => [
      {
        id: 'sequence-converge',
        prompt:
          kind === 'geometric' ? (
            <>
              This geometric series has ratio <Tex tex={`r = ${fnum(step)}`} />. It adds infinitely many
              terms, does the total settle on a finite number, or grow without bound?
            </>
          ) : (
            <>
              This is an arithmetic series (each term adds a fixed <Tex tex={`d = ${fnum(step)}`} />
              ). Summed over infinitely many terms, does the total settle on a finite number, or grow without
              bound?
            </>
          ),
        choices: [
          { value: 'converges', label: 'settles on a finite sum' },
          { value: 'diverges', label: 'grows forever' },
        ],
        answer: defaultConverges ? 'converges' : 'diverges',
        explain: (
          <>
            A geometric series converges only when <Tex tex="|r| < 1" /> (the terms shrink to nothing); an
            arithmetic series always grows without bound. Here{' '}
            <Tex tex={kind === 'geometric' ? `|r| ${defaultConverges ? '<' : '\\ge'} 1` : 'd \\ne 0'} />, so
            it {defaultConverges ? 'converges' : 'diverges'}.
          </>
        ),
      },
    ],
    [],
  );
  const ch = useChallenge(predictQ);
  useCheckpoint({ solved: ch.allCorrect, activity: 'sequence:predict' });

  const spec: SeqSpec = { kind: k, first: a1, step: d };
  const ts = useMemo(() => terms(spec, n), [k, a1, d, n]);
  const sums = useMemo(() => partialSums(spec, n), [k, a1, d, n]);
  const sInf = infiniteSum(spec);
  const Sn = partialSum(spec, n);

  const all = [0, ...ts, ...sums, ...(sInf != null ? [sInf] : [])];
  const yMax = Math.max(...all),
    yMin = Math.min(...all);
  const pad = (yMax - yMin) * 0.08 || 1;
  const yLo = yMin - pad,
    yHi = yMax + pad;
  const yOf = (v: number): number => MT + PH - ((v - yLo) / (yHi - yLo)) * PH;
  const colW = PW / n;
  const cx = (i: number): number => ML + colW * (i + 0.5);
  const y0 = yOf(0);

  useControlSurface(controlId, {
    kind: {
      type: 'enum',
      label: 'sequence kind',
      options: ['arithmetic', 'geometric'],
      get: () => k,
      set: (v: string) => setK(v as SeqKind),
    },
    first: {
      type: 'number',
      label: 'first term a₁',
      min: -5,
      max: 10,
      step: 0.5,
      get: () => a1,
      set: setA1,
    },
    step: {
      type: 'number',
      label: k === 'arithmetic' ? 'common difference d' : 'common ratio r',
      min: k === 'arithmetic' ? -5 : -2,
      max: k === 'arithmetic' ? 5 : 2,
      step: k === 'arithmetic' ? 1 : 0.1,
      get: () => d,
      set: setD,
    },
    count: {
      type: 'number',
      label: 'how many terms',
      min: 2,
      max: 16,
      step: 1,
      get: () => n,
      set: setN,
    },
  });

  const isArith = k === 'arithmetic';
  const termTex = isArith
    ? `a_n = ${fnum(a1)} + (n-1)\\cdot ${fnum(d)}`
    : `a_n = ${fnum(a1)}\\cdot (${fnum(d)})^{\\,n-1}`;
  const sumTex = isArith ? `S_n = \\tfrac{n}{2}\\,(2a_1+(n-1)d)` : `S_n = a_1\\dfrac{1-r^{\\,n}}{1-r}`;

  const figure = (
    <>
      <div className="lab-field-row">
        <Segmented
          ariaLabel="sequence kind"
          value={k}
          onChange={setK}
          options={[
            { value: 'arithmetic', label: 'arithmetic (+d)' },
            { value: 'geometric', label: 'geometric (×r)' },
          ]}
        />
      </div>

      <div className="discrete-stage-scene statistics-interactive-scene">
        <svg
          className="statistics-chart"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${k} sequence, ${n} terms, running total ${fnum(Sn)}`}
        >
          {/* zero axis */}
          <line x1={ML} y1={y0} x2={W - MR} y2={y0} stroke="var(--stage-muted)" strokeWidth={1} />
          {/* S∞ guide (convergent geometric) */}
          {sInf != null && (
            <>
              <line
                x1={ML}
                y1={yOf(sInf)}
                x2={W - MR}
                y2={yOf(sInf)}
                stroke="var(--stage-good)"
                strokeWidth={1.5}
                strokeDasharray="6 5"
              />
              <text
                x={W - MR}
                y={yOf(sInf) - 5}
                textAnchor="end"
                fontSize={11}
                fontWeight={700}
                fill="var(--stage-good)"
              >
                S∞ = {fnum(sInf)}
              </text>
            </>
          )}
          {/* term bars */}
          {ts.map((t, i) => {
            const bw = Math.min(28, colW * 0.5);
            const top = Math.min(yOf(t), y0),
              h = Math.abs(yOf(t) - y0);
            return (
              <g key={i}>
                <rect
                  x={cx(i) - bw / 2}
                  y={top}
                  width={bw}
                  height={Math.max(0.5, h)}
                  rx={3}
                  fill="color-mix(in oklab, var(--stage-accent) 78%, transparent)"
                />
                <text
                  x={cx(i)}
                  y={y0 + (t >= 0 ? 14 : -6)}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--stage-muted)"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
          {/* running-total line + dots */}
          <polyline
            points={sums.map((s, i) => `${cx(i)},${yOf(s)}`).join(' ')}
            fill="none"
            stroke="var(--stage-good)"
            strokeWidth={2.5}
          />
          {sums.map((s, i) => (
            <circle key={i} cx={cx(i)} cy={yOf(s)} r={3} fill="var(--stage-good)" />
          ))}
        </svg>
      </div>

      <div className="statistics-formula-summary">
        <span>
          <Tex tex={termTex} />
        </span>
        <span className="statistics-sampling-accent">
          <Tex tex={`a_{${n}} = ${fnum(nthTerm(spec, n))}`} />
        </span>
        <span className="statistics-sampling-good">
          <Tex tex={`S_{${n}} = ${fnum(Sn)}`} />
        </span>
        {sInf != null ? (
          <span className="statistics-sampling-good">
            <Tex tex={`S_\\infty = ${fnum(sInf)}`} />
          </span>
        ) : (
          !isArith && (
            <span className="statistics-diverges">
              diverges (<Tex tex={'|r| \\ge 1'} />)
            </span>
          )
        )}
      </div>
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      <Field label="a₁" value={fnum(a1)}>
        <Slider value={a1} min={-5} max={10} step={0.5} onChange={setA1} ariaLabel="first term" />
      </Field>
      <Field label={isArith ? 'd' : 'r'} value={fnum(d)}>
        <Slider
          value={d}
          min={isArith ? -5 : -2}
          max={isArith ? 5 : 2}
          step={isArith ? 1 : 0.1}
          onChange={setD}
          ariaLabel={isArith ? 'common difference' : 'common ratio'}
        />
      </Field>
      <Field label="terms" value={n}>
        <Slider value={n} min={2} max={16} step={1} onChange={setN} ariaLabel="number of terms" />
      </Field>
    </div>
  );

  const footer = (
    <>
      <ChallengeCard questions={predictQ} state={ch} title="Predict first" />
      <p className="statistics-explanation">
        <Tex tex={sumTex} />
        {!isArith && (
          <>
            , with <Tex tex="|r| < 1" /> the tail shrinks to nothing, so the total converges.
          </>
        )}
      </p>
      <HintLadder hints={hints} />
    </>
  );

  return (
    <Activity.Root className="statistics-sequence-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Sequences and series"
          title={title}
          description={
            prompt ??
            'Change the generating rule and connect individual terms, running totals, and convergence in one linked view.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{k}</strong>
        <span>aₙ {fnum(nthTerm(spec, n))}</span>
        <span>Sₙ {fnum(Sn)}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Sequence terms and partial sums">{figure}</Activity.Canvas>
        <Activity.Inspector label="Sequence parameters">{controls}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {isArith
            ? 'A constant difference makes term heights change linearly while the running total curves.'
            : sInf != null
              ? `Because |r| < 1, the terms shrink and the running total approaches ${fnum(sInf)}.`
              : 'When |r| ≥ 1, the terms do not shrink to zero, so the infinite series cannot converge.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Sequence prediction and support">
        {footer}
      </section>
      <Activity.LiveRegion>
        {k} sequence with {n} terms. Term {n} is {fnum(nthTerm(spec, n))}; partial sum is {fnum(Sn)}
        {sInf != null
          ? `; infinite sum is ${fnum(sInf)}`
          : '; the series does not have a finite infinite sum'}
        .
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>
            {sInf != null ? 'Convergent series' : isArith ? 'Arithmetic growth' : 'Divergent series'}
          </strong>
          <span>{n} terms shown</span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
