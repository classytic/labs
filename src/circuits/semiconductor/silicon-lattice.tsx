'use client';

import { useState, type ReactNode } from 'react';
import { Field } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import {
  useCarrierSim,
  stepCarriers,
  tweenOpacity,
  type Carrier,
  type Box,
} from '../../kit/carrier-engine.js';
import { W, ELEC, px, sited, renderCarriers, DeviceEvidence } from './shared.js';
import { siliconActivity } from './device-activity-plans.js';

type DopeMode = 'intrinsic' | 'n' | 'p';

export interface SiliconLatticeProps {
  /** doping the lab opens on (default 'intrinsic'). */
  mode?: DopeMode;
  /** initial temperature 0..1 (default 0.2). */
  temperature?: number;
  /** hide the doping toggle so the lab stays on one case (focused authoring). */
  lockDoping?: boolean;
  /** show the temperature slider (default true). */
  showTemperature?: boolean;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
}

const LAT = { x0: 96, y0: 96, dx: 116, dy: 78, cols: 4, rows: 3 };
const atomAt = (c: number, r: number): { x: number; y: number } => ({
  x: LAT.x0 + c * LAT.dx,
  y: LAT.y0 + r * LAT.dy,
});
const DOPE_C = 2,
  DOPE_R = 1; // which atom is the dopant
const C_DONOR = 'var(--stage-good, oklch(0.7 0.15 150))';
const C_ACCEPTOR = 'var(--stage-warn, oklch(0.78 0.15 75))';

function SiAtom({
  x,
  y,
  label,
  fill,
  stroke,
}: {
  x: number;
  y: number;
  label: string;
  fill: string;
  stroke: string;
}): ReactNode {
  return (
    <g className="electronics-svg-passive">
      <circle cx={px(x)} cy={px(y)} r={17} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text
        x={px(x)}
        y={px(y)}
        fill={stroke}
        fontSize={11}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {label}
      </text>
    </g>
  );
}

/** the shared electron pair on a covalent bond (two small dots offset across the bond). */
function Bond({
  a,
  b,
  broken,
}: {
  a: { x: number; y: number };
  b: { x: number; y: number };
  broken?: boolean;
}): ReactNode {
  const mx = (a.x + b.x) / 2,
    my = (a.y + b.y) / 2;
  const horiz = Math.abs(b.x - a.x) > Math.abs(b.y - a.y);
  const ox = horiz ? 0 : 4,
    oy = horiz ? 4 : 0;
  const dot = 'var(--stage-muted)';
  return (
    <g className="electronics-svg-passive">
      <line
        x1={px(a.x)}
        y1={px(a.y)}
        x2={px(b.x)}
        y2={px(b.y)}
        stroke="var(--stage-grid)"
        strokeWidth={1.4}
      />
      <circle cx={px(mx - ox)} cy={px(my - oy)} r={2.6} fill={dot} />
      {!broken && <circle cx={px(mx + ox)} cy={px(my + oy)} r={2.6} fill={dot} />}
    </g>
  );
}

