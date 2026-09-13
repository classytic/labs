'use client';

/**
 * StressStrainLab, Cambridge A Level Physics 9702 chapter 6 (deformation of solids).
 *
 * A wire hangs from a clamp and carries a load. The learner picks the material, the diameter,
 * the original length and the load, and reads the extension. Beside the wire sits ONE plot with
 * two modes, and the contrast between them is the entire lesson:
 *
 *   force against extension   gradient k = A E / L   moves when the wire's SIZE changes
 *   stress against strain     gradient E             does not move: E belongs to the MATERIAL
 *
 * The invariance is structural, not cosmetic. The stress-strain curve and both of its axis
 * ranges come from `core.ts` functions that never receive the diameter or the length, so the
 * line is drawn from identical numbers for a thin wire and a thick one. The learner can swing
 * the force-extension line all over the frame, switch mode, and find the stress-strain line
 * exactly where they left it.
 *
 * The physics (materials, the model curve, the energy) lives in `core.ts`, outside React.
 */

import { useState, type ReactNode } from 'react';
import {
  MATERIALS,
  material,
  limitStrain,
  plotStrainMax,
  plotStressMax,
  stressStrainCurve,
  wireState,
  type CurvePoint,
  type MaterialId,
} from './core.js';
import { Field, Readout, Stat, StatList } from '../../kit/frame.js';
import { ActivitySelect, Segmented, Slider } from '../../kit/controls.js';
import { Tex } from '../../core/tex.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import {
  Area,
  Arrow,
  Block,
  Curve,
  FigText,
  Figure,
  Guide,
  HUE,
  Marker,
  PlotFrame,
  fmt,
  scale,
} from '../../kit/figure/index.js';

export type StressStrainGraph = 'force-extension' | 'stress-strain';

// ── figure layout, in viewBox units ───────────────────────────────────────────
const W = 720;
const H = 380;
const PLOT = { x: 322, y: 62, w: 344, h: 236 } as const;
const WIRE_X = 152;
const WIRE_TOP = 46;
const LEN_MIN = 0.5;
const LEN_MAX = 3;
const DIA_MIN = 0.1;
const DIA_MAX = 2;

type Pt = [number, number];

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Unicode superscript for a signed integer exponent, so readouts can print 6.74 × 10⁻⁴. */
const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function sup(exponent: number): string {
  const digits = String(Math.abs(exponent))
    .split('')
    .map((d) => SUPERSCRIPT[Number(d)] ?? d)
    .join('');
  return (exponent < 0 ? '⁻' : '') + digits;
}

/** "6.74 × 10⁻⁴" for a readout. */
function sciText(value: number, digits = 2): string {
  if (!Number.isFinite(value) || value === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(value)));
  return `${(value / 10 ** e).toFixed(digits)} × 10${sup(e)}`;
}

/** "6.74\times10^{-4}" for KaTeX. */
function sciTex(value: number, digits = 2): string {
  if (!Number.isFinite(value) || value === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(value)));
  return `${(value / 10 ** e).toFixed(digits)}\\times 10^{${e}}`;
}

/** Three significant figures, without trailing zeros. */
const num = (value: number, digits = 3): string => Number(value.toPrecision(digits)).toString();

/** Round tick values from 0 up to `max`, aiming for about `target` of them. */
function axisTicks(max: number, target = 5): number[] {
  if (!(max > 0)) return [];
  const raw = max / target;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = (([1, 2, 2.5, 5, 10].find((s) => s * magnitude >= raw) ?? 10) as number) * magnitude;
  const out: number[] = [];
  for (let i = 1; i * step <= max * 1.0001; i++) out.push(i * step);
  return out;
}

/**
 * Keep a rising curve inside the plot box, cutting it exactly at the edge it leaves through.
 * Both plotted quantities increase together, so one pass is enough.
 */
