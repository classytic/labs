'use client';

/**
 * TemperatureScalesLab, one temperature, three rulers. A single mercury column is
 * read off the Celsius, Fahrenheit and Kelvin scales side by side, so you SEE that
 * they're the same physical thing measured with differently-placed zeros and
 * differently-sized degrees:
 *
 *   • Celsius   , 0 at water's freezing point, 100 at its boiling point
 *   • Fahrenheit, F = (9/5)C + 32  (smaller degrees, offset zero)
 *   • Kelvin    , K = C + 273.15, starting at ABSOLUTE ZERO, where molecular
 *     motion stops, so Kelvin never goes negative (that's why science uses it)
 *
 * Drag the temperature or jump to a fixed point; all three readouts and the marked
 * fixed-point lines update together. Interactive, no simulation. Pure SVG, themed.
 */

import { useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { ActivitySelect, Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { thermalColor } from '../../kit/thermal.js';
import { Tex } from '../../core/tex.js';
import { ResetTransport, SceneSurface } from '../mechanics/presentation.js';
import { ThermalActivity } from '../thermal/activity.js';
import { DiagramLabel } from '../../kit/annotate.js';

export interface TemperatureScalesProps {
  /** Initial Celsius reading. */
  initialC?: number;
  /** Authorable quick-jump temperatures for the lesson. */
  presets?: TemperaturePreset[];
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

export interface TemperaturePreset {
  c: number;
  label: string;
}

const W = 600,
  H = 340;
const C_MIN = -273.15,
  C_MAX = 120;
const Y_TOP = 52,
  Y_BOT = 260; // mercury column range (px)
const TX = 88; // thermometer centre x
const toF = (c: number): number => (c * 9) / 5 + 32;
const toK = (c: number): number => c + 273.15;
const yOf = (c: number): number => Y_BOT - ((c - C_MIN) / (C_MAX - C_MIN)) * (Y_BOT - Y_TOP);

// scale columns (well-separated lanes so the fixed-point numbers never crowd)
const COLS: {
  x: number;
  name: string;
  val: (c: number) => number;
  unit: string;
}[] = [
  { x: 230, name: '°C', val: (c) => c, unit: '°' },
  { x: 365, name: '°F', val: toF, unit: '°' },
  { x: 500, name: 'K', val: toK, unit: '' },
];
const LINE_X0 = 150,
  LINE_X1 = 550;

const FIXED = [
  { c: -273.15, label: 'absolute zero', short: 'abs 0' },
  { c: 0, label: 'water freezes', short: 'ice' },
  { c: 37, label: 'body temp', short: 'body' },
  { c: 100, label: 'water boils', short: 'boil' },
];
const DEFAULT_PRESETS: TemperaturePreset[] = [
  { c: -273.15, label: 'absolute zero' },
  { c: 0, label: 'ice' },
  { c: 25, label: 'room' },
  { c: 37, label: 'body' },
  { c: 100, label: 'boiling' },
];

export function TemperatureScalesLab({
  initialC = 25,
  presets = DEFAULT_PRESETS,
  title = 'Temperature scales: one heat, three rulers',
  prompt = 'Celsius, Fahrenheit and Kelvin measure the same temperature with different zeros and degree sizes. Drag it and watch all three, and see why Kelvin starts at absolute zero.',
  objectives = [
    'Convert between °C, °F and K: F = 9⁄5·C + 32, K = C + 273.15',
    'Place the fixed points (freezing 0/32/273, boiling 100/212/373)',
    'Explain why Kelvin is absolute, it starts where motion stops, so it’s never negative',
  ],
  activity,
}: TemperatureScalesProps = {}): ReactNode {
  const [c, setC] = useState(initialC);
  const f = toF(c),
    k = toK(c);
  const frac = Math.max(0, Math.min(1, (c - C_MIN) / (C_MAX - C_MIN)));
  const col = thermalColor(frac);
  const stemW = 22,
    bulbR = 18,
    bulbCy = Y_BOT + 20;
  const yC = yOf(c);

  const figure = (
    <SceneSurface className="physics-temperature-scales-scene">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`${c.toFixed(0)} Celsius, ${f.toFixed(0)} Fahrenheit, ${k.toFixed(0)} Kelvin`}
      >
        {/* fixed-point rows: a faint line, a short tag in the left gutter, and each
            scale's value centred under its column, all static, so nothing crowds */}
        {FIXED.map((fp) => {
          const y = yOf(fp.c);
          const nearLiveReading = Math.abs(y - yC) < 18;
          return (
            <g key={fp.c}>
              <line
                x1={LINE_X0}
                y1={y}
                x2={LINE_X1}
                y2={y}
                stroke="var(--stage-grid)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              {!nearLiveReading && (
                <>
                  <text
                    x={LINE_X0 - 6}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={11}
                    fontWeight={650}
                    fill="var(--stage-muted)"
                  >
                    {fp.short}
                  </text>
                  {COLS.map((col) => (
                    <text
                      className="physics-svg-numeric"
                      key={col.name}
                      x={col.x}
                      y={y + 4}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={650}
                      fill="var(--stage-muted)"
                    >
                      {Math.round(col.val(fp.c))}
                      {col.unit}
                    </text>
                  ))}
                </>
              )}
            </g>
          );
        })}
        {/* column headers */}
        {COLS.map((col) => (
          <text
            key={col.name}
            x={col.x}
            y={Y_TOP - 20}
            textAnchor="middle"
            fontSize={12}
            fontWeight={750}
            fill="var(--stage-fg)"
          >
            {col.name}
          </text>
        ))}
        {/* thermometer: glass + mercury */}
        <rect
          x={TX - stemW / 2}
          y={Y_TOP - 6}
          width={stemW}
          height={bulbCy - Y_TOP + 6}
          rx={stemW / 2}
          fill="var(--stage-bg)"
          stroke="var(--stage-metal)"
          strokeWidth={2.5}
        />
        <circle cx={TX} cy={bulbCy} r={bulbR} fill={col} stroke="var(--stage-metal)" strokeWidth={2.5} />
        <rect x={TX - stemW / 2 + 4} y={yC} width={stemW - 8} height={bulbCy - yC} fill={col} />
        <rect
          x={TX - stemW / 2 + 5}
          y={Y_TOP}
          width={3}
          height={bulbCy - Y_TOP - 2}
          rx={1.5}
          fill="color-mix(in oklab, var(--stage-sheen, #fff) 50%, transparent)"
        />
        {/* current level: ONE line from the mercury across all three rulers, with the live
            reading shown as a chip ON each ruler, so "one heat → three numbers" is literal
            (no separate floating card to duplicate the aside). */}
        <line x1={TX + stemW / 2} y1={yC} x2={LINE_X1} y2={yC} stroke={col} strokeWidth={2} />
        {COLS.map((co) => {
          const v = Math.round(co.val(c));
          return (
            <g key={`live-${co.name}`}>
              <rect
                x={co.x - 25}
                y={yC - 11}
                width={50}
                height={22}
                rx={6}
                fill="var(--card, var(--stage-bg))"
                stroke={col}
                strokeWidth={1.5}
              />
              <DiagramLabel
                className="physics-svg-numeric"
                x={co.x}
                y={yC}
                text={`${v}${co.unit}`}
                fontSize={11.5}
                fontWeight={750}
                halo={false}
                bounds={{ left: 8, right: W - 8, top: 8, bottom: H - 8 }}
              />
            </g>
          );
        })}
      </svg>
    </SceneSurface>
  );

  // nearest fixed point note
  const near = FIXED.reduce((a, b) => (Math.abs(b.c - c) < Math.abs(a.c - c) ? b : a));
  const atFixed = Math.abs(near.c - c) < 1;
  // ONE panel: live readout → formulas → why-Kelvin, consistent treatment throughout.
  const aside = (
    <>
      <div className="physics-probe">
        <span>Same temperature</span>
        <strong>{c.toFixed(1)} °C</strong>
        <small>
          {f.toFixed(1)} °F · {k.toFixed(1)} K{atFixed ? ` · ${near.label}` : ''}
        </small>
      </div>
      <div className="physics-thermal-model">
        <span className="physics-thermal-laws">
          <Tex tex={'F = \\tfrac{9}{5}\\,C + 32'} block />
          <Tex tex={'K = C + 273.15'} block />
        </span>
        <p className="physics-explain">
          <strong className="physics-emphasis">Why Kelvin?</strong> It starts at absolute zero (−273.15 °C),
          where molecules stop moving, so K is never negative and doubling it really doubles the energy. C and
          F just put their zeros at handy everyday points.
        </p>
      </div>
    </>
  );

  const controls = (
    <>
      <>
        <Field label="temperature" value={`${c.toFixed(0)} °C`}>
          <Slider
            value={c}
            min={-273}
            max={120}
            step={1}
            onChange={setC}
            ariaLabel="temperature in Celsius"
          />
        </Field>
      </>
      <>
        <Field label="jump to">
          <ActivitySelect
            ariaLabel="jump to"
            value={presets.find((p) => Math.abs(p.c - c) < 0.6)?.label ?? '__custom'}
            onChange={(label) => {
              const p = presets.find((q) => q.label === label);
              if (p) setC(p.c);
            }}
            options={[
              { value: '__custom', label: `${c.toFixed(0)} °C · custom`, disabled: true },
              ...presets.map((p) => ({ value: p.label, label: p.label })),
            ]}
          />
        </Field>
      </>
    </>
  );

  const reset = (): void => setC(initialC);
  return (
    <ThermalActivity
      activity={activity}
      className="physics-temperature-scales"
      title={title}
      prompt={prompt}
      status={
        <>
          <strong>{atFixed ? near.label : 'Between fixed points'}</strong>
          <span>{c.toFixed(0)} °C</span>
          <span>{f.toFixed(0)} °F</span>
          <span>{k.toFixed(0)} K</span>
        </>
      }
      figure={figure}
      instruments={aside}
      controls={controls}
      feedback="One physical temperature intersects all three rulers. Only the zero point and size of each degree change."
      objectives={objectives}
      transport={
        <ResetTransport
          onReset={reset}
          state={`${c.toFixed(0)} °C`}
          detail={`${f.toFixed(0)} °F · ${k.toFixed(0)} K`}
          resetLabel="Reset temperature"
        />
      }
      canvasLabel="Thermometer aligned with Celsius, Fahrenheit, and Kelvin scales"
      inspectorLabel="Conversions, fixed points, and temperature control"
    />
  );
}