export function SiliconLatticeLab({
  mode: mode0 = 'intrinsic',
  temperature: temp0 = 0.2,
  lockDoping = false,
  showTemperature = true,
  title = 'What is a semiconductor? Silicon and doping',
  prompt = 'Pure silicon: every atom shares its four outer electrons in covalent bonds, so almost none are free, a poor conductor. Dope it: a donor atom brings a spare electron (n-type), an acceptor leaves a hole (p-type). Those carriers are what carry current. Heat also frees pairs.',
  ask,
  activity = 'silicon-lattice',
}: SiliconLatticeProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'silicon-lattice';
  const authoredActivity = typeof activity === 'string' ? siliconActivity : activity;
  const [mode, setMode] = useState<DopeMode>(mode0);
  const [temp, setTemp] = useState(temp0);
  const nPairs = Math.round(temp * 4);

  // the dopant's spare carrier is BORN AT THE DOPANT: an n-donor's extra electron beside
  // its +5 core, a p-acceptor's hole in the bond it left short. From there it wanders.
  const dopeAtom = atomAt(DOPE_C, DOPE_R);
  const dopeRight = atomAt(DOPE_C + 1, DOPE_R);
  const elecStart = { x: dopeAtom.x + 22, y: dopeAtom.y - 26 };
  const holeStart = { x: (dopeAtom.x + dopeRight.x) / 2, y: dopeAtom.y };

  // free carriers on the engine: the dopant carrier + thermally generated e–h pairs
  // (more at higher T) that wander and recombine, all clamped to the lattice box.
  const LAT_BOUNDS: Box = {
    x: LAT.x0 - 26,
    y: LAT.y0 - 4,
    w: (LAT.cols - 1) * LAT.dx + 52,
    h: (LAT.rows - 1) * LAT.dy + 30,
  };
  const MAX_PAIRS = 4; // fixed pool; temperature fades thermal pairs in/out (no rebuild)
  const carriers = useCarrierSim(
    () => {
      const out: Carrier[] = [];
      if (mode === 'n')
        out.push({
          id: 0,
          t: 'e',
          o: 1,
          x: elecStart.x,
          y: elecStart.y,
          hx: elecStart.x,
          hy: elecStart.y,
        });
      if (mode === 'p')
        out.push({
          id: 1,
          t: 'h',
          o: 1,
          x: holeStart.x,
          y: holeStart.y,
          hx: holeStart.x,
          hy: holeStart.y,
        });
      for (let i = 0; i < MAX_PAIRS; i++) {
        out.push({
          id: 10 + i,
          t: 'e',
          slot: i,
          o: 0,
          ...sited(LAT_BOUNDS, 70 + i),
        });
        out.push({
          id: 30 + i,
          t: 'h',
          slot: i,
          o: 0,
          ...sited(LAT_BOUNDS, 90 + i),
        });
      }
      return out;
    },
    (cs, step) =>
      tweenOpacity(
        stepCarriers(cs, step, LAT_BOUNDS, {
          jitter: 1.3,
          speed: 0.85,
          damp: 0.85,
          spring: 0.05,
        }),
        nPairs,
      ),
    true,
    `${mode}`,
  );

  // lattice atoms + bonds
  const atoms: ReactNode[] = [];
  const bonds: ReactNode[] = [];
  for (let r = 0; r < LAT.rows; r++) {
    for (let c = 0; c < LAT.cols; c++) {
      const p = atomAt(c, r);
      const isDope = mode !== 'intrinsic' && c === DOPE_C && r === DOPE_R;
      const fill = isDope
        ? mode === 'n'
          ? `color-mix(in oklab, ${C_DONOR} 22%, var(--stage-bg))`
          : `color-mix(in oklab, ${C_ACCEPTOR} 24%, var(--stage-bg))`
        : 'color-mix(in oklab, var(--stage-semi-n, oklch(0.62 0.18 250)) 14%, var(--stage-bg))';
      const stroke = isDope ? (mode === 'n' ? C_DONOR : C_ACCEPTOR) : ELEC;
      atoms.push(
        <SiAtom
          key={`a${c}-${r}`}
          x={p.x}
          y={p.y}
          label={isDope ? (mode === 'n' ? '+5' : '+3') : '+4'}
          fill={fill}
          stroke={stroke}
        />,
      );
      // an acceptor is short exactly ONE electron: only the bond on its right is incomplete (the hole).
      if (c < LAT.cols - 1) {
        const q = atomAt(c + 1, r);
        const acc = mode === 'p' && c === DOPE_C && r === DOPE_R;
        bonds.push(<Bond key={`bh${c}-${r}`} a={p} b={q} broken={acc} />);
      }
      if (r < LAT.rows - 1) bonds.push(<Bond key={`bv${c}-${r}`} a={p} b={atomAt(c, r + 1)} />);
    }
  }

  const scene = (
    <div className="semiconductor-scene">
      <svg
        viewBox={`0 0 ${W} 320`}
        width="100%"
        role="img"
        aria-label={`silicon lattice, ${mode === 'intrinsic' ? 'pure' : mode === 'n' ? 'n-type doped' : 'p-type doped'}`}
      >
        {bonds}
        {atoms}
        {renderCarriers(carriers)}
      </svg>
    </div>
  );

  const controls = (
    <>
      {!lockDoping && (
        <Field label="doping">
          <div className="semiconductor-choice-row">
            {(['intrinsic', 'n', 'p'] as DopeMode[]).map((m) => (
              <Chip key={m} selected={mode === m} onClick={() => setMode(m)}>
                {m === 'intrinsic' ? 'pure Si' : m === 'n' ? 'n-type (donor)' : 'p-type (acceptor)'}
              </Chip>
            ))}
          </div>
        </Field>
      )}
      {showTemperature && (
        <Field label="temperature" value={temp < 0.33 ? 'cool' : temp < 0.66 ? 'warm' : 'hot'}>
          <Slider value={temp} min={0} max={1} step={0.05} onChange={setTemp} ariaLabel="temperature" />
        </Field>
      )}
    </>
  );

  const carrierName =
    mode === 'n'
      ? 'free electrons (−)'
      : mode === 'p'
        ? 'holes (+)'
        : nPairs > 0
          ? 'thermal electron–hole pairs'
          : 'almost none';
  const active = mode !== 'intrinsic' || nPairs > 0;
  const aside = (
    <DeviceEvidence
      active={active}
      state={
        mode === 'intrinsic'
          ? nPairs > 0
            ? 'Intrinsic · heat releases carrier pairs'
            : 'Intrinsic · bonds mostly occupied'
          : mode === 'n'
            ? 'n-type · electrons are majority carriers'
            : 'p-type · holes are majority carriers'
      }
      metrics={[
        {
          label: mode === 'intrinsic' ? 'Intrinsic carriers' : 'Majority carriers',
          value: carrierName,
        },
      ]}
      explanation={
        mode === 'intrinsic'
          ? 'Each silicon atom shares four valence electrons. Heating can break a bond and create one mobile electron–hole pair.'
          : mode === 'n'
            ? 'A donor contributes one electron beyond the four needed for bonding, making electrons the majority carriers.'
            : 'An acceptor leaves one bond short of an electron, creating a mobile hole as the majority carrier.'
      }
    />
  );

  // mastery: the learner produced free carriers, either by doping the lattice
  // (n donor / p acceptor) or, in pure Si, by heating it enough to free thermal e–h pairs.
  // Branch the solve on the active mode so each case reports its own intrinsic condition.
  const latticeSolved = mode === 'intrinsic' ? nPairs > 0 : true;
  useCheckpoint({
    solved: latticeSolved,
    activity: `semiconductor:${activityId}:${mode}`,
  });

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={authoredActivity}
      activityId={activityId}
      eyebrow="Semiconductor physics"
      title={title}
      description={prompt}
      status={
        <>
          <span>{mode === 'intrinsic' ? 'intrinsic' : `${mode}-type`}</span>
          <span>{carrierName}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        mode === 'intrinsic'
          ? 'Intrinsic silicon produces electrons and holes in equal pairs; neither is a majority carrier.'
          : mode === 'n'
            ? 'A donor contributes a mobile electron, making electrons the majority carriers.'
            : 'An acceptor leaves a mobile hole, making holes the majority carriers.'
      }
      transcript={
        <p>
          {mode === 'intrinsic' ? 'Intrinsic silicon' : `${mode}-type silicon`} at temperature setting{' '}
          {temp.toFixed(2)}. Visible carriers: {carrierName}.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="comparison-made"
            met={mode !== 'intrinsic'}
            complete={complete}
            outcome={mode}
          />
          {scene}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
