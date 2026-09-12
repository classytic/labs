'use client';

import { useState, type ReactNode } from 'react';
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
  rand,
  type Carrier,
  type CType,
  type Box,
} from '../../kit/carrier-engine.js';
import { W, ELEC, HOLE, N_FILL, P_FILL, sited, renderCarriers, Lead, DeviceEvidence } from './shared.js';
import { bjtActivity } from './device-activity-plans.js';

export interface BjtInsideProps {
  pnp?: boolean;
  beta?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
}

const BJ = { y: 100, h: 132 };
const BJ_EM = { x0: 46, x1: 176 }; // emitter
const BJ_BASE = { x0: 176, x1: 232 }; // thin base
const BJ_COL = { x0: 232, x1: 516 }; // collector
const BJ_BOT = BJ.y + BJ.h;
const BJ_MID = BJ.y + BJ.h / 2;

export function BjtInsideLab({
  pnp = false,
  beta = 100,
  title = pnp
    ? 'Inside the PNP: base current steers the rest'
    : 'Inside the NPN: base current steers the rest',
  prompt = 'Forward-bias the base-emitter junction. Carriers pour from the emitter into the thin base, but only a sliver recombine there (the small base current): the rest are swept across into the collector. A tiny base current controls a much larger collector current.',
  ask,
  activity = pnp ? 'pnp-bjt' : 'npn-bjt',
}: BjtInsideProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : pnp ? 'pnp-bjt' : 'npn-bjt';
  const authoredActivity = typeof activity === 'string' ? bjtActivity : activity;
  const [vbe, setVbe] = useState(0);
  const [showCarriers, setShowCarriers] = useState(true); // hide to study the E/B/C structure first

  // Ebers-Moll forward-active (the engine has no BJT model): Ic = Is(e^(Vbe/Vt) − 1), Ib = Ic/β.
  const Vt = 0.02585,
    Is = 2e-14;
  const Ic = Math.min(50, (vbe > 0 ? Is * (Math.exp(Math.min(vbe / Vt, 40)) - 1) : 0) * 1000); // mA
  const Ib = Ic / beta;
  const on = Ic > 0.05;
  const speed = Math.max(0.5, Math.min(2.6, Ic / 10));

  // NPN: emitter/collector n (electrons), base p (holes). PNP mirrors.
  const emFill = pnp ? P_FILL : N_FILL,
    baseFill = pnp ? N_FILL : P_FILL;
  const emStroke = pnp ? HOLE : ELEC,
    baseStroke = pnp ? ELEC : HOLE;
  const emType = pnp ? 'p' : 'n',
    baseType = pnp ? 'n' : 'p';
  const mT: CType = pnp ? 'h' : 'e'; // emitter/collector/streaming carrier
  const bT: CType = pnp ? 'e' : 'h'; // base majority

  const nStream = on ? Math.max(3, Math.round(3 + Math.min(9, Ic / 4))) : 0;
  const emBox: Box = {
    x: BJ_EM.x0 + 10,
    y: BJ.y + 12,
    w: BJ_EM.x1 - BJ_EM.x0 - 26,
    h: BJ.h - 24,
  };
  const colBox: Box = {
    x: BJ_COL.x0 + 20,
    y: BJ.y + 12,
    w: BJ_COL.x1 - BJ_COL.x0 - 40,
    h: BJ.h - 24,
  };
  const baseBox: Box = {
    x: BJ_BASE.x0 + 8,
    y: BJ.y + 14,
    w: BJ_BASE.x1 - BJ_BASE.x0 - 16,
    h: BJ.h - 28,
  };
  const streamBox: Box = {
    x: BJ_EM.x1 - 26,
    y: BJ_MID - BJ.h * 0.26,
    w: BJ_COL.x0 + 86 - (BJ_EM.x1 - 26),
    h: BJ.h * 0.52,
  };

  // emitter / collector / base resident carriers (thermal jitter, region-clamped)
  const resident = useCarrierSim(
    () => {
      const out: Carrier[] = [];
      for (let i = 0; i < 5; i++)
        out.push({
          id: i,
          t: mT,
          o: 1,
          box: emBox,
          ...sited(emBox, i + 1),
        });
      for (let i = 0; i < 7; i++)
        out.push({
          id: 20 + i,
          t: mT,
          o: 1,
          box: colBox,
          ...sited(colBox, i + 11),
        });
      for (let i = 0; i < 3; i++)
        out.push({
          id: 40 + i,
          t: bT,
          o: 1,
          box: baseBox,
          ...sited(baseBox, i + 21),
        });
      return out;
    },
    (cs, step) =>
      stepCarriers(
        cs,
        step,
        { x: BJ_EM.x0, y: BJ.y, w: BJ_COL.x1 - BJ_EM.x0, h: BJ.h },
        { jitter: 0.85, speed: 0.65, damp: 0.85, spring: 0.05 },
      ),
    true,
    `${pnp}`,
  );

  // the amplified stream: carriers flow emitter → across the thin base → collector,
  // re-injected at the emitter when they reach the far side (a continuous current). Fixed
  // pool; nStream FADES carriers in/out and the sim always runs so it fades, never pops.
  const MAX_STREAM = 12;
  const stream = useCarrierSim(
    () =>
      Array.from({ length: MAX_STREAM }, (_, i): Carrier => ({
        id: 300 + i,
        t: mT,
        slot: i,
        o: 0,
        box: streamBox,
        ...inBox(streamBox, 200 + i),
      })),
    (cs, step) => {
      const moved = stepCarriers(cs, step, streamBox, {
        drift: { x: 1, y: 0 },
        jitter: 0.3,
        speed: Math.max(0.6, speed),
        signed: false,
        damp: 0.9,
      });
      const wrapped = moved.map((c) =>
        c.x > streamBox.x + streamBox.w - 6
          ? {
              ...c,
              x: streamBox.x + 4,
              y: streamBox.y + 4 + rand(c.id, step) * (streamBox.h - 8),
            }
          : c,
      );
      return tweenOpacity(wrapped, nStream);
    },
    true,
    `${pnp}`,
  );

  const scene = (
    <div className="semiconductor-scene">
      <svg
        viewBox={`0 0 ${W} 300`}
        width="100%"
        role="img"
        aria-label={`${pnp ? 'PNP' : 'NPN'} transistor, ${on ? 'forward active, conducting' : 'off'}`}
      >
        <rect
          x={BJ_EM.x0}
          y={BJ.y}
          width={BJ_EM.x1 - BJ_EM.x0}
          height={BJ.h}
          fill={emFill}
          stroke={emStroke}
          strokeWidth={1}
        />
        <rect
          x={BJ_BASE.x0}
          y={BJ.y}
          width={BJ_BASE.x1 - BJ_BASE.x0}
          height={BJ.h}
          fill={baseFill}
          stroke={baseStroke}
          strokeWidth={1}
        />
        <rect
          x={BJ_COL.x0}
          y={BJ.y}
          width={BJ_COL.x1 - BJ_COL.x0}
          height={BJ.h}
          fill={emFill}
          stroke={emStroke}
          strokeWidth={1}
        />
        <Tag
          x={(BJ_EM.x0 + BJ_EM.x1) / 2}
          y={BJ_BOT + 16}
          text={`emitter (${emType})`}
          color={emStroke}
          size={11}
          weight={600}
        />
        <Tag
          x={(BJ_BASE.x0 + BJ_BASE.x1) / 2}
          y={BJ_BOT + 16}
          text={`base (${baseType}, thin)`}
          color={baseStroke}
          size={11}
          weight={600}
        />
        <Tag
          x={(BJ_COL.x0 + BJ_COL.x1) / 2}
          y={BJ_BOT + 16}
          text={`collector (${emType})`}
          color={emStroke}
          size={11}
          weight={600}
        />
        <Lead x={(BJ_EM.x0 + BJ_EM.x1) / 2} y1={BJ.y} y2={BJ.y - 18} label="E" sub="" color={emStroke} />
        <Lead
          x={(BJ_BASE.x0 + BJ_BASE.x1) / 2}
          y1={BJ.y}
          y2={BJ.y - 40}
          label="B"
          sub={`${vbe.toFixed(2)} V`}
          color={on ? 'var(--stage-good)' : baseStroke}
        />
        <Lead
          x={(BJ_COL.x0 + BJ_COL.x1) / 2}
          y1={BJ.y}
          y2={BJ.y - 18}
          label="C"
          sub=""
          color={on ? emStroke : 'var(--stage-muted)'}
        />
        {showCarriers && renderCarriers(resident)}
        {showCarriers && renderCarriers(stream)}
      </svg>
    </div>
  );

  const controls = (
    <>
      <Field label={pnp ? 'emitter-base drive' : 'base-emitter Vbe'} value={`${vbe.toFixed(2)} V`}>
        <Slider
          value={vbe}
          min={0}
          max={0.8}
          step={0.01}
          onChange={setVbe}
          ariaLabel="base emitter voltage"
        />
      </Field>
      <Field label="view">
        <Chip selected={showCarriers} onClick={() => setShowCarriers((v) => !v)}>
          carriers
        </Chip>
      </Field>
    </>
  );

  const aside = (
    <DeviceEvidence
      active={on}
      state={
        on ? `Forward active · ${emType} carriers cross the base` : 'Off · base junction below forward bias'
      }
      metrics={[
        {
          label: (
            <>
              Base current I<sub>B</sub>
            </>
          ),
          value: Ib < 0.001 ? '≈ 0' : `${(Ib * 1000).toFixed(1)} µA`,
        },
        {
          label: (
            <>
              Collector current I<sub>C</sub>
            </>
          ),
          value: Ic < 0.05 ? '≈ 0' : `${Ic.toFixed(1)} mA`,
        },
        { label: <>Current gain β</>, value: beta },
      ]}
      explanation={
        <>
          The base is deliberately thin. Most injected carriers reach the collector, so a small base current
          controls a much larger collector current.
        </>
      }
    />
  );

  // mastery: the learner forward-biased the base-emitter junction so carriers pour
  // from emitter across the thin base into the collector, a collector current flows.
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
          <span>{pnp ? 'PNP' : 'NPN'}</span>
          <span>{on ? 'forward active' : 'off'}</span>
          <span>Ic {Ic < 0.05 ? '≈ 0' : `${Ic.toFixed(1)} mA`}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation="Forward bias injects carriers from the emitter. Because the base is thin, most cross it and are collected; only a smaller fraction contributes to base current in this forward-active model."
      transcript={
        <p>
          The {pnp ? 'PNP' : 'NPN'} transistor is {on ? 'forward active' : 'off'} at a junction drive of{' '}
          {vbe.toFixed(2)} volts. Collector current is {Ic.toFixed(2)} milliamps.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="active-tested"
            met={on}
            complete={complete}
            outcome={`${vbe.toFixed(2)} V drive`}
          />
          {scene}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