function clipRising(points: readonly Pt[], xMax: number, yMax: number): Pt[] {
  const out: Pt[] = [];
  for (const p of points) {
    if (p[0] <= xMax && p[1] <= yMax) {
      out.push(p);
      continue;
    }
    const prev = out[out.length - 1];
    if (prev) {
      const tx = p[0] > xMax ? (xMax - prev[0]) / (p[0] - prev[0] || 1) : 1;
      const ty = p[1] > yMax ? (yMax - prev[1]) / (p[1] - prev[1] || 1) : 1;
      const t = clamp(Math.min(tx, ty), 0, 1);
      out.push([prev[0] + (p[0] - prev[0]) * t, prev[1] + (p[1] - prev[1]) * t]);
    }
    break;
  }
  return out;
}

const QUESTIONS: NonNullable<AuthoredActivity['questions']> = [
  {
    id: 'invariance',
    prompt:
      'You keep the same material but swap to a thinner wire. On the stress and strain graph, the line will…',
    choices: [
      { value: 'same', label: 'stay exactly where it is' },
      { value: 'steeper', label: 'become steeper' },
      { value: 'shallower', label: 'become less steep' },
    ],
    answer: 'same',
    explain:
      'Stress is force divided by area. Strain is extension divided by original length. Both numbers already take the size of the wire into account. Only the material is left, so the gradient stays at E.',
  },
  {
    id: 'gradient',
    prompt: 'The gradient of the stress and strain graph is the Young modulus E. Which statement is true?',
    choices: [
      { value: 'material', label: 'E belongs to the material, so every steel wire gives the same E' },
      { value: 'wire', label: 'E belongs to the wire, so a thicker wire has a larger E' },
      { value: 'load', label: 'E depends on the load you hang on the wire' },
    ],
    answer: 'material',
    explain:
      'E = stress / strain. A thicker wire carries more force, but it also has more area, so the stress is unchanged. A longer wire stretches further, but it also has more original length, so the strain is unchanged.',
  },
];

const STRESS_STRAIN_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Stress and strain: the graph that ignores the wire',
  objectives: [
    'Read the spring constant k as the gradient of a force against extension graph',
    'Read the Young modulus E as the gradient of a stress against strain graph',
    'Explain why changing the diameter or the length moves one graph and not the other',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict what a thinner wire does',
      lead: 'Commit to an answer before you touch a slider.',
      success: 'invariance-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Change the wire, watch the force line swing',
      lead: 'Change the diameter or the original length. Watch the gradient of the force against extension line.',
      controls: true,
      reveal: ['model'],
      success: 'wire-changed',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Switch to stress and strain',
      lead: 'Switch the graph. The wire has changed, so check whether this line has moved.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'graph-switched',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the gradient',
      lead: 'Say what the gradient of each graph belongs to.',
      success: 'gradient-answer',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Change the material',
      lead: 'Now change the material. This is the one change that does move the stress and strain line.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'material-changed',
    },
  ],
  questions: QUESTIONS,
  success: [
    {
      id: 'invariance-answer',
      source: 'answer',
      key: 'invariance',
      operator: 'eq',
      value: 'same',
      pendingLabel: 'Predict what a thinner wire does to the stress and strain line.',
    },
    {
      id: 'wire-changed',
      source: 'metric',
      key: 'wireChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change the diameter or the original length.',
    },
    {
      id: 'graph-switched',
      source: 'metric',
      key: 'graphSwitched',
      operator: 'eq',
      value: true,
      pendingLabel: 'Switch to the other graph.',
    },
    {
      id: 'gradient-answer',
      source: 'answer',
      key: 'gradient',
      operator: 'eq',
      value: 'material',
      pendingLabel: 'Say what the Young modulus belongs to.',
    },
    {
      id: 'material-changed',
      source: 'metric',
      key: 'materialChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Choose a different material.',
    },
  ],
};

