'use client';

import { useState, type ReactNode } from 'react';
import { solveDC, type Elem } from '@classytic/stage/circuit';
import { Field } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Tag } from '../../kit/electronics/index.js';
import {
  useCarrierSim,
  stepCarriers,
  tweenOpacity,
  inBox,
  type Carrier,
  type CType,
  type Box,
} from '../../kit/carrier-engine.js';
import {
  W,
  ELEC,
  HOLE,
  N_FILL,
  P_FILL,
  METAL,
  OXIDE,
  MUTED,
  sited,
  renderCarriers,
  Lead,
  DeviceEvidence,
} from './shared.js';
import { mosfetActivity } from './device-activity-plans.js';

export interface MosfetInsideProps {
  /** the p-channel mirror: n-substrate, p+ wells, holes form the channel, gate pulled below source. */
  pmos?: boolean;
  vth?: number;
  k?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
}

// ── geometry (pixel space) ───────────────────────────────────────────────────
const H = 320;
const DEV = { x: 40, y: 86, w: 480, h: 200 }; // substrate block
const WELL_W = 96,
  WELL_TOP = 110,
  WELL_BOT = 250; // n+ source/drain wells
const SRC_X = DEV.x + 18,
  DRN_X = DEV.x + DEV.w - 18 - WELL_W;
const CHAN_X0 = SRC_X + WELL_W,
  CHAN_X1 = DRN_X; // channel span (between wells)
const CHAN_Y = WELL_TOP + 6; // channel sits at the surface
const OX_Y = WELL_TOP - 12,
  OX_H = 8; // oxide
const GATE_Y = OX_Y - 16,
  GATE_H = 14; // metal gate bar
const GATE_X0 = CHAN_X0 - 12,
  GATE_X1 = CHAN_X1 + 12;
// the substrate label is centred in the band under the wells; its carriers keep clear of this span
const SUB_LABEL_X0 = DEV.x + DEV.w / 2 - 104,
  SUB_LABEL_X1 = DEV.x + DEV.w / 2 + 104;

