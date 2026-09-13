'use client';

/**
 * PeriodicTrendsLab, the periodic table as a heatmap, so a trend you usually have to
 * memorise becomes a colour gradient you can read at a glance. Pick a property
 * (atomic radius, ionisation energy, electronegativity) and every tile recolours;
 * hover an element for its value. The gradients make the rules obvious: radius grows
 * DOWN and LEFT (toward caesium); ionisation energy and electronegativity grow UP and
 * RIGHT (toward fluorine). Periods 1–5 (H–Xe); a curated dataset, not a formula ,
 * which property is shown (and any highlighted element) is authorable, and a
 * predict-first question ships with it.
 */

import { useState, type ReactNode } from 'react';
import { ActivitySelect } from '../../kit/controls.js';
import { Field, Readout } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { Figure, FigText, Arrow, HUE, STROKE, tint } from '../../kit/figure/index.js';

// [Z, symbol, name, period, group, radius pm, electronegativity (Pauling|null), 1st ionisation kJ/mol]
type Row = [number, string, string, number, number, number, number | null, number];
const ELEMENTS: Row[] = [
  [1, 'H', 'Hydrogen', 1, 1, 53, 2.2, 1312],
  [2, 'He', 'Helium', 1, 18, 31, null, 2372],
  [3, 'Li', 'Lithium', 2, 1, 167, 0.98, 520],
  [4, 'Be', 'Beryllium', 2, 2, 112, 1.57, 899],
  [5, 'B', 'Boron', 2, 13, 87, 2.04, 801],
  [6, 'C', 'Carbon', 2, 14, 67, 2.55, 1086],
  [7, 'N', 'Nitrogen', 2, 15, 56, 3.04, 1402],
  [8, 'O', 'Oxygen', 2, 16, 48, 3.44, 1314],
  [9, 'F', 'Fluorine', 2, 17, 42, 3.98, 1681],
  [10, 'Ne', 'Neon', 2, 18, 38, null, 2081],
  [11, 'Na', 'Sodium', 3, 1, 190, 0.93, 496],
  [12, 'Mg', 'Magnesium', 3, 2, 145, 1.31, 738],
  [13, 'Al', 'Aluminium', 3, 13, 118, 1.61, 578],
  [14, 'Si', 'Silicon', 3, 14, 111, 1.9, 786],
  [15, 'P', 'Phosphorus', 3, 15, 98, 2.19, 1012],
  [16, 'S', 'Sulfur', 3, 16, 88, 2.58, 1000],
  [17, 'Cl', 'Chlorine', 3, 17, 79, 3.16, 1251],
  [18, 'Ar', 'Argon', 3, 18, 71, null, 1521],
  [19, 'K', 'Potassium', 4, 1, 243, 0.82, 419],
  [20, 'Ca', 'Calcium', 4, 2, 194, 1.0, 590],
  [21, 'Sc', 'Scandium', 4, 3, 184, 1.36, 633],
  [22, 'Ti', 'Titanium', 4, 4, 176, 1.54, 659],
  [23, 'V', 'Vanadium', 4, 5, 171, 1.63, 651],
  [24, 'Cr', 'Chromium', 4, 6, 166, 1.66, 653],
  [25, 'Mn', 'Manganese', 4, 7, 161, 1.55, 717],
  [26, 'Fe', 'Iron', 4, 8, 156, 1.83, 762],
  [27, 'Co', 'Cobalt', 4, 9, 152, 1.88, 760],
  [28, 'Ni', 'Nickel', 4, 10, 149, 1.91, 737],
  [29, 'Cu', 'Copper', 4, 11, 145, 1.9, 745],
  [30, 'Zn', 'Zinc', 4, 12, 142, 1.65, 906],
  [31, 'Ga', 'Gallium', 4, 13, 136, 1.81, 579],
  [32, 'Ge', 'Germanium', 4, 14, 125, 2.01, 762],
  [33, 'As', 'Arsenic', 4, 15, 114, 2.18, 947],
  [34, 'Se', 'Selenium', 4, 16, 103, 2.55, 941],
  [35, 'Br', 'Bromine', 4, 17, 94, 2.96, 1140],
  [36, 'Kr', 'Krypton', 4, 18, 88, 3.0, 1351],
  [37, 'Rb', 'Rubidium', 5, 1, 265, 0.82, 403],
  [38, 'Sr', 'Strontium', 5, 2, 219, 0.95, 549],
  [39, 'Y', 'Yttrium', 5, 3, 212, 1.22, 600],
  [40, 'Zr', 'Zirconium', 5, 4, 206, 1.33, 640],
  [41, 'Nb', 'Niobium', 5, 5, 198, 1.6, 652],
  [42, 'Mo', 'Molybdenum', 5, 6, 190, 2.16, 684],
  [43, 'Tc', 'Technetium', 5, 7, 183, 1.9, 702],
  [44, 'Ru', 'Ruthenium', 5, 8, 178, 2.2, 710],
  [45, 'Rh', 'Rhodium', 5, 9, 173, 2.28, 720],
  [46, 'Pd', 'Palladium', 5, 10, 169, 2.2, 804],
  [47, 'Ag', 'Silver', 5, 11, 165, 1.93, 731],
  [48, 'Cd', 'Cadmium', 5, 12, 161, 1.69, 868],
  [49, 'In', 'Indium', 5, 13, 156, 1.78, 558],
  [50, 'Sn', 'Tin', 5, 14, 145, 1.96, 709],
  [51, 'Sb', 'Antimony', 5, 15, 133, 2.05, 834],
  [52, 'Te', 'Tellurium', 5, 16, 123, 2.1, 869],
  [53, 'I', 'Iodine', 5, 17, 115, 2.66, 1008],
  [54, 'Xe', 'Xenon', 5, 18, 108, 2.6, 1170],
];

