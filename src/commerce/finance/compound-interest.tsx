'use client';

/**
 * CompoundInterestLab — why money "snowballs". On the shared @classytic/stage/finance
 * kernel: simple interest is a straight line (interest only on the original amount),
 * but compound interest CURVES UP because each year's interest itself earns interest.
 * The shaded gap between the two curves IS that "interest on interest".
 *
 * The analogy is made literal: a snowball whose area is the money, with a solid core =
 * your original deposit and a growing shell = the interest — so the green shell is the
 * pure earnings compounding built. Rule of 72 marks how fast it doubles. Everything is
 * AUTHORABLE (principal, rate, years, compounding frequency, currency) and
 * curriculum-neutral; ships a predict-first question. Interactive, no loop.
 */

import { useState, type ReactNode } from 'react';
import { compoundAmount, simpleInterest, rule72 } from '@classytic/stage/finance';
import { Slider, Segmented } from '../../kit/controls.js';
import { Field, Readout } from '../../kit/frame.js';
import { PlotChart } from '../../kit/finance-viz/plot-chart.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type {
  AuthoredActivity,
  AuthoredActivityStep,
  AuthoredChoiceQuestion,
} from '../../kit/activity-authoring.js';
import { Tex } from '../../core/tex.js';
import { EvidencePanel } from '../activity.js';

export interface CompoundInterestProps {
  principal?: number;
  /** Annual interest rate as a percentage (e.g. 8 = 8%). */
  ratePct?: number;
  years?: number;
  frequency?: 'annual' | 'monthly';
  currency?: string;
  /** Guided (default): the lesson builds in steps so each visual is introduced
   *  before the next. false = the everything-at-once explorer for embedding. */
  guided?: boolean;
  /** The authored step arc. Reveal LAYERS for this lab: 'compound', 'gap'. Question
   *  ids: 'longrun', 'gap'. Defaults to a 5-step arc; override to craft your own. */
  steps?: AuthoredActivityStep[];
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const SIMPLE = 'var(--stage-muted)';
const COMPOUND = 'var(--stage-accent, #3b82f6)';
const GAIN = 'var(--stage-good, #16a34a)';

// the default step arc — the author can override the whole thing via the `steps` prop
const DEFAULT_STEPS: AuthoredActivityStep[] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Predict long-run growth',
    lead: 'Compare how simple and compound interest treat previous earnings.',
    success: 'long-run',
  },
  {
    id: 'observe',
    phase: 'observe',
    title: 'Reveal compound growth',
    lead: 'Compare the curved compound path with the straight simple-interest path.',
    reveal: ['compound'],
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain the widening gap',
    lead: 'Interpret the shaded difference as interest earned on earlier interest.',
    reveal: ['compound', 'gap'],
    success: 'gap-growth',
  },
  {
    id: 'act',
    phase: 'act',
    title: 'Build a growth scenario',
    lead: 'Change at least one assumption and watch the curve and doubling time respond.',
    reveal: ['compound', 'gap', 'snowball'],
    controls: true,
    success: 'scenario-change',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Compare compounding policies',
    lead: 'Switch compounding frequency or change the horizon to test the model.',
    reveal: ['compound', 'gap', 'snowball'],
    controls: true,
  },
];
const EXPLORER_STEPS: AuthoredActivityStep[] = [
  {
    id: 'explore',
    phase: 'act',
    title: 'Explore compound growth',
    lead: 'Change the assumptions and compare every representation.',
    reveal: ['compound', 'gap', 'snowball'],
    controls: true,
  },
];

const QUESTIONS: AuthoredChoiceQuestion[] = [
  {
    id: 'longrun',
    prompt: 'Over a long time, compound interest compared with simple interest…',
    choices: [
      { value: 'ahead', label: 'pulls far ahead (interest earns interest)' },
      { value: 'same', label: 'stays about the same' },
      { value: 'behind', label: 'falls behind simple interest' },
    ],
    answer: 'ahead',
    explain:
      'Each year compound interest is paid on the interest already earned, so the gap over simple interest widens faster and faster.',
  },
  {
    id: 'gap',
    prompt: 'As the years go by, the gap between the compound and simple curves…',
    choices: [
      { value: 'grows', label: 'grows (accelerates)' },
      { value: 'const', label: 'stays a constant amount' },
      { value: 'shrinks', label: 'shrinks' },
    ],
    answer: 'grows',
    explain: 'The “interest on interest” compounds, so the shaded gap accelerates, that’s the snowball.',
  },
];