export interface StressStrainProps {
  /** Which material the wire is made of. */
  material?: MaterialId;
  /** Wire diameter, mm. */
  diameterMm?: number;
  /** Original (unstretched) length, m. */
  lengthM?: number;
  /** Load hung on the wire, N. */
  loadN?: number;
  /** Which graph opens first. */
  graph?: StressStrainGraph;
  /** Top of the force axis, N. Also the largest load the learner can hang. */
  loadAxisN?: number;
  /** Right-hand end of the extension axis, mm. */
  extensionAxisMm?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

export function StressStrainLab({
  material: material0 = 'steel',
  diameterMm: diameter0 = 0.6,
  lengthM: length0 = 2,
  loadN: load0 = 40,
  graph: graph0 = 'force-extension',
  loadAxisN = 100,
  extensionAxisMm = 5,
  title = 'Stress, strain and the Young modulus',
  prompt = 'A wire stretches when you load it. The force against extension graph describes this one wire. The stress against strain graph describes the material it is made of. Change the wire and see which graph moves.',
  objectives,
  activity = 'stress-strain',
}: StressStrainProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'stress-strain';
  const authoredActivity = typeof activity === 'string' ? STRESS_STRAIN_ACTIVITY : activity;
  const [materialId, setMaterialId] = useState<MaterialId>(material0);
  const [diameter, setDiameter] = useState(diameter0);
  const [length, setLength] = useState(length0);
  const [load, setLoad] = useState(load0);
  const [graph, setGraph] = useState<StressStrainGraph>(graph0);

  const mat = material(materialId);
  const state = wireState({ material: mat, diameterMm: diameter, lengthM: length, loadN: load });
  const isStrain = graph === 'stress-strain';
  // A snapped wire cannot carry more than its breaking stress, so the point on the graph stops
  // at the break even though the learner is still hanging a bigger load on it.
  const heldStress = state.broken ? mat.limitStress : state.stressPa;
  const heldLoad = heldStress * state.areaM2;

  // ── the plot, in DATA units ────────────────────────────────────────────────
  // stress-strain: x = strain × 10⁻³, y = stress in MPa. Neither uses the diameter or the
  // length, which is exactly why this curve does not move.
  // force-extension: x = extension in mm, y = force in N. Both use them.
  const toData = (p: CurvePoint): Pt =>
    isStrain ? [p.strain * 1000, p.stress / 1e6] : [p.strain * length * 1000, p.stress * state.areaM2];
  const xMax = isStrain ? plotStrainMax(mat) * 1000 : extensionAxisMm;
  const yMax = isStrain ? plotStressMax(mat) / 1e6 : loadAxisN;
  const sc = scale(PLOT, [0, xMax], [0, yMax]);
  const baseY = PLOT.y + PLOT.h;
  const px = (p: Pt): Pt => [sc.x(p[0]), sc.y(p[1])];

  const samples = stressStrainCurve(mat);
  const curve = clipRising(samples.map(toData), xMax, yMax);
  const nowData: Pt = isStrain
    ? [state.strain * 1000, heldStress / 1e6]
    : [state.extensionM * 1000, heldLoad];
  const filled = clipRising(
    [...samples.filter((p) => p.stress < heldStress).map(toData), nowData],
    xMax,
    yMax,
  );
  const nowOnPlot = nowData[0] <= xMax && nowData[1] <= yMax;

  // The straight line the wire WOULD follow if it stayed proportional for ever. Drawn past the
  // bend so the learner can see the real curve fall away from it.
  const elasticEnd = isStrain
    ? plotStrainMax(mat) * 1.2
    : Math.max(xMax / (length * 1000), yMax / (state.areaM2 * mat.E)) * 1.05;
  const elastic = clipRising(
    [[0, 0], toData({ strain: elasticEnd, stress: elasticEnd * mat.E })],
    xMax,
    yMax,
  );

  const limitData: Pt = toData({ strain: limitStrain(mat), stress: mat.limitStress });
  const limitOnPlot = limitData[0] <= xMax && limitData[1] <= yMax;
  const limitPx = px(limitData);
  // "limit of proportionality" is about 130 units wide at note size; flip it when it would
  // run past the right-hand end of the plot.
  const limitRoom = limitPx[0] + 9 + 132 < PLOT.x + PLOT.w;

  // ── the wire itself ────────────────────────────────────────────────────────
  const wirePx = 2 + ((clamp(diameter, DIA_MIN, DIA_MAX) - DIA_MIN) / (DIA_MAX - DIA_MIN)) * 8;
  const lengthPx = 100 + ((clamp(length, LEN_MIN, LEN_MAX) - LEN_MIN) / (LEN_MAX - LEN_MIN)) * 70;
  const restBottom = WIRE_TOP + lengthPx;
  // The extension is under a millimetre in the interesting cases, so the picture exaggerates it.
  const extPx = clamp(state.extensionM * 1000 * 6, 0, 26);
  const fallenY = restBottom + 26;
  const breakY = WIRE_TOP + lengthPx * 0.5;
  const loadTop = state.broken ? fallenY : restBottom + extPx;

  const figure = (
    <Figure
      viewBox={[W, H]}
      domain="physics"
      label={`A ${mat.label} wire of diameter ${num(diameter)} millimetres and original length ${num(length)} metres carries ${num(load)} newtons and extends ${num(state.extensionM * 1000)} millimetres. The graph shows ${isStrain ? 'stress against strain' : 'force against extension'}.`}
    >
      <FigText x={24} y={24} size="title">
        {mat.label} wire under load
      </FigText>

      {/* clamp at the top */}
      <Block x={88} y={30} w={128} h={14} color={HUE.metal} radius={3} />

      {/* original length */}
      <Arrow x1={100} y1={WIRE_TOP} x2={100} y2={restBottom} color={HUE.soft} weight="line" head={5} double />
      <FigText x={94} y={(WIRE_TOP + restBottom) / 2} anchor="end" baseline="middle" size="note" tone="soft">
        L = {length.toFixed(1)} m
      </FigText>

      {state.broken ? (
        <>
          <Block
            x={WIRE_X - wirePx / 2}
            y={WIRE_TOP}
            w={wirePx}
            h={breakY - WIRE_TOP}
            color={HUE.metal}
            radius={1}
          />
          <Block
            x={WIRE_X - wirePx / 2}
            y={breakY + 16}
            w={wirePx}
            h={fallenY - breakY - 16}
            color={HUE.metal}
            radius={1}
          />
          <FigText x={WIRE_X + 14} y={breakY + 8} size="note" tone="hot">
            it snapped
          </FigText>
        </>
      ) : (
        <>
          <Block
            x={WIRE_X - wirePx / 2}
            y={WIRE_TOP}
            w={wirePx}
            h={restBottom + extPx - WIRE_TOP}
            color={HUE.metal}
            radius={1}
          />
          {/* where the bottom of the wire sat before the load went on */}
          <Guide x1={WIRE_X - 64} y1={restBottom} x2={WIRE_X + 64} y2={restBottom} color={HUE.soft} />
          {extPx > 0.5 && (
            <>
              {/* clear of the load block, so the callout never sits on top of it */}
              <Arrow
                x1={WIRE_X + 42}
                y1={restBottom}
                x2={WIRE_X + 42}
                y2={restBottom + Math.max(extPx, 11)}
                color={HUE[2]}
                weight="line"
                head={5}
              />
              <FigText
                x={WIRE_X + 49}
                y={restBottom + Math.max(extPx, 11) / 2}
                baseline="middle"
                size="note"
                tone="hue-2"
              >
                x = {num(state.extensionM * 1000)} mm
              </FigText>
            </>
          )}
        </>
      )}

      <FigText x={WIRE_X + wirePx / 2 + 10} y={WIRE_TOP + 26} size="note" tone="soft">
        d = {diameter.toFixed(2)} mm
      </FigText>

      <Block x={WIRE_X - 31} y={loadTop} w={62} h={30} color={HUE[3]} label="load" radius={4} />
      <Arrow x1={WIRE_X} y1={loadTop + 30} x2={WIRE_X} y2={loadTop + 64} color={HUE.hot} weight="edge" />
      <FigText x={WIRE_X + 14} y={loadTop + 52} baseline="middle" size="note" tone="hot">
        F = {num(load)} N
      </FigText>

      {/* ── the graph ── */}
      <PlotFrame
        {...PLOT}
        arrows={false}
        title={isStrain ? 'stress against strain: gradient = E' : 'force against extension: gradient = k'}
        xLabel={isStrain ? 'strain ε (×10⁻³)' : 'extension x (mm)'}
        yLabel={isStrain ? 'stress σ (MPa)' : 'force F (N)'}
        xTicks={axisTicks(xMax).map((v) => ({ at: sc.x(v), label: fmt(v, 2) }))}
        yTicks={axisTicks(yMax).map((v) => ({ at: sc.y(v), label: fmt(v, 2) }))}
      >
        {filled.length > 1 && <Area points={filled.map(px)} baseY={baseY} color={HUE[2]} opacity={26} />}
        {elastic.length > 1 && <Curve points={elastic.map(px)} color={HUE.soft} dashed weight="line" />}
        {curve.length > 1 && <Curve points={curve.map(px)} color={HUE[1]} />}
        {limitOnPlot && (
          <>
            <Guide x1={limitPx[0]} y1={baseY} x2={limitPx[0]} y2={limitPx[1]} color={HUE.warn} />
            <Marker x={limitPx[0]} y={limitPx[1]} r={4.5} color={HUE.warn} />
            {/* Below and to the right of the knee: the one pocket that is empty for a rising
                curve, whichever way the wire swings the line. Flipped when it would overrun. */}
            <FigText
              x={limitPx[0] + (limitRoom ? 9 : -9)}
              y={limitPx[1] + 17}
              anchor={limitRoom ? 'start' : 'end'}
              size="note"
              tone="hot"
            >
              {mat.brittle ? 'it breaks here' : 'limit of proportionality'}
            </FigText>
          </>
        )}
        {nowOnPlot && <Marker x={sc.x(nowData[0])} y={sc.y(nowData[1])} r={5} color={HUE[1]} />}
        {!isStrain && filled.length > 1 && (
          <FigText x={PLOT.x + PLOT.w - 8} y={PLOT.y + 14} anchor="end" size="note" tone="hue-2">
            shaded area = Eₚ = {num(state.energyJ)} J
          </FigText>
        )}
        {!nowOnPlot && (
          <FigText
            x={PLOT.x + PLOT.w - 8}
            y={PLOT.y + (isStrain ? 14 : 32)}
            anchor="end"
            size="note"
            tone="hot"
          >
            this load is off the scale
          </FigText>
        )}
      </PlotFrame>
    </Figure>
  );

  const evidence = (
    <>
      <Readout
        label="gradient of this graph"
        value={isStrain ? `E = ${num(mat.E / 1e9)} GPa` : `k = ${sciText(state.springConstantNPerM)} N/m`}
        sub={
          isStrain
            ? 'The Young modulus. It is the same for every wire made of this material.'
            : 'The spring constant of this wire only. k = A E / L, so it changes with the diameter and the length.'
        }
      />
      <StatList>
        <Stat label="area A = πd²/4" value={`${sciText(state.areaM2)} m²`} />
        <Stat label="stress σ = F/A" value={`${num(state.stressPa / 1e6)} MPa`} />
        <Stat label="strain ε = x/L" value={sciText(state.strain)} />
        <Stat label="extension x" value={`${num(state.extensionM * 1000)} mm`} />
        <Stat
          label="elastic energy Eₚ"
          value={`${num(state.energyJ)} J`}
          tone={state.beyondLimit ? 'warn' : undefined}
        />
      </StatList>
      <div className="physics-probe">
        <strong className="physics-equation-result">
          <Tex
            tex={
              isStrain
                ? `E=\\frac{\\sigma}{\\varepsilon}=\\frac{${sciTex(state.stressPa)}}{${sciTex(state.strain)}}=${sciTex(mat.E)}\\,\\mathrm{Pa}`
                : `k=\\frac{AE}{L}=\\frac{${sciTex(state.areaM2)}\\times ${sciTex(mat.E)}}{${num(length)}}=${sciTex(state.springConstantNPerM)}\\,\\mathrm{N/m}`
            }
          />
        </strong>
        <small>
          {state.beyondLimit
            ? 'Past the limit of proportionality the line bends, so this ratio no longer holds.'
            : isStrain
              ? 'Below the limit of proportionality, stress divided by strain is a constant: the Young modulus.'
              : 'The stiffer, thicker or shorter the wire, the larger k is.'}
        </small>
      </div>
      <p className="physics-explain">
        {state.broken ? (
          <>
            Glass has no plastic region. The line stays straight, then the wire snaps at{' '}
            {num(mat.limitStress / 1e6)} MPa. The energy stored just before the break was {num(state.energyJ)}{' '}
            J.
          </>
        ) : state.beyondLimit ? (
          <>
            The load has taken the wire past the limit of proportionality, so the shaded area is no longer
            ½Fx. The wire will stay stretched when you take the load off.
          </>
        ) : (
          <>
            The shaded area under the force against extension graph is the elastic potential energy,{' '}
            {num(state.energyJ)} J. It equals ½Fx only here, in the straight part of the graph.
          </>
        )}
      </p>
    </>
  );

  const controls = (
    <>
      <Field label="material">
        <ActivitySelect
          ariaLabel="material"
          value={materialId}
          onChange={setMaterialId}
          options={MATERIALS.map((m) => ({ value: m.id, label: m.label }))}
        />
      </Field>
      <Field label="graph">
        <Segmented
          ariaLabel="graph"
          value={graph}
          onChange={setGraph}
          options={[
            { value: 'force-extension', label: 'force and extension' },
            { value: 'stress-strain', label: 'stress and strain' },
          ]}
        />
      </Field>
      <Field label="diameter" value={`${diameter.toFixed(2)} mm`}>
        <Slider
          value={diameter}
          min={DIA_MIN}
          max={DIA_MAX}
          step={0.05}
          onChange={setDiameter}
          ariaLabel="wire diameter in millimetres"
        />
      </Field>
      <Field label="original length" value={`${length.toFixed(1)} m`}>
        <Slider
          value={length}
          min={LEN_MIN}
          max={LEN_MAX}
          step={0.1}
          onChange={setLength}
          ariaLabel="original length in metres"
        />
      </Field>
      <Field label="load" value={`${num(load)} N`}>
        <Slider
          value={load}
          min={0}
          max={loadAxisN}
          step={1}
          onChange={setLoad}
          ariaLabel="load in newtons"
        />
      </Field>
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Deformation of solids"
      title={title}
      description={prompt}
      status={
        <>
          <span>{mat.label}</span>
          <span>x {num(state.extensionM * 1000)} mm</span>
          <span>{state.broken ? 'snapped' : state.beyondLimit ? 'past the limit' : 'proportional'}</span>
        </>
      }
      evidence={evidence}
      controls={controls}
      observation={
        isStrain
          ? 'Dividing the force by the area and the extension by the original length removes the size of the wire. Only the material is left, so this line holds still while you change the diameter and the length. Its gradient is the Young modulus E.'
          : 'This line belongs to one wire. A thicker or shorter wire is stiffer, so the line swings up. The gradient is k = A E / L, and A and L are both yours to change.'
      }
      transcript={
        <p>
          A {mat.label} wire, diameter {num(diameter)} mm, original length {num(length)} m, carries{' '}
          {num(load)} N. Stress {num(state.stressPa / 1e6)} MPa, strain {sciText(state.strain)}, extension{' '}
          {num(state.extensionM * 1000)} mm. Spring constant {sciText(state.springConstantNPerM)} N/m; Young
          modulus {num(mat.E / 1e9)} GPa. {mat.note}
        </p>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="wire-changed"
            met={diameter !== diameter0 || length !== length0}
            complete={complete}
          />
          <AuthoredMetricGate conditionId="graph-switched" met={graph !== graph0} complete={complete} />
          <AuthoredMetricGate
            conditionId="material-changed"
            met={materialId !== material0}
            complete={complete}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