type PropKey = 'radius' | 'ie' | 'en';
const PROPS: Record<
  PropKey,
  {
    label: string;
    unit: string;
    idx: 5 | 6 | 7;
    trend: string;
    corner: string;
    /** Direction the property grows: across a period (+1 right) and down a group (+1 down). */
    across: 1 | -1;
    down: 1 | -1;
  }
> = {
  radius: {
    label: 'Atomic radius',
    unit: 'pm',
    idx: 5,
    trend: 'grows ↓ and ←',
    corner: 'biggest at the bottom-left (Rb, Cs)',
    across: -1,
    down: 1,
  },
  ie: {
    label: 'Ionisation energy',
    unit: 'kJ/mol',
    idx: 7,
    trend: 'grows ↑ and →',
    corner: 'highest at the top-right (F, Ne, He)',
    across: 1,
    down: -1,
  },
  en: {
    label: 'Electronegativity',
    unit: '',
    idx: 6,
    trend: 'grows ↑ and →',
    corner: 'highest at the top-right (F)',
    across: 1,
    down: -1,
  },
};

/** Sequential single-hue ramp (pale paper → full hue-1) for a 0..1 normalised value. */
const heat = (t: number): string => tint(HUE[1], Math.round(8 + 92 * Math.max(0, Math.min(1, t))));

export interface PeriodicTrendsProps {
  property?: PropKey;
  /** Symbol to highlight initially (e.g. 'Cl'). */
  highlight?: string;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Override the complete authored learning sequence without forking the scientific model. */
  activity?: AuthoredActivity;
}

// 18 groups × 32 with a 12-unit margin each side; the table starts near the top edge
// because the property title and trend arrows live in the table's own empty gap
// (groups 3–12 of periods 1–3), not in a band above it.
const W = 600,
  CELL = 32,
  OX = 12,
  OY = 10;
const LEGEND_STEPS = 40,
  LEGEND_STEP_W = 5,
  LEGEND_H = 12;
const CHALLENGE: AuthoredChoiceQuestion[] = [
  {
    id: 'period',
    prompt: 'Going left to right across a period, atomic radius…',
    choices: [
      { value: 'down', label: 'decreases' },
      { value: 'up', label: 'increases' },
      { value: 'same', label: 'stays the same' },
    ],
    answer: 'down',
    explain:
      'More protons pull the same shell of electrons in tighter, so atoms shrink across a period, even as electrons are added.',
  },
  {
    id: 'ie',
    prompt: 'Ionisation energy is generally highest…',
    choices: [
      { value: 'tr', label: 'top-right (near fluorine / the noble gases)' },
      { value: 'bl', label: 'bottom-left (near caesium)' },
      { value: 'mid', label: 'in the middle (transition metals)' },
    ],
    answer: 'tr',
    explain:
      'Small, tightly-held atoms top-right cling hardest to their electrons, so they need the most energy to ionise.',
  },
];
const STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Predict the direction',
    lead: 'Commit to the across-period trend before opening the heatmap.',
    success: 'period-prediction',
  },
  {
    id: 'explore',
    phase: 'act',
    title: 'Change the property',
    lead: 'Compare a size trend with an energy trend.',
    reveal: ['model'],
    controls: true,
    success: 'property-compared',
  },
  {
    id: 'observe',
    phase: 'observe',
    title: 'Read the gradient',
    lead: 'Use colour and a selected element as evidence.',
    reveal: ['model', 'evidence'],
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain the energetic trend',
    lead: 'Connect position in the table to ionisation energy.',
    success: 'energy-explanation',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Inspect another element',
    lead: 'Select an element and report its property value.',
    reveal: ['model', 'evidence'],
    controls: true,
    success: 'element-inspected',
  },
];

