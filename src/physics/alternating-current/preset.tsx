'use client';

/**
 * AlternatingCurrentLab, Cambridge A Level Physics 9702 chapter 21 (alternating currents).
 *
 * One circuit, a sinusoidal supply across a resistor, drawn beside one plot with three views:
 *
 *   waveform       v = V0 sin(2 pi f t) and i = v / R, the period T = 1/f and both peaks
 *   r.m.s.         v faint, v squared, the MEASURED mean of v squared, and V_rms = root of it
 *   rectification  one diode or a bridge, then a capacitor that turns ripple into a steady line
 *
 * The middle view is the point of the lab. Learners are handed V_rms = V0 / sqrt(2) as a fact and
 * usually guess it is an average of the wave. It is not: the mean of v over a cycle is zero. The
 * plot squares the wave first, so every value is positive, draws the mean of that square (a real
 * number added up by `meanSquareByIntegration`, not the formula), then takes the root. The result
 * is the steady d.c. voltage that would heat the same resistor at the same rate, and the readout
 * says so in watts.
 *
 * All the physics lives in `core.ts`, outside React and free of clocks and random numbers, so the
 * server and the browser draw identical paths.
 */

import { useState, type ReactNode } from 'react';
import {
  acPeriodS,
  acRectifiedTrace,
  acState,
  acWaveTrace,
  meanRectifiedVoltage,
  type AcSupply,
  type RectifierMode,
} from './core.js';
import { Field, Readout, Stat, StatList } from '../../kit/frame.js';
import { Segmented, Slider } from '../../kit/controls.js';
import { Tex } from '../../core/tex.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import {
  Area,
  Arrow,
  Ball,
  Block,
  Curve,
  FigText,
  Figure,
  Guide,
  HUE,
  Marker,
  PlotFrame,
  Track,
  fmt,
  scale,
} from '../../kit/figure/index.js';

export type AcView = 'waveform' | 'rms' | 'rectification';

// ── figure layout, in viewBox units ───────────────────────────────────────────
const W = 720;
const H = 400;
/** Two stacked plots share one time axis: ticks and the axis label sit on the lower one. */
const PLOT_TOP = { x: 322, y: 62, w: 376, h: 118 } as const;
const PLOT_BOT = { x: 322, y: 240, w: 376, h: 114 } as const;
/** The single tall plot the rectification view uses. */
const PLOT_ONE = { x: 322, y: 66, w: 376, h: 268 } as const;

// the circuit, drawn as one loop: supply on the left, load on the right
const LOOP = { left: 70, right: 252, top: 118, bottom: 298 } as const;
const SRC = { cx: 70, cy: 208, r: 24 } as const;
const RES = { x: 236, y: 176, w: 32, h: 64 } as const;
const RECT_X = 150;
const CAP_X = 206;

const V0_MIN = 5;
const V0_MAX = 400;
const F_MIN = 5;
const F_MAX = 200;
const R_MIN = 10;
const R_MAX = 500;
const C_MAX_UF = 5000;

type Pt = [number, number];

/**
 * Four significant figures, without trailing zeros. Four rather than three because the numbers
 * this lab is judged on are read directly: 229.8 V, not 230 V, and 1056 W, not 1060 W.
 */
const num = (value: number, digits = 4): string => Number(value.toPrecision(digits)).toString();

/**
 * A large V² value, grouped in threes so 52813 reads as 52 813.
 *
 * The value is settled to ten significant figures first. The measured mean square arrives from
 * Simpson's rule as 52812.499999999985 while the algebra gives exactly 52812.5, and rounding
 * those two straight to an integer would print 52 812 beside 52 813 in the same panel. The lab's
 * whole claim is that they are the SAME number, so the last few float bits must not show.
 */