export function CompoundInterestLab({
  principal = 1000,
  ratePct = 8,
  years = 20,
  frequency = 'annual',
  currency = '$',
  title = 'Compound interest, the money snowball',
  prompt = 'Simple interest grows in a straight line; compound interest curves up because interest earns interest. Change the deposit, rate and time and watch the snowball.',
  objectives = [
    'Tell simple interest (straight line) from compound (curves up)',
    'See “interest on interest” as the widening gap between the two',
    'Estimate doubling time with the Rule of 72',
  ],
  guided = true,
  steps,
}: CompoundInterestProps = {}): ReactNode {
  const [P, setP] = useState(principal);
  const [rPct, setRPct] = useState(ratePct);
  const [Y, setY] = useState(years);
  const [freq, setFreq] = useState<'annual' | 'monthly'>(frequency);
  const changed = P !== principal || rPct !== ratePct || Y !== years || freq !== frequency;

  const r = rPct / 100,
    m = freq === 'monthly' ? 12 : 1;
  const fmt = (n: number): string => `${currency}${Math.round(n).toLocaleString('en-US')}`;
  const compoundAt = (y: number): number => compoundAmount(P, r, y, m);
  const simpleAt = (y: number): number => P + simpleInterest(P, r, y);
  const finalC = compoundAt(Y),
    finalS = simpleAt(Y);
  const maxA = finalC * 1.08 || 1;
  const doublingYrs = rule72(r);
  const yearlyInterest = P * r;

  const N = 60;

  // ── snowball: area = money, core = deposit, one ring PER DOUBLING ──
  // Only the rings that mean something: each marks the ball at ×2, ×4, … of
  // the deposit (the Rule-of-72 beats). Two or three readable rings beat
  // twenty decorative ones; a per-year lattice read as record grooves.
  const maxR = 72,
    cx = 110,
    cy = 86;
  const outerR = maxR;
  const innerR = Math.max(8, maxR * Math.sqrt(P / finalC));
  const multiple = finalC / P;
  const doublings: { r: number; label: string }[] = [];
  for (let a = 2 * P, k = 2; a < finalC * 0.96; a *= 2, k *= 2) {
    doublings.push({ r: maxR * Math.sqrt(a / finalC), label: `×${k}` });
  }

  const renderFigure = (showCompound: boolean, showGap: boolean, showSnowball: boolean): ReactNode => {
    const plot = (
      <PlotChart
        height={380}
        xMax={Y}
        yMax={maxA}
        yTicks={[0, maxA / 2, maxA]}
        formatY={fmt}
        xLabel={`${Y} years →`}
        guides={2 * P <= maxA ? [{ value: 2 * P, label: '2× your money', side: 'right' }] : []}
        legend={
          showCompound
            ? [
                { label: 'compound', color: COMPOUND },
                { label: 'simple', color: SIMPLE, dashed: true },
              ]
            : [{ label: 'simple', color: SIMPLE, dashed: true }]
        }
        ariaLabel={`Compound vs simple interest; ${fmt(P)} grows to ${fmt(finalC)} in ${Y} years`}
      >
        {({ X, Y: Yv }) => {
          const cPts = Array.from({ length: N + 1 }, (_, i) => {
            const yy = (i / N) * Y;
            return `${X(yy).toFixed(1)},${Yv(compoundAt(yy)).toFixed(1)}`;
          });
          const sPts = `${X(0).toFixed(1)},${Yv(P).toFixed(1)} ${X(Y).toFixed(1)},${Yv(finalS).toFixed(1)}`;
          // shaded "interest on interest" = between compound (top) and simple (bottom)
          const gap = `${cPts.join(' ')} ${X(Y).toFixed(1)},${Yv(finalS).toFixed(1)} ${X(0).toFixed(1)},${Yv(P).toFixed(1)}`;
          return (
            <>
              {showGap && <polygon points={gap} fill={GAIN} opacity={0.16} />}
              <polyline points={sPts} fill="none" stroke={SIMPLE} strokeWidth={2} strokeDasharray="5 4" />
              {showCompound && (
                <polyline
                  points={cPts.join(' ')}
                  fill="none"
                  stroke={COMPOUND}
                  strokeWidth={3}
                  strokeLinejoin="round"
                />
              )}
              {showCompound && (
                <circle
                  cx={X(Y)}
                  cy={Yv(finalC)}
                  r={5}
                  fill={COMPOUND}
                  stroke="var(--stage-bg)"
                  strokeWidth={2}
                />
              )}
            </>
          );
        }}
      </PlotChart>
    );

    // graph + snowball share the figure ROW (matched cards, no dead space under
    // the chart); the aside stays a tight readout + one concept panel.
    const snowball = (
      <div className="compound-snowball">
        <svg
          className="compound-snowball-svg"
          viewBox="0 0 220 190"
          width="100%"
          role="img"
          aria-label={`Your money grew ${multiple.toFixed(1)} times; each dashed ring marks a doubling of the deposit`}
        >
          <defs>
            <radialGradient id="ci-shell" cx="0.36" cy="0.3" r="0.9">
              <stop offset="0" stopColor={`color-mix(in oklab, ${GAIN} 26%, var(--stage-bg))`} />
              <stop offset="1" stopColor={`color-mix(in oklab, ${GAIN} 60%, var(--stage-bg))`} />
            </radialGradient>
            <radialGradient id="ci-core" cx="0.36" cy="0.3" r="0.95">
              <stop offset="0" stopColor={`color-mix(in oklab, ${COMPOUND} 72%, var(--stage-sheen))`} />
              <stop offset="1" stopColor={COMPOUND} />
            </radialGradient>
          </defs>
          <ellipse
            cx={cx}
            cy={cy + outerR + 6}
            rx={outerR * 0.72}
            ry={7}
            fill="var(--stage-fg)"
            opacity={0.08}
          />
          <circle
            className="finance-svg-animated"
            cx={cx}
            cy={cy}
            r={outerR}
            fill="url(#ci-shell)"
            stroke={GAIN}
            strokeWidth={1.5}
          />
          {doublings.map((d, i) => (
            <g key={i}>
              <circle
                className="finance-svg-animated"
                cx={cx}
                cy={cy}
                r={d.r}
                fill="none"
                stroke={GAIN}
                strokeWidth={1.5}
                strokeDasharray="2 5"
                opacity={0.75}
              />
              <text
                className="finance-svg-halo"
                x={cx}
                y={cy - d.r - 3}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill={GAIN}
              >
                {d.label}
              </text>
            </g>
          ))}
          <circle
            className="finance-svg-animated"
            cx={cx}
            cy={cy}
            r={innerR}
            fill="url(#ci-core)"
            stroke={`color-mix(in oklab, ${COMPOUND} 65%, var(--stage-bg))`}
            strokeWidth={1}
          />
          <ellipse
            cx={cx - outerR * 0.3}
            cy={cy - outerR * 0.42}
            rx={outerR * 0.24}
            ry={outerR * 0.13}
            fill="var(--stage-sheen)"
            opacity={0.16}
          />
          <text
            className="finance-svg-halo"
            data-emphasis="strong"
            x={cx}
            y={cy + 5}
            textAnchor="middle"
            fontSize={21}
            fontWeight={800}
            fill="var(--stage-fg)"
          >
            ×{multiple.toFixed(1)}
          </text>
          <text
            x={cx}
            y={cy + outerR + 20}
            textAnchor="middle"
            fontSize={10.5}
            fontWeight={600}
            fill="var(--stage-muted)"
          >
            core = deposit · each ring = money doubled
          </text>
        </svg>
      </div>
    );

    return (
      <div className="finance-figure-row">
        <div className="finance-plot-region">{plot}</div>
        {showSnowball && snowball}
      </div>
    );
  };

  // ── per-step aside: the STORY, told with this learner's numbers ──
  const y1 = P * (1 + r),
    y2 = y1 * (1 + r);
  const renderEvidence = (showCompound: boolean, showGap: boolean, showSnowball: boolean): ReactNode => (
    <EvidencePanel title="Growth evidence">
      {!showCompound ? (
        <Readout
          value={fmt(finalS)}
          sub={`after ${Y} yr of simple interest (the same ${fmt(yearlyInterest)} every year)`}
        />
      ) : (
        <Readout
          value={fmt(finalC)}
          sub={`after ${Y} yr · ${fmt(finalC - finalS)} more than simple · doubles ~every ${doublingYrs.toFixed(0)} yr`}
        />
      )}
      {!showCompound && (
        <div>
          <span className="finance-concept-stack">
            <span>
              You deposit <strong>{fmt(P)}</strong> at <strong>{rPct}%</strong>. Simple interest pays on the
              deposit only:
            </span>
            <span className="finance-concept-highlight">
              <strong>{fmt(yearlyInterest)} every year</strong>, no more, no less.
            </span>
            <span>That is the straight dashed line.</span>
          </span>
        </div>
      )}
      {showCompound && !showSnowball && (
        <div>
          <span className="finance-concept-stack">
            <span>
              Compound interest pays on the WHOLE balance, so each year's interest is bigger than the last:
            </span>
            <Tex tex={`\\text{yr 1: } ${P} \\times ${(1 + r).toFixed(2)} = ${Math.round(y1)}`} block />
            <Tex
              tex={`\\text{yr 2: } ${Math.round(y1)} \\times ${(1 + r).toFixed(2)} = ${Math.round(y2)}`}
              block
            />
            <span>
              Year 2 earned <strong>{fmt(y2 - y1)}</strong>, not {fmt(yearlyInterest)}: interest on interest.
            </span>
          </span>
        </div>
      )}
      {showSnowball && (
        <div>
          <span className="finance-concept-stack">
            <Tex tex={'A = P\\left(1 + \\tfrac{r}{m}\\right)^{mt}'} block />
            <span>
              The snowball: your money doubles about every {doublingYrs.toFixed(0)} years (Rule of 72), and
              each doubling is a bigger jump. Try the sliders.
            </span>
          </span>
        </div>
      )}
    </EvidencePanel>
  );

  const controls = (
    <>
      <Field label="deposit" value={fmt(P)}>
        <Slider value={P} min={100} max={1000000} step={100} onChange={setP} ariaLabel="principal deposit" />
      </Field>
      <Field label="rate" value={`${rPct}% / yr`}>
        <Slider
          value={rPct}
          min={1}
          max={20}
          step={0.5}
          onChange={setRPct}
          ariaLabel="annual interest rate percent"
        />
      </Field>
      <Field label="time" value={`${Y} yr`}>
        <Slider value={Y} min={1} max={40} step={1} onChange={setY} ariaLabel="years" />
      </Field>
      <Field label="compounding">
        <Segmented
          ariaLabel="compounding"
          value={freq}
          onChange={setFreq}
          options={[
            { value: 'annual', label: 'yearly' },
            { value: 'monthly', label: 'monthly' },
          ]}
        />
      </Field>
    </>
  );

  const activity: AuthoredActivity = {
    pattern: 'forecast',
    title,
    objectives,
    steps: steps ?? (guided ? DEFAULT_STEPS : EXPLORER_STEPS),
    questions: guided ? QUESTIONS : undefined,
    success: guided
      ? [
          {
            id: 'long-run',
            source: 'answer',
            key: 'longrun',
            pendingLabel: 'Predict the long-run relationship.',
          },
          { id: 'gap-growth', source: 'answer', key: 'gap', pendingLabel: 'Explain how the gap changes.' },
          {
            id: 'scenario-change',
            source: 'action',
            key: 'scenario',
            pendingLabel: 'Change at least one growth assumption.',
          },
        ]
      : undefined,
  };

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="compound-interest"
      eyebrow="Investment growth"
      title={title}
      description={prompt}
      status={({ sequence }) => (
        <>
          <span>
            {fmt(P)} at {rPct}%
          </span>
          <span>{Y} years</span>
          {sequence.shows('compound') && <span>{fmt(finalC)}</span>}
        </>
      )}
      evidence={({ sequence }) =>
        renderEvidence(sequence.shows('compound'), sequence.shows('gap'), sequence.shows('snowball'))
      }
      controls={({ sequence }) => (sequence.current.controls ? controls : null)}
      observation={({ sequence }) =>
        sequence.shows('gap')
          ? `Interest on interest contributes ${fmt(finalC - finalS)} beyond simple growth over ${Y} years.`
          : `Simple interest adds the same ${fmt(yearlyInterest)} each year; compound growth has not yet been revealed.`
      }
      transcript={`A ${fmt(P)} deposit at ${rPct}% for ${Y} years grows to ${fmt(finalS)} with simple interest and ${fmt(finalC)} with ${freq} compounding. The compound advantage is ${fmt(finalC - finalS)}, and the Rule of 72 estimates doubling in ${doublingYrs.toFixed(1)} years.`}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="scenario-change"
            met={sequence.current.id === 'act' && changed}
            complete={complete}
            outcome="growth scenario adjusted"
          />
          {renderFigure(sequence.shows('compound'), sequence.shows('gap'), sequence.shows('snowball'))}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