export function PeriodicTrendsLab({
  property: prop0 = 'radius',
  highlight,
  title = 'Periodic trends: read the table as a heatmap',
  prompt = 'Colour every element by a property and the trend appears as a gradient. Hover an element for its value; switch the property to see the pattern flip.',
  objectives = [
    'Read periodic trends as colour gradients across the table',
    'Atomic radius grows down a group and shrinks across a period',
    'Ionisation energy & electronegativity grow up and to the right',
  ],
  activity,
}: PeriodicTrendsProps = {}): ReactNode {
  const [prop, setProp] = useState<PropKey>(prop0);
  const [selZ, setSelZ] = useState<number | null>(
    highlight ? (ELEMENTS.find((e) => e[1] === highlight)?.[0] ?? null) : null,
  );
  const initialZ = highlight ? (ELEMENTS.find((e) => e[1] === highlight)?.[0] ?? null) : null;

  const cfg = PROPS[prop];
  const vals = ELEMENTS.map((e) => e[cfg.idx] as number | null).filter((v): v is number => v != null);
  const lo = Math.min(...vals),
    hi = Math.max(...vals);
  const norm = (v: number): number => (hi > lo ? (v - lo) / (hi - lo) : 0.5);

  const sel = selZ != null ? ELEMENTS.find((e) => e[0] === selZ) : undefined;
  const tableBot = OY + 5 * CELL;
  const legY = tableBot + 16;
  const H = legY + LEGEND_H + 10;
  const unit = cfg.unit ? ` ${cfg.unit}` : '';
  // the empty gap in the table (groups 3–12, periods 1–3) hosts the title and trend arrows
  const gapL = OX + 2 * CELL,
    gapR = OX + 12 * CELL,
    gapMid = (gapL + gapR) / 2;
  const acrossY = OY + 62,
    acrossX0 = gapMid - 92,
    acrossX1 = gapMid - 12;
  const downX = gapMid + 40,
    downY0 = OY + 44,
    downY1 = OY + 84;
  const legendX0 = OX + 120,
    legendX1 = legendX0 + LEGEND_STEPS * LEGEND_STEP_W;

  const figure = (
    <div
      className="chem-scene chem-periodic-scene chem-wide-scene"
      role="region"
      aria-label="Interactive periodic table; scroll horizontally on a narrow screen"
      tabIndex={0}
    >
      <Figure viewBox={[W, H]} domain="chem" label={`Periodic table coloured by ${cfg.label}`}>
        {ELEMENTS.map((e) => {
          const z = e[0],
            sym = e[1],
            period = e[3],
            group = e[4];
          const v = e[cfg.idx] as number | null;
          const x = OX + (group - 1) * CELL,
            y = OY + (period - 1) * CELL;
          const t = v != null ? norm(v) : null;
          const isSel = selZ === z;
          return (
            <g
              className="chem-periodic-element"
              key={z}
              onPointerEnter={() => setSelZ(z)}
              onClick={() => setSelZ(z)}
              role="button"
              tabIndex={0}
              aria-label={`${e[2]}, ${cfg.label} ${v ?? 'unavailable'} ${cfg.unit}`}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelZ(z);
                }
              }}
            >
              <rect
                x={x}
                y={y}
                width={CELL - 2}
                height={CELL - 2}
                rx={3}
                fill={t != null ? heat(t) : tint(HUE.soft, 18)}
                stroke={isSel ? HUE.ink : HUE.paper}
                strokeWidth={isSel ? STROKE.edge : STROKE.hair}
              />
              <FigText
                x={x + (CELL - 2) / 2}
                y={y + (CELL - 2) / 2}
                anchor="middle"
                baseline="middle"
                tone={t == null ? 'soft' : 'ink'}
              >
                {sym}
              </FigText>
            </g>
          );
        })}

        {/* ── title + trend arrows, in the table's empty gap ── */}
        <FigText x={gapMid} y={OY + 30} anchor="middle" size="title">
          {cfg.label}
          {cfg.unit ? ` (${cfg.unit})` : ''}
        </FigText>
        <Arrow
          x1={cfg.across > 0 ? acrossX0 : acrossX1}
          y1={acrossY}
          x2={cfg.across > 0 ? acrossX1 : acrossX0}
          y2={acrossY}
          color={HUE[1]}
          weight="edge"
          head={9}
        />
        <FigText x={(acrossX0 + acrossX1) / 2} y={acrossY + 20} anchor="middle" size="note" tone="soft">
          grows across a period
        </FigText>
        <Arrow
          x1={downX}
          y1={cfg.down > 0 ? downY0 : downY1}
          x2={downX}
          y2={cfg.down > 0 ? downY1 : downY0}
          color={HUE[1]}
          weight="edge"
          head={9}
        />
        <FigText x={downX + 12} y={(downY0 + downY1) / 2} baseline="middle" size="note" tone="soft">
          grows down a group
        </FigText>

        {/* ── colour scale ── */}
        <FigText x={OX} y={legY + LEGEND_H / 2} baseline="middle" size="eyebrow" tone="soft">
          scale
        </FigText>
        <FigText x={legendX0 - 6} y={legY + LEGEND_H / 2} anchor="end" baseline="middle" size="note">
          {lo}
          {unit}
        </FigText>
        {Array.from({ length: LEGEND_STEPS }, (_, i) => (
          <rect
            key={i}
            x={legendX0 + i * LEGEND_STEP_W}
            y={legY}
            width={LEGEND_STEP_W + 0.5}
            height={LEGEND_H}
            fill={heat(i / (LEGEND_STEPS - 1))}
          />
        ))}
        <rect
          x={legendX0}
          y={legY}
          width={LEGEND_STEPS * LEGEND_STEP_W}
          height={LEGEND_H}
          rx={2}
          fill="none"
          stroke={HUE.soft}
          strokeWidth={STROKE.hair}
        />
        <FigText x={legendX1 + 6} y={legY + LEGEND_H / 2} baseline="middle" size="note">
          {hi}
          {unit}
        </FigText>
      </Figure>
    </div>
  );

  const evidence = (
    <>
      <Readout
        value={
          sel ? (
            <>
              {sel[2]} ({sel[1]}) · Z={sel[0]}
            </>
          ) : (
            <>Select an element</>
          )
        }
        sub={
          sel ? (
            <>
              {cfg.label}: {sel[cfg.idx] != null ? `${sel[cfg.idx]} ${cfg.unit}` : 'unavailable'}
            </>
          ) : (
            <>Hover, focus, or click a tile.</>
          )
        }
      />
      <p className="chem-explanation">
        {cfg.label} <strong>{cfg.trend}</strong>, {cfg.corner}.
      </p>
    </>
  );

  const controls = (
    <Field label="colour by">
      <ActivitySelect
        ariaLabel="colour by"
        value={prop}
        onChange={setProp}
        options={(Object.keys(PROPS) as PropKey[]).map((p) => ({ value: p, label: PROPS[p].label }))}
      />
    </Field>
  );

  const runtimeActivity: AuthoredActivity = activity ?? {
    pattern: 'investigation',
    title,
    objectives,
    steps: STEPS,
    questions: CHALLENGE,
    success: [
      {
        id: 'period-prediction',
        source: 'answer',
        key: 'period',
        pendingLabel: 'Choose the atomic-radius trend.',
      },
      {
        id: 'property-compared',
        source: 'metric',
        key: 'propertyChanged',
        operator: 'eq',
        value: true,
        pendingLabel: 'Choose ionisation energy or electronegativity.',
      },
      {
        id: 'energy-explanation',
        source: 'answer',
        key: 'ie',
        pendingLabel: 'Identify where ionisation energy is highest.',
      },
      {
        id: 'element-inspected',
        source: 'metric',
        key: 'selectedElement',
        operator: 'neq',
        value: initialZ ?? -1,
        pendingLabel: 'Select another element.',
      },
    ],
  };

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtimeActivity}
      activityId="periodic-trends"
      eyebrow="Chemical periodicity"
      title={title}
      description={prompt}
      status={
        <>
          <span>{cfg.label}</span>
          {sel ? (
            <span>
              {sel[1]} · {sel[cfg.idx] ?? '—'} {cfg.unit}
            </span>
          ) : null}
        </>
      }
      evidence={({ sequence }) => (sequence.shows('evidence') ? evidence : null)}
      controls={({ sequence }) => (sequence.current.controls ? controls : null)}
      observation={({ sequence }) =>
        sequence.shows('model')
          ? `${cfg.label} ${cfg.trend}; the colour gradient makes the direction visible.`
          : null
      }
      transcript={
        <p>
          The periodic table is coloured by {cfg.label.toLowerCase()}.{' '}
          {sel
            ? `${sel[2]}, atomic number ${sel[0]}, has a value of ${sel[cfg.idx] ?? 'unavailable'} ${cfg.unit}.`
            : 'No element is selected.'}
        </p>
      }
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="property-compared"
            met={sequence.current.id === 'explore' && prop !== prop0}
            complete={complete}
          />
          <AuthoredMetricGate
            conditionId="element-inspected"
            met={sequence.current.id === 'transfer' && selZ != null && selZ !== initialZ}
            complete={complete}
          />
          {sequence.shows('model') ? figure : <p>Answer the prediction to reveal the periodic heatmap.</p>}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