const grouped = (value: number): string => {
  const settled = Number(value.toPrecision(10));
  const rounded = Math.abs(settled) >= 100 ? Math.round(settled) : Number(settled.toFixed(1));
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/** An axis tick with a real minus sign rather than a hyphen. */
const tick = (value: number, digits = 1): string =>
  value < 0 ? `−${fmt(-value, digits)}` : fmt(value, digits);

// ── circuit pieces, built from the figure kit only ────────────────────────────

function Wire({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }): ReactNode {
  return (
    <Curve
      points={[
        [x1, y1],
        [x2, y2],
      ]}
      color={HUE.metal}
      weight="edge"
    />
  );
}

/** The a.c. source symbol: a ring with one cycle of a sine drawn inside it. */
function AcSource({ cx, cy, r }: { cx: number; cy: number; r: number }): ReactNode {
  const ring = `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy}`;
  const wave: Pt[] = Array.from({ length: 33 }, (_, k) => {
    const u = k / 32;
    return [cx - r * 0.62 + u * r * 1.24, cy - Math.sin(u * 2 * Math.PI) * r * 0.4];
  });
  return (
    <>
      <Track d={ring} color={HUE.ink} weight="edge" dashed={false} />
      <Curve points={wave} color={HUE[1]} weight="line" />
    </>
  );
}

/**
 * A diode: the filled triangle points the way conventional current may pass, and the bar is the
 * wall it cannot pass backwards through. The triangle is an `Area` closed onto its own base, so
 * the schematic still uses nothing but figure-kit primitives.
 */
function Diode({ x, y, w, h }: { x: number; y: number; w: number; h: number }): ReactNode {
  const half = h / 2;
  return (
    <>
      <Area
        points={[
          [x, y - half],
          [x + w, y],
          [x, y + half],
        ]}
        baseY={y + half}
        color={HUE[1]}
        opacity={100}
      />
      <Curve
        points={[
          [x + w, y - half],
          [x + w, y + half],
        ]}
        color={HUE[1]}
        weight="edge"
      />
    </>
  );
}

// ── the authored activity ─────────────────────────────────────────────────────

const QUESTIONS: NonNullable<AuthoredActivity['questions']> = [
  {
    id: 'equal-heating',
    prompt:
      'A mains supply has a peak voltage of 325 V. A heater is plugged into it. Which steady d.c. voltage would make the same heater just as hot?',
    choices: [
      { value: '325', label: '325 V, the peak value' },
      { value: '230', label: 'about 230 V' },
      { value: '0', label: '0 V, because the mean of the wave is zero' },
      { value: '163', label: '163 V, half of the peak' },
    ],
    answer: '230',
    explain:
      'The supply spends most of the cycle below its peak, so 325 V of steady d.c. would be too hot. It is never at 0 V for long either. The matching steady value is 325 / sqrt(2) = 230 V, and that is what r.m.s. means.',
  },
  {
    id: 'why-root-two',
    prompt: 'Why is the r.m.s. voltage V0 / sqrt(2) rather than the average height of the wave?',
    choices: [
      {
        value: 'heating',
        label:
          'The mean of v is zero, so we square v first. V_rms is the root of the mean square, and it matches the heating.',
      },
      { value: 'average', label: 'It is the average height of the sine curve over one cycle.' },
      { value: 'half', label: 'It is half the peak, because the wave is negative for half the cycle.' },
    ],
    answer: 'heating',
    explain:
      'Power is v squared divided by R, so heating follows the square of the voltage. Square the wave, take the mean of that (it is V0 squared over 2), then take the root: V0 / sqrt(2).',
  },
];

const AC_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Alternating current: the value that does the heating',
  objectives: [
    'Read the period T and the peak value V0 from a sinusoidal supply',
    'Explain V_rms as the steady d.c. voltage that delivers the same mean power',
    'Calculate mean power as V_rms squared over R, which is V0 squared over 2R',
    'Describe how a diode and a smoothing capacitor turn a.c. into a nearly steady d.c.',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the steady voltage that matches',
      lead: 'Answer before you touch a slider.',
      success: 'predict-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Open the r.m.s. view',
      lead: 'Switch the view to r.m.s. The wave is squared, and the mean of that square is drawn as a line.',
      controls: true,
      reveal: ['model'],
      success: 'rms-opened',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Change the supply and watch the power',
      lead: 'Move the peak voltage or the resistance. Watch the mean power, and watch how V_rms keeps the same ratio to V0.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'supply-changed',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Say why the root of the mean square',
      lead: 'Choose the statement that matches what the two graphs show.',
      success: 'explain-answer',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Rectify and smooth it',
      lead: 'Switch to rectifying, then raise the capacitance until the ripple is small.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'smoothing-added',
    },
  ],
  questions: QUESTIONS,
  success: [
    {
      id: 'predict-answer',
      source: 'answer',
      key: 'equal-heating',
      operator: 'eq',
      value: '230',
      pendingLabel: 'Choose the steady d.c. voltage that heats the same.',
    },
    {
      id: 'rms-opened',
      source: 'metric',
      key: 'rmsOpened',
      operator: 'eq',
      value: true,
      pendingLabel: 'Switch the view to r.m.s.',
    },
    {
      id: 'supply-changed',
      source: 'metric',
      key: 'supplyChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change the peak voltage or the resistance.',
    },
    {
      id: 'explain-answer',
      source: 'answer',
      key: 'why-root-two',
      operator: 'eq',
      value: 'heating',
      pendingLabel: 'Say why we square the wave first.',
    },
    {
      id: 'smoothing-added',
      source: 'metric',
      key: 'smoothingAdded',
      operator: 'eq',
      value: true,
      pendingLabel: 'Switch to rectifying and add some capacitance.',
    },
  ],
};

