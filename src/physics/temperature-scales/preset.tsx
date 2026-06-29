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
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { thermalColor } from '../../kit/thermal.js';
import { Tex } from '../../core/tex.js';

export interface TemperatureScalesProps {
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const W = 470, H = 430;
const C_MIN = -273.15, C_MAX = 120;
const Y_TOP = 60, Y_BOT = 352;                       // mercury column range (px)
const TX = 96;                                       // thermometer centre x
const toF = (c: number): number => (c * 9) / 5 + 32;
const toK = (c: number): number => c + 273.15;
const yOf = (c: number): number => Y_BOT - ((c - C_MIN) / (C_MAX - C_MIN)) * (Y_BOT - Y_TOP);

// scale columns (well-separated lanes so the fixed-point numbers never crowd)
const COLS: { x: number; name: string; val: (c: number) => number; unit: string }[] = [
  { x: 200, name: '°C', val: (c) => c, unit: '°' },
  { x: 308, name: '°F', val: toF, unit: '°' },
  { x: 410, name: 'K', val: toK, unit: '' },
];
const LINE_X0 = 152, LINE_X1 = 440;

const FIXED = [
  { c: -273.15, label: 'absolute zero', short: 'abs 0' },
  { c: 0, label: 'water freezes', short: 'ice' },
  { c: 37, label: 'body temp', short: 'body' },
  { c: 100, label: 'water boils', short: 'boil' },
];
const PRESETS = [
  { c: -273.15, label: 'absolute zero' },
  { c: 0, label: 'ice' },
  { c: 25, label: 'room' },
  { c: 37, label: 'body' },
  { c: 100, label: 'boiling' },
];

export function TemperatureScalesLab({
  title = 'Temperature scales: one heat, three rulers',
  prompt = 'Celsius, Fahrenheit and Kelvin measure the same temperature with different zeros and degree sizes. Drag it and watch all three, and see why Kelvin starts at absolute zero.',
  objectives = [
    'Convert between °C, °F and K: F = 9⁄5·C + 32, K = C + 273.15',
    'Place the fixed points (freezing 0/32/273, boiling 100/212/373)',
    'Explain why Kelvin is absolute, it starts where motion stops, so it’s never negative',
  ],
}: TemperatureScalesProps = {}): ReactNode {
  const [c, setC] = useState(25);
  const f = toF(c), k = toK(c);
  const frac = Math.max(0, Math.min(1, (c - C_MIN) / (C_MAX - C_MIN)));
  const col = thermalColor(frac);
  const stemW = 26, bulbR = 22, bulbCy = Y_BOT + 24;
  const yC = yOf(c);

  const figure = (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${c.toFixed(0)} Celsius, ${f.toFixed(0)} Fahrenheit, ${k.toFixed(0)} Kelvin`}>
        {/* fixed-point rows: a faint line, a short tag in the left gutter, and each
            scale's value centred under its column, all static, so nothing crowds */}
        {FIXED.map((fp) => {
          const y = yOf(fp.c);
          return (
            <g key={fp.c}>
              <line x1={LINE_X0} y1={y} x2={LINE_X1} y2={y} stroke="var(--stage-grid)" strokeWidth={1} strokeDasharray="4 4" />
              <text x={LINE_X0 - 6} y={y + 3.5} textAnchor="end" fontSize={10} fill="var(--stage-muted)">{fp.short}</text>
              {COLS.map((col) => (
                <text key={col.name} x={col.x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--stage-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(col.val(fp.c))}{col.unit}</text>
              ))}
            </g>
          );
        })}
        {/* column headers */}
        {COLS.map((col) => (
          <text key={col.name} x={col.x} y={Y_TOP - 24} textAnchor="middle" fontSize={13} fontWeight={800} fill="var(--stage-fg)">{col.name}</text>
        ))}
        {/* thermometer: glass + mercury */}
        <rect x={TX - stemW / 2} y={Y_TOP - 6} width={stemW} height={bulbCy - Y_TOP + 6} rx={stemW / 2} fill="var(--stage-bg)" stroke="var(--stage-metal)" strokeWidth={2.5} />
        <circle cx={TX} cy={bulbCy} r={bulbR} fill={col} stroke="var(--stage-metal)" strokeWidth={2.5} />
        <rect x={TX - stemW / 2 + 4} y={yC} width={stemW - 8} height={bulbCy - yC} fill={col} />
        <rect x={TX - stemW / 2 + 5} y={Y_TOP} width={3} height={bulbCy - Y_TOP - 2} rx={1.5} fill="color-mix(in oklab, var(--stage-sheen, #fff) 50%, transparent)" />
        {/* current level: ONE line from the mercury across all three rulers, with the live
            reading shown as a chip ON each ruler, so "one heat → three numbers" is literal
            (no separate floating card to duplicate the aside). */}
        <line x1={TX + stemW / 2} y1={yC} x2={LINE_X1} y2={yC} stroke={col} strokeWidth={2} />
        {COLS.map((co) => {
          const v = Math.round(co.val(c));
          return (
            <g key={`live-${co.name}`}>
              <rect x={co.x - 25} y={yC - 12} width={50} height={24} rx={7} fill="var(--stage-bg)" stroke={col} strokeWidth={2} />
              <text x={co.x} y={yC + 4} textAnchor="middle" fontSize={12.5} fontWeight={800} fill="var(--stage-fg)" style={{ fontVariantNumeric: 'tabular-nums' }}>{v}{co.unit}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );

  // nearest fixed point note
  const near = FIXED.reduce((a, b) => (Math.abs(b.c - c) < Math.abs(a.c - c) ? b : a));
  const atFixed = Math.abs(near.c - c) < 1;
  // ONE panel: live readout → formulas → why-Kelvin, consistent treatment throughout.
  const aside = (
    <Callout tone="result">
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gap: 2, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: 22, fontWeight: 800 }}>{c.toFixed(1)} °C</span>
          <span style={{ fontWeight: 700, color: 'var(--stage-muted)' }}>{f.toFixed(1)} °F · {k.toFixed(1)} K</span>
          {atFixed && <span style={{ color: 'var(--stage-good)', fontWeight: 700, fontSize: 12 }}>📍 {near.label}</span>}
        </div>
        <div style={{ display: 'grid', gap: 6, padding: '10px 12px', borderRadius: 10, background: 'color-mix(in oklab, var(--stage-fg) 5%, transparent)', fontSize: 13 }}>
          <Tex tex={'F = \\tfrac{9}{5}\\,C + 32'} block />
          <Tex tex={'K = C + 273.15'} block />
        </div>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--stage-muted)' }}>
          <strong style={{ color: 'var(--stage-fg)' }}>Why Kelvin?</strong> It starts at absolute zero (−273.15 °C), where molecules stop moving, so K is never negative and doubling it really doubles the energy. C and F just put their zeros at handy everyday points.
        </p>
      </div>
    </Callout>
  );

  const controls = (
    <div style={{ display: 'grid', gap: 10 }}>
      <ControlBar>
        <Field label="temperature" value={`${c.toFixed(0)} °C`}>
          <Slider value={c} min={-273} max={120} step={1} onChange={setC} ariaLabel="temperature in Celsius" />
        </Field>
      </ControlBar>
      <ControlBar>
        <Field label="jump to">
          <span className="lab-field-row">
            {PRESETS.map((p) => (
              <Chip key={p.label} selected={Math.abs(p.c - c) < 0.6} onClick={() => setC(p.c)}>{p.label}</Chip>
            ))}
          </span>
        </Field>
      </ControlBar>
    </div>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls}>{figure}</LabFrame>;
}