export function MosfetInsideLab({
  pmos = false,
  vth = 1.5,
  k = 0.02,
  title = pmos ? 'Inside the PMOS: the p-channel mirror' : 'Inside the transistor: building the channel',
  prompt = pmos
    ? 'The PMOS mirror uses an n-type body with p+ source and drain. Pulling the gate sufficiently below the source forms a hole inversion channel; source-drain drive then produces current.'
    : 'A positive gate first depletes holes near the surface. Above threshold an electron inversion channel connects the n+ regions; drain current then depends on both gate and drain drive.',
  ask,
  activity = pmos ? 'pmos-inside' : 'mosfet-inside',
}: MosfetInsideProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : pmos ? 'pmos-inside' : 'mosfet-inside';
  const authoredActivity = typeof activity === 'string' ? mosfetActivity : activity;
  const [Vg, setVg] = useState(0); // NMOS: gate voltage. PMOS: source-gate drive (how far gate is below source).
  const [Vd, setVd] = useState(2); // NMOS: drain V. PMOS: source-drain drive.
  // progressive disclosure: let the learner hide the moving carriers to study the device
  // STRUCTURE first (wells/gate/oxide/depletion), then reveal the electrons/holes.
  const [showCarriers, setShowCarriers] = useState(true);

  const VDD = 5;
  // real engine solve. NMOS: source = gnd. PMOS: source = VDD, gate/drain pulled below it.
  const elems: Elem[] = pmos
    ? [
        { kind: 'V', n1: 1, n2: 0, value: VDD },
        { kind: 'V', n1: 3, n2: 0, value: VDD - Vg },
        { kind: 'V', n1: 2, n2: 0, value: VDD - Vd },
        {
          kind: 'M',
          pmos: true,
          n1: 2,
          n2: 1,
          n3: 3,
          value: 0,
          vth,
          k,
          id: 'q',
        },
      ]
    : [
        { kind: 'V', n1: 3, n2: 0, value: Vg },
        { kind: 'V', n1: 2, n2: 0, value: Vd },
        { kind: 'M', n1: 2, n2: 0, n3: 3, value: 0, vth, k, id: 'q' },
      ];
  const sol = solveDC(elems);
  const Id = Math.abs(sol.current['q'] ?? 0) * 1000; // mA

  // carrier types & looks mirror for PMOS (substrate ⇄ wells/channel swap n ⇄ p)
  const subFill = pmos ? N_FILL : P_FILL,
    wellFill = pmos ? P_FILL : N_FILL;
  const wellStroke = pmos ? HOLE : ELEC,
    chanColor = pmos ? HOLE : ELEC;
  const subLabel = pmos ? 'n-type substrate (electrons, −)' : 'p-type substrate (holes, +)';
  const wellType = pmos ? 'p+' : 'n+';
  const carrierWord = pmos ? 'holes' : 'electrons';
  const chanWord = pmos ? 'p-channel' : 'n-channel';
  const wcT: CType = pmos ? 'h' : 'e'; // well + channel carrier type
  const scT: CType = pmos ? 'e' : 'h'; // substrate majority type

  const on = Vg >= vth && Id > 0.02;
  const inv = Math.max(0, Math.min(1, (Vg - vth) / 2.5)); // inversion strength
  const depl = Math.max(0, Math.min(1, Vg / vth)); // depletion depth (below threshold)
  const deplDepth = depl * 40;
  const DEV_BOT = DEV.y + DEV.h;
  const speed = Math.max(0.4, Math.min(2.4, Id / 1.2));
  const nChan = on ? Math.max(2, Math.round(inv * 9)) : 0;

  // resident carriers (wells + substrate band + body column), gentle thermal jitter,
  // each clamped to its region so none drift onto the gate or out of the device.
  // depletion clears the body column under the gate: its box top tracks deplDepth LIVE
  // (per-frame), so sliding the gate pushes those carriers down smoothly, no rebuild.
  const colBox = (): Box => ({
    x: CHAN_X0 + 12,
    y: CHAN_Y + 16 + deplDepth,
    w: CHAN_X1 - CHAN_X0 - 24,
    h: Math.max(8, WELL_BOT - CHAN_Y - 26 - deplDepth),
  });
  const resident = useCarrierSim(
    () => {
      const wL: Box = {
        x: SRC_X + 8,
        y: WELL_TOP + 12,
        w: WELL_W - 16,
        h: WELL_BOT - WELL_TOP - 40,
      };
      const wR: Box = {
        x: DRN_X + 8,
        y: WELL_TOP + 12,
        w: WELL_W - 16,
        h: WELL_BOT - WELL_TOP - 40,
      };
      // The substrate band is shared with its own label, so its carriers live either side of the
      // words. One box across the whole band let holes jitter straight over the label.
      const band = { y: WELL_BOT + 6, h: DEV_BOT - WELL_BOT - 16 };
      const sbL: Box = { x: DEV.x + 16, w: SUB_LABEL_X0 - DEV.x - 24, ...band };
      const sbR: Box = { x: SUB_LABEL_X1 + 8, w: DEV.x + DEV.w - 16 - SUB_LABEL_X1 - 8, ...band };
      const col = colBox();
      const out: Carrier[] = [];
      for (let i = 0; i < 7; i++) out.push({ id: i, t: wcT, o: 1, box: wL, ...sited(wL, i + 1) });
      for (let i = 0; i < 7; i++)
        out.push({
          id: 10 + i,
          t: wcT,
          o: 1,
          box: wR,
          ...sited(wR, i + 11),
        });
      for (let i = 0; i < 7; i++)
        out.push({
          id: 20 + i,
          t: scT,
          o: 1,
          box: i < 4 ? sbL : sbR,
          ...sited(i < 4 ? sbL : sbR, i + 21),
        });
      for (let i = 0; i < 4; i++)
        out.push({
          id: 30 + i,
          t: scT,
          o: 1,
          box: col,
          ...sited(col, i + 31),
        });
      return out;
    },
    (cs, step) => {
      const col = colBox();
      // column carriers re-home as the depletion box moves so they ride it down smoothly
      const boxed = cs.map((c) =>
        c.id >= 30 && c.id < 40
          ? {
              ...c,
              box: col,
              hy: Math.max(col.y + 4, Math.min(col.y + col.h - 4, c.hy ?? col.y + col.h / 2)),
            }
          : c,
      );
      return stepCarriers(
        boxed,
        step,
        { x: DEV.x, y: DEV.y, w: DEV.w, h: DEV.h },
        { jitter: 0.9, speed: 0.7, damp: 0.85, spring: 0.05 },
      );
    },
    true,
    `${pmos}`,
  );

  // channel carriers stream source→drain (directed). Fixed pool; nChan FADES them in/out,
  // and the sim runs even when off so they fade OUT (not pop) when the channel collapses.
  const MAX_CHAN = 9;
  const chanBox: Box = {
    x: CHAN_X0 + 4,
    y: CHAN_Y - 5,
    w: CHAN_X1 - CHAN_X0 - 8,
    h: 12,
  };
  const channel = useCarrierSim(
    () =>
      Array.from({ length: MAX_CHAN }, (_, i): Carrier => ({
        id: 200 + i,
        t: wcT,
        slot: i,
        o: 0,
        box: chanBox,
        ...inBox(chanBox, 100 + i),
      })),
    (cs, step) =>
      tweenOpacity(
        stepCarriers(cs, step, chanBox, {
          drift: { x: 0.9, y: 0 },
          jitter: 0.2,
          speed: Math.max(0.5, speed),
          signed: false,
          damp: 0.9,
        }),
        nChan,
      ),
    true,
    `${pmos}`,
  );

  const scene = (
    <div className="semiconductor-scene">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`${pmos ? 'PMOS' : 'NMOS'} cross-section, gate drive ${Vg.toFixed(1)} volts, channel ${on ? 'formed' : 'absent'}`}
      >
        {/* substrate */}
        <rect
          x={DEV.x}
          y={DEV.y}
          width={DEV.w}
          height={DEV.h}
          rx={10}
          fill={subFill}
          stroke={METAL}
          strokeWidth={1}
        />
        <Tag x={DEV.x + DEV.w / 2} y={WELL_BOT + 22} text={subLabel} color={MUTED} size={11} weight={500} />
        {/* wells */}
        <rect
          x={SRC_X}
          y={WELL_TOP}
          width={WELL_W}
          height={WELL_BOT - WELL_TOP}
          rx={6}
          fill={wellFill}
          stroke={wellStroke}
          strokeWidth={1.2}
        />
        <rect
          x={DRN_X}
          y={WELL_TOP}
          width={WELL_W}
          height={WELL_BOT - WELL_TOP}
          rx={6}
          fill={wellFill}
          stroke={wellStroke}
          strokeWidth={1.2}
        />
        {/* well labels sit INSIDE the bottom of each well, clear of the S/D terminal leads above */}
        <Tag
          x={SRC_X + WELL_W / 2}
          y={WELL_BOT - 8}
          text={`${wellType} source`}
          color={wellStroke}
          size={11}
          weight={700}
        />
        <Tag
          x={DRN_X + WELL_W / 2}
          y={WELL_BOT - 8}
          text={`${wellType} drain`}
          color={wellStroke}
          size={11}
          weight={700}
        />
        {/* depletion region under the gate (below threshold) */}
        {depl > 0.02 && !on && (
          <rect
            x={GATE_X0}
            y={CHAN_Y}
            width={GATE_X1 - GATE_X0}
            height={6 + deplDepth}
            fill="color-mix(in oklab, var(--stage-bg) 70%, transparent)"
            stroke={MUTED}
            strokeWidth={0.8}
            strokeDasharray="3 3"
          />
        )}
        {/* the inversion channel */}
        {inv > 0.02 && (
          <rect
            x={CHAN_X0}
            y={CHAN_Y - 4}
            width={CHAN_X1 - CHAN_X0}
            height={10}
            rx={3}
            fill={`color-mix(in oklab, ${chanColor} ${Math.round(20 + inv * 50)}%, transparent)`}
          />
        )}
        {/* oxide + gate */}
        <rect
          x={GATE_X0}
          y={OX_Y}
          width={GATE_X1 - GATE_X0}
          height={OX_H}
          fill={OXIDE}
          stroke={METAL}
          strokeWidth={0.6}
        />
        <Tag
          x={GATE_X1 + 6}
          y={OX_Y + OX_H}
          text="oxide"
          color={MUTED}
          size={9.5}
          weight={500}
          anchor="start"
        />
        <rect x={GATE_X0} y={GATE_Y} width={GATE_X1 - GATE_X0} height={GATE_H} rx={2} fill={METAL} />
        {/* terminals */}
        <Lead
          x={SRC_X + WELL_W / 2}
          y1={WELL_TOP}
          y2={DEV.y - 16}
          label="S"
          sub={pmos ? `${VDD} V` : '0 V'}
          color={MUTED}
        />
        <Lead
          x={DRN_X + WELL_W / 2}
          y1={WELL_TOP}
          y2={DEV.y - 16}
          label="D"
          sub={`${(pmos ? VDD - Vd : Vd).toFixed(1)} V`}
          color={on ? wellStroke : MUTED}
        />
        <Lead
          x={(GATE_X0 + GATE_X1) / 2}
          y1={GATE_Y}
          y2={DEV.y - 16}
          label="G"
          sub={`${(pmos ? VDD - Vg : Vg).toFixed(1)} V`}
          color={on ? 'var(--stage-good)' : wellStroke}
        />
        {/* carriers (toggle off to study the bare device structure first) */}
        {showCarriers && renderCarriers(resident)}
        {showCarriers && renderCarriers(channel)}
      </svg>
    </div>
  );

  const controls = (
    <>
      <Field label={pmos ? 'source-gate drive' : 'gate voltage Vg'} value={`${Vg.toFixed(1)} V`}>
        <Slider value={Vg} min={0} max={5} step={0.1} onChange={setVg} ariaLabel="gate drive" />
      </Field>
      <Field label={pmos ? 'source-drain drive' : 'drain voltage Vd'} value={`${Vd.toFixed(1)} V`}>
        <Slider value={Vd} min={0} max={5} step={0.1} onChange={setVd} ariaLabel="drain drive" />
      </Field>
      <Field label="view">
        <Chip selected={showCarriers} onClick={() => setShowCarriers((v) => !v)}>
          {carrierWord}
        </Chip>
      </Field>
    </>
  );

  const stage = !inv ? 'off' : !on ? 'depleting' : 'on';
  const aside = (
    <DeviceEvidence
      active={on}
      state={
        stage === 'off'
          ? 'Off · gate below threshold'
          : stage === 'depleting'
            ? 'Depletion forming · no channel yet'
            : `Channel formed · ${carrierWord} move source to drain`
      }
      metrics={[
        { label: 'Gate drive', value: `${Vg.toFixed(1)} V` },
        {
          label: (
            <>
              Threshold V<sub>th</sub>
            </>
          ),
          value: `${vth.toFixed(1)} V`,
        },
        {
          label: (
            <>
              Drain current I<sub>d</sub>
            </>
          ),
          value: Math.abs(Id) < 0.01 ? '≈ 0' : `${Id.toFixed(2)} mA`,
        },
      ]}
      explanation={
        on
          ? `Past threshold, the surface inverts and a ${chanWord} of ${carrierWord} connects source to drain.`
          : `Below threshold, the gate changes surface charge but the ${wellType} regions remain isolated.`
      }
    />
  );

  // mastery: the learner drove the gate past threshold so the channel formed and
  // carriers actually drift source→drain (a real conducting channel, not just depletion).
  useCheckpoint({ solved: on, activity: `semiconductor:${activityId}` });

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={authoredActivity}
      activityId={activityId}
      eyebrow="Semiconductor devices"
      title={title}
      description={prompt}
      status={
        <>
          <span>{pmos ? 'PMOS' : 'NMOS'}</span>
          <span>{stage}</span>
          <span>{Id.toFixed(2)} mA</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        on
          ? `Past threshold, ${carrierWord} form a ${chanWord}; drain drive produces current through the channel.`
          : 'Below threshold the surface may be depleted, but source and drain remain isolated in this model.'
      }
      transcript={
        <p>
          {pmos ? 'PMOS' : 'NMOS'} with gate drive {Vg.toFixed(1)} volts, drain drive {Vd.toFixed(1)} volts
          and threshold {vth} volts. Channel {on ? 'formed' : 'absent'}; drain current {Id.toFixed(2)}{' '}
          milliamps.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="channel-formed"
            met={on}
            complete={complete}
            outcome={`${Vg.toFixed(1)} V gate`}
          />
          {scene}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