export interface AlternatingCurrentProps {
  /** Peak voltage V0 of the supply, V. */
  peakVoltageV?: number;
  /** Frequency f of the supply, Hz. */
  frequencyHz?: number;
  /** Load resistance R, ohms. */
  resistanceOhm?: number;
  /** Smoothing capacitance across the load, microfarads. Zero means no capacitor. */
  capacitanceUf?: number;
  /** One diode (half-wave) or a bridge of four (full-wave). */
  rectifier?: RectifierMode;
  /** Which view opens first. */
  view?: AcView;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

export function AlternatingCurrentLab({
  peakVoltageV: peak0 = 325,
  frequencyHz: freq0 = 50,
  resistanceOhm: res0 = 50,
  capacitanceUf: cap0 = 1000,
  rectifier: rectifier0 = 'full',
  view: view0 = 'waveform',
  title = 'Alternating current: peak, r.m.s. and rectifying',
  prompt = 'A sinusoidal supply drives a resistor. The wave swings between +V0 and -V0, so its mean is zero, yet the resistor still gets hot. The r.m.s. view shows which value does the heating.',
  objectives,
  activity = 'alternating-current',
}: AlternatingCurrentProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'alternating-current';
  const authoredActivity = typeof activity === 'string' ? AC_ACTIVITY : activity;
  const [peakVoltage, setPeakVoltage] = useState(peak0);
  const [frequency, setFrequency] = useState(freq0);
  const [resistance, setResistance] = useState(res0);
  const [capacitanceUf, setCapacitanceUf] = useState(cap0);
  const [rectifier, setRectifier] = useState<RectifierMode>(rectifier0);
  const [view, setView] = useState<AcView>(view0);

  const supply: AcSupply = {
    peakVoltageV: peakVoltage,
    frequencyHz: frequency,
    resistanceOhm: resistance,
  };
  const state = acState(supply);
  const periodMs = acPeriodS(frequency) * 1000;
  const spanMs = 2 * periodMs;

  // ── the plots ──────────────────────────────────────────────────────────────
  const wave = acWaveTrace(supply, 2, 160);
  const timeTicks = [0, 0.5, 1, 1.5, 2].map((k) => k * periodMs);

  const scTop = scale(PLOT_TOP, [0, spanMs], [-1.15 * peakVoltage, 1.15 * peakVoltage]);
  const vPoints: Pt[] = wave.map((p) => [scTop.x(p.t * 1000), scTop.y(p.v)]);

  // waveform view: current on its own axis in amperes, same shape because R is constant
  const peakCurrent = state.peakCurrentA;
  const scCurrent = scale(PLOT_BOT, [0, spanMs], [-1.15 * peakCurrent, 1.15 * peakCurrent]);
  const iPoints: Pt[] = wave.map((p) => [scCurrent.x(p.t * 1000), scCurrent.y(p.i)]);

  // r.m.s. view: the square of the wave, and the mean that is added up from it
  const squareMax = peakVoltage * peakVoltage;
  const scSquare = scale(PLOT_BOT, [0, spanMs], [0, 1.15 * squareMax]);
  const squarePoints: Pt[] = wave.map((p) => [scSquare.x(p.t * 1000), scSquare.y(p.v * p.v)]);
  const meanSquareY = scSquare.y(state.meanSquareVoltageV2);

  // rectification view
  const capacitanceF = capacitanceUf / 1e6;
  const rectified = acRectifiedTrace({ supply, capacitanceF, rectifier, cycles: 2, samplesPerCycle: 180 });
  const scRect = scale(PLOT_ONE, [0, spanMs], [-1.12 * peakVoltage, 1.16 * peakVoltage]);
  const inputPoints: Pt[] = rectified.points.map((p) => [scRect.x(p.t * 1000), scRect.y(p.input)]);
  const rectifiedPoints: Pt[] = rectified.points.map((p) => [scRect.x(p.t * 1000), scRect.y(p.rectified)]);
  const outputPoints: Pt[] = rectified.points.map((p) => [scRect.x(p.t * 1000), scRect.y(p.output)]);
  const smoothing = capacitanceUf > 0;
  const barePeak = meanRectifiedVoltage(peakVoltage, rectifier);
  const rippleReadable = rectified.rippleV > 0.04 * peakVoltage;
  const rippleX = scRect.x(1.25 * periodMs);

  const isRect = view === 'rectification';
  const label =
    view === 'waveform'
      ? `A supply of peak ${num(peakVoltage)} volts at ${num(frequency)} hertz across ${num(resistance)} ohms. Voltage and current are plotted against time; the period is ${num(periodMs)} milliseconds and the peak current is ${num(peakCurrent)} amperes.`
      : view === 'rms'
        ? `The same supply, with the voltage above and the square of the voltage below. The mean of the square is ${grouped(state.meanSquareVoltageV2)} volts squared, and its square root, ${num(state.rmsVoltageV)} volts, is drawn on the voltage graph as the r.m.s. value.`
        : `The same supply through ${rectifier === 'half' ? 'one diode' : 'a bridge of four diodes'} with ${smoothing ? `a ${num(capacitanceUf)} microfarad smoothing capacitor` : 'no smoothing capacitor'}. The mean output is ${num(rectified.meanV)} volts with a ripple of ${num(rectified.rippleV)} volts.`;

  const circuit = (
    <>
      <FigText x={24} y={40} size="title">
        a.c. supply across R
      </FigText>

      {/* the loop */}
      <Wire x1={LOOP.left} y1={LOOP.top} x2={LOOP.left} y2={SRC.cy - SRC.r} />
      <Wire x1={LOOP.left} y1={SRC.cy + SRC.r} x2={LOOP.left} y2={LOOP.bottom} />
      <Wire x1={LOOP.left} y1={LOOP.bottom} x2={LOOP.right} y2={LOOP.bottom} />
      <Wire x1={LOOP.right} y1={LOOP.bottom} x2={LOOP.right} y2={RES.y + RES.h} />
      <Wire x1={LOOP.right} y1={RES.y} x2={LOOP.right} y2={LOOP.top} />

      {/* the top wire, broken where the rectifier sits */}
      {isRect ? (
        <>
          <Wire
            x1={LOOP.left}
            y1={LOOP.top}
            x2={rectifier === 'half' ? RECT_X - 16 : RECT_X - 32}
            y2={LOOP.top}
          />
          <Wire
            x1={rectifier === 'half' ? RECT_X + 16 : RECT_X + 32}
            y1={LOOP.top}
            x2={LOOP.right}
            y2={LOOP.top}
          />
          {rectifier === 'half' ? (
            <Diode x={RECT_X - 16} y={LOOP.top} w={32} h={26} />
          ) : (
            <Block x={RECT_X - 32} y={LOOP.top - 13} w={64} h={26} color={HUE[1]} label="bridge" radius={4} />
          )}
          <FigText x={RECT_X} y={LOOP.top - 22} anchor="middle" size="note" tone="soft">
            {rectifier === 'half' ? 'one diode' : '4 diodes'}
          </FigText>
        </>
      ) : (
        <Wire x1={LOOP.left} y1={LOOP.top} x2={LOOP.right} y2={LOOP.top} />
      )}

      {/* the smoothing capacitor, in parallel with the load */}
      {isRect && smoothing && (
        <>
          <Wire x1={CAP_X} y1={LOOP.top} x2={CAP_X} y2={192} />
          <Curve
            points={[
              [CAP_X - 16, 192],
              [CAP_X + 16, 192],
            ]}
            color={HUE[2]}
            weight="edge"
          />
          <Curve
            points={[
              [CAP_X - 16, 202],
              [CAP_X + 16, 202],
            ]}
            color={HUE[2]}
            weight="edge"
          />
          <Wire x1={CAP_X} y1={202} x2={CAP_X} y2={LOOP.bottom} />
          <Ball cx={CAP_X} cy={LOOP.top} r={3.5} color={HUE.metal} />
          <Ball cx={CAP_X} cy={LOOP.bottom} r={3.5} color={HUE.metal} />
          <FigText x={CAP_X - 20} y={201} anchor="end" baseline="middle" size="note" tone="hue-2">
            C
          </FigText>
        </>
      )}

      <AcSource cx={SRC.cx} cy={SRC.cy} r={SRC.r} />
      <FigText x={SRC.cx} y={258} anchor="middle" size="note" tone="soft">
        V₀ = {num(peakVoltage)} V
      </FigText>

      <Block {...RES} color={HUE[3]} label="R" radius={4} />
      <FigText x={RES.x + RES.w} y={258} anchor="end" size="note" tone="soft">
        R = {num(resistance)} Ω
      </FigText>

      {/* In the rectifying view the arrow stops short of the capacitor's lower junction dot. */}
      <Arrow
        x1={LOOP.left + 30}
        y1={LOOP.bottom}
        x2={isRect ? CAP_X - 30 : LOOP.right - 30}
        y2={LOOP.bottom}
        color={isRect ? HUE[2] : HUE.hot}
        weight="line"
        head={6}
        double={!isRect}
        label={isRect ? 'one way only' : 'i reverses'}
      />
    </>
  );

  const waveformPlots = (
    <>
      <PlotFrame
        {...PLOT_TOP}
        arrows={false}
        title="voltage against time"
        yLabel="v (V)"
        yTicks={[-peakVoltage, 0, peakVoltage].map((v) => ({ at: scTop.y(v), label: tick(v, 0) }))}
      >
        <Guide
          x1={PLOT_TOP.x}
          y1={scTop.y(0)}
          x2={PLOT_TOP.x + PLOT_TOP.w}
          y2={scTop.y(0)}
          color={HUE.soft}
        />
        <Curve points={vPoints} color={HUE[1]} />
        <Marker
          x={scTop.x(periodMs / 4)}
          y={scTop.y(peakVoltage)}
          r={4.5}
          color={HUE[1]}
          label={`V₀ = ${num(peakVoltage)} V`}
        />
        <Arrow
          x1={scTop.x(0)}
          y1={PLOT_TOP.y + PLOT_TOP.h - 5}
          x2={scTop.x(periodMs)}
          y2={PLOT_TOP.y + PLOT_TOP.h - 5}
          color={HUE.hot}
          weight="line"
          head={6}
          double
          label={`T = ${num(periodMs)} ms`}
          labelSide="right"
        />
      </PlotFrame>

      <PlotFrame
        {...PLOT_BOT}
        arrows={false}
        title="current against time"
        xLabel="time (ms)"
        yLabel="i (A)"
        xTicks={timeTicks.map((v) => ({ at: scCurrent.x(v), label: fmt(v, 1) }))}
        yTicks={[-peakCurrent, 0, peakCurrent].map((v) => ({ at: scCurrent.y(v), label: tick(v, 2) }))}
      >
        <Guide
          x1={PLOT_BOT.x}
          y1={scCurrent.y(0)}
          x2={PLOT_BOT.x + PLOT_BOT.w}
          y2={scCurrent.y(0)}
          color={HUE.soft}
        />
        <Curve points={iPoints} color={HUE[2]} />
        <Marker
          x={scCurrent.x(periodMs / 4)}
          y={scCurrent.y(peakCurrent)}
          r={4.5}
          color={HUE[2]}
          label={`I₀ = ${num(peakCurrent)} A`}
        />
      </PlotFrame>
    </>
  );

  const rmsPlots = (
    <>
      <PlotFrame
        {...PLOT_TOP}
        arrows={false}
        title="the wave, and the level that heats the same"
        yLabel="v (V)"
        yTicks={[-peakVoltage, 0, peakVoltage].map((v) => ({ at: scTop.y(v), label: tick(v, 0) }))}
      >
        <Guide
          x1={PLOT_TOP.x}
          y1={scTop.y(0)}
          x2={PLOT_TOP.x + PLOT_TOP.w}
          y2={scTop.y(0)}
          color={HUE.soft}
        />
        <Curve points={vPoints} color={HUE[1]} opacity={0.4} />
        <Guide
          x1={PLOT_TOP.x}
          y1={scTop.y(state.rmsVoltageV)}
          x2={PLOT_TOP.x + PLOT_TOP.w}
          y2={scTop.y(state.rmsVoltageV)}
          color={HUE.hot}
          label={`V_rms = ${num(state.rmsVoltageV)} V`}
          labelAnchor="end"
        />
        <Guide
          x1={PLOT_TOP.x}
          y1={scTop.y(-state.rmsVoltageV)}
          x2={PLOT_TOP.x + PLOT_TOP.w}
          y2={scTop.y(-state.rmsVoltageV)}
          color={HUE.hot}
        />
        <FigText x={PLOT_TOP.x + 8} y={scTop.y(0) - 7} size="note" tone="soft">
          the mean of v is zero
        </FigText>
      </PlotFrame>

      <FigText x={PLOT_BOT.x} y={206} size="label" tone="hot">
        √({grouped(state.meanSquareVoltageV2)} V²) = {num(state.rmsVoltageV)} V, the line above
      </FigText>

      {/* No y-axis label here: the tick labels already carry V₀², and a rotated caption would
          sit on top of them. */}
      <PlotFrame
        {...PLOT_BOT}
        arrows={false}
        title="square it first: v² (V²) is never negative"
        xLabel="time (ms)"
        xTicks={timeTicks.map((v) => ({ at: scSquare.x(v), label: fmt(v, 1) }))}
        yTicks={[
          { at: scSquare.y(0), label: '0' },
          { at: meanSquareY, label: 'V₀²/2' },
          { at: scSquare.y(squareMax), label: 'V₀²' },
        ]}
      >
        <Area points={squarePoints} baseY={PLOT_BOT.y + PLOT_BOT.h} color={HUE[2]} opacity={20} />
        <Curve points={squarePoints} color={HUE[2]} />
        <Guide
          x1={PLOT_BOT.x}
          y1={meanSquareY}
          x2={PLOT_BOT.x + PLOT_BOT.w}
          y2={meanSquareY}
          color={HUE.hot}
          label={`mean of v² = ${grouped(state.meanSquareVoltageV2)} V²`}
          labelAnchor="end"
        />
      </PlotFrame>
    </>
  );

  const rectificationPlot = (
    <PlotFrame
      {...PLOT_ONE}
      arrows={false}
      title={`voltage across R: ${rectifier === 'half' ? 'one diode' : 'bridge'}${smoothing ? ` + ${num(capacitanceUf)} µF` : ', no capacitor'}`}
      xLabel="time (ms)"
      yLabel="v (V)"
      xTicks={timeTicks.map((v) => ({ at: scRect.x(v), label: fmt(v, 1) }))}
      yTicks={[-peakVoltage, 0, peakVoltage].map((v) => ({ at: scRect.y(v), label: tick(v, 0) }))}
    >
      <Guide
        x1={PLOT_ONE.x}
        y1={scRect.y(0)}
        x2={PLOT_ONE.x + PLOT_ONE.w}
        y2={scRect.y(0)}
        color={HUE.soft}
      />
      <Curve points={inputPoints} color={HUE.soft} weight="line" dashed opacity={0.5} />
      {smoothing && <Curve points={rectifiedPoints} color={HUE[1]} weight="line" opacity={0.45} />}
      <Curve points={outputPoints} color={HUE[2]} />
      <Guide
        x1={PLOT_ONE.x}
        y1={scRect.y(rectified.meanV)}
        x2={PLOT_ONE.x + PLOT_ONE.w}
        y2={scRect.y(rectified.meanV)}
        color={HUE.warn}
        label={`mean = ${num(rectified.meanV)} V`}
        labelAnchor="end"
      />
      {rippleReadable && (
        <>
          <Arrow
            x1={rippleX}
            y1={scRect.y(rectified.maxV)}
            x2={rippleX}
            y2={scRect.y(rectified.minV)}
            color={HUE.hot}
            weight="line"
            head={6}
            double
          />
          {/* Below the lower end of the arrow: a sideways label would land on the mean line. */}
          <FigText x={rippleX + 8} y={scRect.y(rectified.minV) + 16} size="note" tone="hot">
            ripple {num(rectified.rippleV)} V
          </FigText>
        </>
      )}
      <FigText x={PLOT_ONE.x + 8} y={scRect.y(-0.72 * peakVoltage)} size="note" tone="soft">
        supply before the diodes
      </FigText>
    </PlotFrame>
  );

  const figure = (
    <Figure viewBox={[W, H]} domain="physics" label={label}>
      {circuit}
      {view === 'waveform' && waveformPlots}
      {view === 'rms' && rmsPlots}
      {view === 'rectification' && rectificationPlot}
    </Figure>
  );

  const evidence =
    view === 'waveform' ? (
      <>
        <Readout
          label="one whole cycle"
          value={`T = ${num(periodMs)} ms`}
          sub="T = 1/f. The supply repeats this pattern f times every second."
        />
        <StatList>
          <Stat label="frequency f" value={`${num(frequency)} Hz`} />
          <Stat label="peak voltage V₀" value={`${num(peakVoltage)} V`} />
          <Stat label="peak current I₀ = V₀/R" value={`${num(peakCurrent)} A`} />
          <Stat label="resistance R" value={`${num(resistance)} Ω`} />
        </StatList>
        <div className="physics-probe">
          <strong className="physics-equation-result">
            <Tex
              tex={`i(t)=\\frac{v(t)}{R}=\\frac{${num(peakVoltage)}\\sin(2\\pi\\times ${num(frequency)}\\,t)}{${num(resistance)}}`}
            />
          </strong>
          <small>
            R does not change during the cycle, so i is just v scaled down. The two curves cross zero together
            and peak together.
          </small>
        </div>
      </>
    ) : view === 'rms' ? (
      <>
        <Readout
          label="the value that does the heating"
          value={`V_rms = ${num(state.rmsVoltageV)} V`}
          sub={`A steady ${num(state.rmsVoltageV)} V d.c. across the same ${num(resistance)} Ω would deliver exactly the same mean power.`}
        />
        <StatList>
          <Stat label="mean of v², added up" value={`${grouped(state.meanSquareVoltageV2)} V²`} />
          <Stat label="V₀²/2, from the algebra" value={`${grouped(state.meanSquareExactV2)} V²`} />
          <Stat label="I_rms = V_rms/R" value={`${num(state.rmsCurrentA)} A`} />
          <Stat label="mean power P" value={`${num(state.meanPowerW)} W`} tone="good" />
          <Stat label="peak power (twice the mean)" value={`${num(state.peakPowerW)} W`} />
        </StatList>
        <div className="physics-probe">
          <strong className="physics-equation-result">
            <Tex
              tex={`V_{rms}=\\sqrt{\\overline{v^2}}=\\frac{V_0}{\\sqrt2}=${num(state.rmsVoltageV)}\\,\\mathrm{V}\\qquad P=\\frac{V_{rms}^2}{R}=\\frac{V_0^2}{2R}=${num(state.meanPowerW)}\\,\\mathrm{W}`}
            />
          </strong>
          <small>
            Both stats above are the same number: one is counted off the graph, the other comes from the
            algebra. That agreement is the whole proof.
          </small>
        </div>
      </>
    ) : (
      <>
        <Readout
          label="output across R"
          value={`mean ${num(rectified.meanV)} V, ripple ${num(rectified.rippleV)} V`}
          sub={
            smoothing
              ? `The capacitor holds the voltage up between peaks. R C = ${num(rectified.timeConstantS * 1000)} ms against a gap of ${num(1000 / rectified.rippleFrequencyHz)} ms.`
              : 'With no capacitor the output falls to zero after every peak, so the ripple is the full peak value.'
          }
        />
        <StatList>
          <Stat label="ripple frequency" value={`${num(rectified.rippleFrequencyHz)} Hz`} />
          <Stat
            label={rectifier === 'half' ? 'mean with no capacitor, V₀/π' : 'mean with no capacitor, 2V₀/π'}
            value={`${num(barePeak)} V`}
          />
          <Stat label="capacitance C" value={`${num(capacitanceUf)} µF`} />
          <Stat label="time constant R C" value={`${num(rectified.timeConstantS * 1000)} ms`} />
        </StatList>
        <div className="physics-probe">
          <strong className="physics-equation-result">
            <Tex
              tex={
                rectifier === 'half'
                  ? `\\overline{v_{out}}=\\frac{V_0}{\\pi}=${num(barePeak)}\\,\\mathrm{V}`
                  : `\\overline{v_{out}}=\\frac{2V_0}{\\pi}=${num(barePeak)}\\,\\mathrm{V}`
              }
            />
          </strong>
          <small>
            That is the mean HEIGHT of the rectified wave, not an r.m.s. value. A capacitor raises the mean
            towards V₀ by filling in the gaps.
          </small>
        </div>
      </>
    );

  const controls = (
    <>
      <Field label="view">
        <Segmented
          ariaLabel="view"
          value={view}
          onChange={setView}
          options={[
            { value: 'waveform', label: 'waveform' },
            { value: 'rms', label: 'r.m.s.' },
            { value: 'rectification', label: 'rectifying' },
          ]}
        />
      </Field>
      <Field label="peak voltage" value={`${num(peakVoltage)} V`}>
        <Slider
          value={peakVoltage}
          min={V0_MIN}
          max={V0_MAX}
          step={5}
          onChange={setPeakVoltage}
          ariaLabel="peak voltage in volts"
        />
      </Field>
      <Field label="frequency" value={`${num(frequency)} Hz`}>
        <Slider
          value={frequency}
          min={F_MIN}
          max={F_MAX}
          step={5}
          onChange={setFrequency}
          ariaLabel="frequency in hertz"
        />
      </Field>
      <Field label="resistance" value={`${num(resistance)} Ω`}>
        <Slider
          value={resistance}
          min={R_MIN}
          max={R_MAX}
          step={10}
          onChange={setResistance}
          ariaLabel="resistance in ohms"
        />
      </Field>
      {isRect && (
        <Field label="rectifier">
          <Segmented
            ariaLabel="rectifier"
            value={rectifier}
            onChange={setRectifier}
            options={[
              { value: 'half', label: 'one diode' },
              { value: 'full', label: 'bridge' },
            ]}
          />
        </Field>
      )}
      {isRect && (
        <Field label="capacitance" value={`${num(capacitanceUf)} µF`}>
          <Slider
            value={capacitanceUf}
            min={0}
            max={C_MAX_UF}
            step={100}
            onChange={setCapacitanceUf}
            ariaLabel="smoothing capacitance in microfarads"
          />
        </Field>
      )}
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Alternating currents"
      title={title}
      description={prompt}
      status={
        <>
          <span>V₀ {num(peakVoltage)} V</span>
          <span>V_rms {num(state.rmsVoltageV)} V</span>
          <span>P {num(state.meanPowerW)} W</span>
        </>
      }
      evidence={evidence}
      controls={controls}
      observation={
        view === 'waveform'
          ? 'The supply takes T seconds to complete one cycle, and T = 1/f. The current curve is the voltage curve divided by R, so both reach zero together and both reach their peak together.'
          : view === 'rms'
            ? 'The lower graph is the upper one squared, so it never goes below zero. Its mean sits at exactly half of V₀², whatever V₀ is. Take the square root of that mean and you get V_rms, the steady d.c. voltage that would heat this resistor at the same rate.'
            : 'The diodes remove the negative halves, so the current in R now flows one way only. The capacitor charges to the peak and then leaks slowly through R, so the output sags a little between peaks instead of falling to zero. More capacitance, or more resistance, means less ripple.'
      }
      transcript={
        <p>
          Peak {num(peakVoltage)} V at {num(frequency)} Hz across {num(resistance)} Ω. Period {num(periodMs)}{' '}
          ms, peak current {num(peakCurrent)} A. Mean of v² is {grouped(state.meanSquareVoltageV2)} V², so
          V_rms is {num(state.rmsVoltageV)} V and the mean power is {num(state.meanPowerW)} W. Rectified by{' '}
          {rectifier === 'half' ? 'one diode' : 'a bridge'} with {num(capacitanceUf)} µF: mean{' '}
          {num(rectified.meanV)} V, ripple {num(rectified.rippleV)} V at {num(rectified.rippleFrequencyHz)}{' '}
          Hz.
        </p>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="rms-opened" met={view === 'rms'} complete={complete} />
          <AuthoredMetricGate
            conditionId="supply-changed"
            met={peakVoltage !== peak0 || resistance !== res0}
            complete={complete}
          />
          <AuthoredMetricGate
            conditionId="smoothing-added"
            met={isRect && capacitanceUf > 0}
            complete={complete}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
