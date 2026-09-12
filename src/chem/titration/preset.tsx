'use client';

/**
 * TitrationLab, add base to an acid drop by drop and watch the pH curve build, on
 * the shared `@classytic/stage/chem` acid–base kernel (pH solved exactly from the
 * charge balance at every volume).
 *
 * A burette of strong base drips into a flask of acid; the phenolphthalein indicator
 * stays colourless and flips pink past pH ≈ 8.3. The curve on the right shows the
 * signature shape: a gentle start, then for a WEAK acid a flat BUFFER region whose
 * midpoint sits at pH = pKa, a steep jump through the equivalence point, and a
 * levelling-off in excess base. A strong acid skips the buffer and crosses pH 7 at
 * equivalence; a weak acid's equivalence point is basic (pH > 7). Interactive, drag
 * the volume, no simulation loop.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { titrationCurve, pHAt, type TitrationSpec } from '@classytic/stage/chem';
import { Segmented, Slider } from '../../kit/controls.js';
import { Field, Readout } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { Tex } from '../../core/tex.js';
import {
  Figure,
  FigText,
  Glass,
  glassInner,
  Ball,
  Region,
  PlotFrame,
  Curve,
  Guide,
  Marker,
  HUE,
  STROKE,
} from '../../kit/figure/index.js';

/** The four volumes worth naming on the curve, each a multiple of the equivalence volume. */
const LANDMARKS = [
  { id: 'start', label: 'start', at: () => 0 },
  { id: 'half', label: '½ equivalence', at: (vEq: number) => vEq / 2 },
  { id: 'equivalence', label: 'equivalence', at: (vEq: number) => vEq },
  { id: 'excess', label: 'excess base', at: (vEq: number) => vEq * 1.5 },
] as const satisfies ReadonlyArray<{ id: string; label: string; at: (vEq: number) => number }>;

export interface TitrationProps {
  analyte?: 'strong-acid' | 'weak-acid';
  /** Acid concentration in the flask, mol/L (default 0.1). */
  concAcid?: number;
  /** Acid volume in the flask, mL (default 25). */
  volAcidMl?: number;
  /** Strong-base titrant concentration, mol/L (default 0.1). */
  concBase?: number;
  /** Weak-acid pKa (default 4.76 = acetic acid). */
  pKa?: number;
  /** Acid-base indicator used in the flask (default phenolphthalein). */
  indicator?: IndicatorKey;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Override the authored sequence/questions while preserving the acid-base model. */
  activity?: AuthoredActivity;
}

export type IndicatorKey = 'phenolphthalein' | 'bromothymol-blue' | 'methyl-orange';
interface IndicatorSpec {
  label: string;
  lowPH: number;
  highPH: number;
  acid: string;
  base: string;
}
/** Indicator colours are chemistry data (what the dye really looks like), not palette picks;
 *  phenolphthalein's acid form is colourless, so it shows the plain water role. */
const INDICATORS: Record<IndicatorKey, IndicatorSpec> = {
  phenolphthalein: {
    label: 'phenolphthalein',
    lowPH: 8.2,
    highPH: 10,
    acid: HUE.liquid,
    base: 'rgb(214,51,132)',
  },
  'bromothymol-blue': {
    label: 'bromothymol blue',
    lowPH: 6,
    highPH: 7.6,
    acid: 'rgb(244,205,58)',
    base: 'rgb(42,111,219)',
  },
  'methyl-orange': {
    label: 'methyl orange',
    lowPH: 3.1,
    highPH: 4.4,
    acid: 'rgb(218,55,49)',
    base: 'rgb(244,188,44)',
  },
};

const W = 700,
  H = 404;
function indicatorState(key: IndicatorKey, pH: number): { mix: number; color: string; description: string } {
  const item = INDICATORS[key];
  const mix = Math.max(0, Math.min(1, (pH - item.lowPH) / (item.highPH - item.lowPH)));
  const description = mix < 0.08 ? 'acid colour' : mix > 0.92 ? 'base colour' : 'transition colour';
  return {
    mix,
    color: `color-mix(in oklab, ${item.base} ${(mix * 100).toFixed(0)}%, ${item.acid})`,
    description,
  };
}

/** Predict the two facts the curve hides: pKa lives at the half-equivalence point, and a weak acid's equivalence point is basic. */
const TITRATION_CHALLENGE: AuthoredChoiceQuestion[] = [
  {
    id: 'half-eq',
    prompt: 'At the half-equivalence point of a weak acid, the pH equals…',
    choices: [
      { value: 'pka', label: 'pKa' },
      { value: 'seven', label: '7' },
      { value: 'pkw', label: '14 − pKa' },
    ],
    answer: 'pka',
    explain:
      'Half-neutralised means [A⁻] = [HA], so the Henderson–Hasselbalch log term is zero and pH = pKa.',
  },
  {
    id: 'equiv',
    prompt: 'The equivalence point of a weak acid titrated with strong base is…',
    choices: [
      { value: 'acidic', label: 'acidic (pH < 7)' },
      { value: 'neutral', label: 'neutral (pH = 7)' },
      { value: 'basic', label: 'basic (pH > 7)' },
    ],
    answer: 'basic',
    explain:
      'All acid is now its conjugate base, which hydrolyses water to give pH > 7. (A strong acid would cross pH 7.)',
  },
];
const STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Predict half-equivalence',
    lead: 'Commit before revealing the titration curve.',
    success: 'half-equivalence',
  },
  {
    id: 'act',
    phase: 'act',
    title: 'Build the curve',
    lead: 'Add base until the marker reaches the equivalence region.',
    reveal: ['model', 'evidence'],
    controls: true,
    success: 'equivalence-reached',
  },
  {
    id: 'observe',
    phase: 'observe',
    title: 'Read the chemical evidence',
    lead: 'Compare pH, indicator colour, and position on the curve.',
    reveal: ['model', 'evidence'],
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain weak-acid equivalence',
    lead: 'Use conjugate-base hydrolysis to classify the equivalence pH.',
    success: 'equivalence-explanation',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Compare acid strength',
    lead: 'Switch acid type and compare the curve and equivalence pH.',
    reveal: ['model', 'evidence'],
    controls: true,
    success: 'acid-compared',
  },
];

export function TitrationLab({
  analyte: analyte0 = 'weak-acid',
  concAcid = 0.1,
  volAcidMl = 25,
  concBase = 0.1,
  pKa: pKa0 = 4.76,
  indicator: indicator0 = 'phenolphthalein',
  title = 'Acid–base titration: build the pH curve',
  prompt = 'Drip strong base into the acid and track the pH. Watch the buffer region, the steep jump at the equivalence point, and the indicator flip pink.',
  objectives = [
    'Read a titration curve: start, buffer, equivalence jump, excess base',
    'For a weak acid, see the half-equivalence pH equals the pKa',
    'See the equivalence pH is 7 for a strong acid but >7 for a weak acid',
  ],
  activity,
}: TitrationProps = {}): ReactNode {
  const Ca = Math.max(0.001, concAcid),
    Va = Math.max(1, volAcidMl) / 1000,
    Cb = Math.max(0.001, concBase);
  const [analyte, setAnalyte] = useState<'strong-acid' | 'weak-acid'>(analyte0);
  const [pKa, setPKa] = useState(pKa0);
  const [indicator, setIndicator] = useState<IndicatorKey>(indicator0);
  const [vAddedMl, setVAddedMl] = useState(12);

  const spec: TitrationSpec = useMemo(() => ({ analyte, Ca, Va, Cb, pKa }), [analyte, Ca, Va, Cb, pKa]);
  const curve = useMemo(() => titrationCurve(spec), [spec]);
  const weak = analyte === 'weak-acid';
  const vEqMl = curve.vEq * 1000;
  const vMaxMl = vEqMl * 2;
  const vb = Math.min(vAddedMl, vMaxMl) / 1000;
  const pH = pHAt(spec, vb);

  // diagram coords: apparatus column on the left, the pH curve on the right
  const GX0 = 330,
    GX1 = 670,
    GY0 = 40,
    GY1 = 330;
  const PXv = (ml: number): number => GX0 + (ml / vMaxMl) * (GX1 - GX0);
  const PYp = (p: number): number => GY1 - (p / 14) * (GY1 - GY0);
  const curvePts: Array<[number, number]> = curve.points.map((pt) => [PXv(pt.v * 1000), PYp(pt.pH)]);

  const indicatorVisual = indicatorState(indicator, pH);
  const indicatorSpec = INDICATORS[indicator];
  const indicatorFits = curve.pHEq >= indicatorSpec.lowPH && curve.pHEq <= indicatorSpec.highPH;
  const region =
    vAddedMl < vEqMl * 0.04
      ? 'initial acid'
      : Math.abs(vAddedMl - vEqMl) < vEqMl * 0.04
        ? 'equivalence point'
        : vAddedMl > vEqMl
          ? 'excess base'
          : weak
            ? 'buffer region'
            : 'before equivalence';

  // apparatus: a burette of titrant above an Erlenmeyer flask of indicator solution
  const burX = 130,
    burTop = 30,
    burH = 176,
    burW = 30;
  const burInner = glassInner(burX - burW / 2, burTop, burW, burH, 'tube');
  const titFrac = Math.min(1, vAddedMl / vMaxMl); // fraction of the burette already delivered
  // burette reading: a volume v sits at inner.y + (v / vMax) · inner.h (0 at the top, as on a real burette)
  const burReading = (ml: number): number => burInner.y + (ml / vMaxMl) * burInner.h;
  const tipY = burTop + burH - STROKE.edge;
  const flaskX = 65,
    flaskW = 130,
    flaskTop = 242,
    flaskH = 134;
  const flaskFill = 0.3 + 0.28 * titFrac; // the flask fills a little as titrant is added
  const scaleTicks: Array<[number, string]> = [
    [0, '0'],
    [vMaxMl / 2, (vMaxMl / 2).toFixed(0)],
    [vMaxMl, vMaxMl.toFixed(0)],
  ];

  const figure = (
    <div
      className="chem-scene chem-titration-scene chem-wide-scene"
      role="region"
      aria-label="Titration apparatus and pH curve; scroll horizontally on a narrow screen"
      tabIndex={0}
    >
      <Figure
        viewBox={[W, H]}
        domain="chem"
        label={`Titration, ${vAddedMl.toFixed(1)} millilitres added, pH ${pH.toFixed(2)}, ${region}`}
      >
        {/* ── burette of strong base ── */}
        <FigText x={burX} y={20} anchor="middle" size="title">
          NaOH {Cb} M
        </FigText>
        <Glass
          x={burX - burW / 2}
          y={burTop}
          w={burW}
          h={burH}
          shape="tube"
          fill={1 - titFrac}
          liquid={HUE[1]}
          liquidOpacity={0.7}
          shadow={false}
        />
        {/* volume scale on the right wall */}
        {scaleTicks.map(([ml, text]) => (
          <g key={text}>
            <line
              x1={burX + burW / 2}
              y1={burReading(ml)}
              x2={burX + burW / 2 + 6}
              y2={burReading(ml)}
              stroke={HUE.soft}
              strokeWidth={STROKE.hair}
            />
            <FigText x={burX + burW / 2 + 10} y={burReading(ml)} baseline="middle" size="note" tone="soft">
              {text}
            </FigText>
          </g>
        ))}
        {/* stopcock tip + the drop on its way down */}
        <path d={`M ${burX - 5} ${tipY} H ${burX + 5} L ${burX} ${tipY + 12} Z`} fill={HUE.metal} />
        {vAddedMl < vMaxMl && <Ball cx={burX} cy={tipY + 26} r={3.5} color={HUE[1]} />}

        {/* ── Erlenmeyer flask; the liquid IS the indicator colour ── */}
        <Glass
          x={flaskX}
          y={flaskTop}
          w={flaskW}
          h={flaskH}
          shape="flask"
          fill={flaskFill}
          liquid={indicatorVisual.color}
          liquidOpacity={0.85}
          label={`${indicatorSpec.label} · ${indicatorVisual.description}`}
        />

        {/* ── pH curve ── */}
        <PlotFrame
          x={GX0}
          y={GY0}
          w={GX1 - GX0}
          h={GY1 - GY0}
          title="pH curve"
          xLabel="base added (mL)"
          yLabel="pH"
          arrows={false}
          xTicks={[
            { at: PXv(0), label: '0' },
            { at: PXv(vEqMl), label: vEqMl.toFixed(0) },
            { at: PXv(vMaxMl), label: vMaxMl.toFixed(0) },
          ]}
          yTicks={[0, 7, 14].map((p) => ({ at: PYp(p), label: String(p) }))}
        >
          {/* pH 7 reference (the y tick already names it) */}
          <Guide x1={GX1} y1={PYp(7)} x2={GX0} y2={PYp(7)} color={HUE.soft} />
          {/* buffer region (weak acid) with the half-equivalence landmark pH = pKa */}
          {weak && (
            <>
              <Region
                x={PXv(vEqMl * 0.15)}
                y={GY0 + 4}
                w={PXv(vEqMl * 0.85) - PXv(vEqMl * 0.15)}
                h={GY1 - GY0 - 4}
                color={HUE[3]}
                label="buffer"
              />
              <Guide
                x1={PXv(vEqMl / 2)}
                y1={GY1}
                x2={PXv(vEqMl / 2)}
                y2={PYp(curve.pHHalf)}
                color={HUE[3]}
                label="½ eq · pH = pKa"
                labelDy={-10}
              />
            </>
          )}
          <Curve points={curvePts} color={HUE[1]} />
          {/* equivalence point */}
          <Marker x={PXv(vEqMl)} y={PYp(curve.pHEq)} color={HUE[2]} label="equivalence" />
          {/* where the titration is now, wearing the indicator colour */}
          <Ball cx={PXv(vAddedMl)} cy={PYp(pH)} r={7} color={indicatorVisual.color} active />
        </PlotFrame>
      </Figure>
    </div>
  );

  const evidence = (
    <>
      <Readout
        value={<>pH {pH.toFixed(2)}</>}
        sub={
          <>
            {vAddedMl.toFixed(1)} mL added · {region}
          </>
        }
      />
      <div className="lab-metric-list">
        <div>
          <span>indicator</span>
          <strong>{indicatorSpec.label}</strong>
        </div>
        <div>
          <span>transition interval</span>
          <strong>
            pH {indicatorSpec.lowPH}–{indicatorSpec.highPH}
          </strong>
        </div>
        <div>
          <span>fit for this equivalence</span>
          <strong>{indicatorFits ? 'yes' : 'poor fit'}</strong>
        </div>
      </div>
      <div className="chem-explanation">
        {weak ? (
          <>
            <Tex tex={'\\text{pH} = \\text{p}K_a + \\log\\dfrac{[\\mathrm{A^-}]}{[\\mathrm{HA}]}'} block />
            <span>
              In the buffer region the pH barely moves, at the half-equivalence point [A⁻] = [HA] so{' '}
              <strong>pH = pKa = {pKa.toFixed(2)}</strong>. The equivalence point is{' '}
              <strong>basic (pH {curve.pHEq.toFixed(1)})</strong> because the conjugate base hydrolyses.
            </span>
          </>
        ) : (
          <>
            <Tex tex={'\\text{pH} = -\\log[\\mathrm{H^+}]'} block />
            <span>
              A strong acid is fully dissociated, so the pH climbs slowly then leaps through{' '}
              <strong>pH 7</strong> at the equivalence point and levels off in excess base.
            </span>
          </>
        )}
      </div>
    </>
  );

  const controls = (
    <>
      <Field label="acid in the flask">
        <Segmented
          ariaLabel="acid in the flask"
          value={analyte}
          onChange={setAnalyte}
          options={[
            { value: 'strong-acid', label: 'strong acid (HCl)' },
            { value: 'weak-acid', label: 'weak acid (CH₃COOH)' },
          ]}
        />
      </Field>
      {weak && (
        <Field label="pKa" value={pKa.toFixed(2)}>
          <Slider value={pKa} min={3} max={6} step={0.1} onChange={setPKa} ariaLabel="acid pKa" />
        </Field>
      )}
      <Field label="indicator">
        <Segmented
          ariaLabel="indicator"
          value={indicator}
          onChange={setIndicator}
          options={(Object.keys(INDICATORS) as IndicatorKey[]).map((item) => ({
            value: item,
            label: INDICATORS[item].label,
          }))}
        />
      </Field>
      <Field label="base added" value={`${vAddedMl.toFixed(1)} mL`}>
        <Slider
          value={vAddedMl}
          min={0}
          max={vMaxMl}
          step={0.5}
          onChange={setVAddedMl}
          ariaLabel="volume of base added (mL)"
        />
        {/* Landmarks jump the continuous slider to a named volume. Between them nothing is
            selected, so `''` is the value for "off a landmark" and is absent from `options`. */}
        <Segmented
          ariaLabel="titration landmarks"
          value={LANDMARKS.find((l) => Math.abs(vAddedMl - l.at(vEqMl)) < 0.1)?.id ?? ''}
          onChange={(id) => {
            const landmark = LANDMARKS.find((l) => l.id === id);
            if (landmark) setVAddedMl(landmark.at(vEqMl));
          }}
          options={LANDMARKS.map((l) => ({ value: l.id, label: l.label }))}
        />
      </Field>
    </>
  );

  const equivalenceReached = Math.abs(vAddedMl - vEqMl) <= Math.max(0.5, vEqMl * 0.04);
  const acidCompared = analyte !== analyte0;
  const runtimeActivity: AuthoredActivity = activity ?? {
    pattern: 'investigation',
    title,
    objectives,
    steps: STEPS,
    questions: TITRATION_CHALLENGE,
    success: [
      {
        id: 'half-equivalence',
        source: 'answer',
        key: 'half-eq',
        pendingLabel: 'Identify the pH at half-equivalence.',
      },
      {
        id: 'equivalence-reached',
        source: 'metric',
        key: 'equivalenceDistance',
        operator: 'between',
        min: -1,
        max: 1,
        pendingLabel: 'Move the base volume to the equivalence region.',
      },
      {
        id: 'equivalence-explanation',
        source: 'answer',
        key: 'equiv',
        pendingLabel: 'Classify a weak acid’s equivalence point.',
      },
      {
        id: 'acid-compared',
        source: 'metric',
        key: 'acidTypeChanged',
        operator: 'eq',
        value: true,
        pendingLabel: 'Switch acid type.',
      },
    ],
  };

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtimeActivity}
      activityId="titration"
      eyebrow="Acid-base chemistry"
      title={title}
      description={prompt}
      status={
        <>
          <span>pH {pH.toFixed(2)}</span>
          <span>{vAddedMl.toFixed(1)} mL</span>
          <span>{region}</span>
        </>
      }
      evidence={({ sequence }) => (sequence.shows('evidence') ? evidence : null)}
      controls={({ sequence }) => (sequence.current.controls ? controls : null)}
      observation={({ sequence }) =>
        sequence.shows('model')
          ? region === 'buffer region'
            ? 'In the buffer region each addition barely moves the pH: the weak acid and its conjugate base absorb the change.'
            : region === 'equivalence point'
              ? 'At equivalence the acid is exactly consumed, so one more drop swings the pH sharply.'
              : region === 'excess base'
                ? 'Past equivalence the pH is set by the excess base, so the curve flattens again.'
                : 'Before equivalence the acid still dominates; the pH climbs slowly as base is added.'
          : null
      }
      transcript={
        <p>
          {analyte === 'weak-acid' ? 'Weak acid' : 'Strong acid'} titrated with strong base.{' '}
          {vAddedMl.toFixed(1)} millilitres has been added, the pH is {pH.toFixed(2)}, and the experiment is
          in the {region}. Equivalence occurs at {vEqMl.toFixed(1)} millilitres with pH{' '}
          {curve.pHEq.toFixed(2)}. {indicatorSpec.label} changes across pH {indicatorSpec.lowPH} to{' '}
          {indicatorSpec.highPH} and is {indicatorFits ? 'a suitable' : 'a poor'} indicator for this curve.
        </p>
      }
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="equivalence-reached"
            met={sequence.current.id === 'act' && equivalenceReached}
            complete={complete}
          />
          <AuthoredMetricGate
            conditionId="acid-compared"
            met={sequence.current.id === 'transfer' && acidCompared}
            complete={complete}
          />
          {sequence.shows('model') ? (
            figure
          ) : (
            <p>Answer the prediction to reveal the titration apparatus and curve.</p>
          )}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
