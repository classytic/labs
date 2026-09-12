'use client';

/**
 * BrownoutLab — what a falling supply voltage does to digital logic. A CMOS gate only switches
 * when its transistors can turn on, and that needs the supply rail VDD to stay above the
 * threshold Vth. Drag the battery EMF down (a draining cell, a sagging rail) and the engine solves
 * the gate's output: with a healthy supply it swings rail to rail (valid 1 / 0); as VDD falls
 * toward Vth the swing collapses and the output can no longer follow the input, so it is no longer
 * a valid 1 or 0. That is a brown-out: the chip is not broken, it is simply starved of voltage, and
 * this is the bridge from EMF and
 * the battery to whether a logic circuit works at all.
 */

import { useState, type ReactNode } from 'react';
import { solveDC, type Elem } from '@classytic/stage/circuit';
import { Wire, Tag, SupplyRail, LogicPort } from '../../kit/electronics/index.js';
import { Field } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { brownoutActivity } from './activity-plan.js';
import { Slider, Segmented, StatusPill } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';

const K = 0.5;
const C_HEALTHY = 'var(--stage-good)';
const C_MARGINAL = 'var(--stage-warn, oklch(0.78 0.15 80))';
const C_DEAD = 'var(--stage-danger)';

export interface BrownoutProps {
  vth?: number;
  vmax?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
}

const W = 460,
  H = 250;

export function BrownoutLab({
  vth = 2,
  vmax = 6,
  title = 'Brown-out: when the supply is too low to think',
  prompt = 'Drag the battery EMF down. The CMOS gate only switches while the supply rail VDD stays above the transistor threshold. As VDD falls toward Vth the output, solved by the engine, loses its swing and can no longer follow the input: a brown-out, where the logic is no longer a valid 1 or 0.',
  ask,
  activity = 'brownout',
}: BrownoutProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'brownout';
  const authoredActivity = typeof activity === 'string' ? brownoutActivity : activity;
  const [vdd, setVdd] = useState(Math.min(5, vmax));
  const [A, setA] = useState(1);

  // A CMOS inverter on the chosen rail: VDD=node1, Y=node2, A=node3.
  const inv = (vddV: number, aV: number): Elem[] => [
    { kind: 'V', n1: 1, n2: 0, value: vddV },
    { kind: 'V', n1: 3, n2: 0, value: aV },
    { kind: 'M', pmos: true, n1: 2, n2: 1, n3: 3, value: 0, vth, k: K },
    { kind: 'M', n1: 2, n2: 0, n3: 3, value: 0, vth, k: K },
  ];
  const yAt = (aV: number) => solveDC(inv(vdd, aV)).nodeV[2] ?? 0;
  const Yhigh = yAt(0); // input LOW  → output should be HIGH (≈ VDD)
  const Ylow = yAt(vdd); // input HIGH → output should be LOW  (≈ 0)
  const Y = yAt(A ? vdd : 0); // the displayed case
  const swing = Yhigh - Ylow;
  const swingFrac = vdd > 0.05 ? swing / vdd : 0;

  // Verdict from the engine: below Vth the swing collapses to mid-rail (output invalid). Just above
  // Vth the swing is full but the absolute rail is low, so the noise margin is thin (marginal). The
  // safe band is a comfortable headroom above Vth.
  const SAFE = 1.5 * vth;
  const collapsed = swingFrac <= 0.5;
  const zone: 'healthy' | 'marginal' | 'dead' = collapsed ? 'dead' : vdd < SAFE ? 'marginal' : 'healthy';
  const zoneColor = zone === 'healthy' ? C_HEALTHY : zone === 'marginal' ? C_MARGINAL : C_DEAD;
  const valid = !collapsed; // a clean (full-swing) output level
  const level = collapsed ? 'invalid' : Y > vdd / 2 ? '1' : '0';

  // A left-to-right signal path reads like the circuit itself: supply → gate → output.
  // The voltage range is a secondary instrument below it, not a disconnected vertical object.
  const gx = 224,
    gy = 108;
  const TX = 58,
    TW = 344,
    TY = 202;
  const tx = (v: number) => TX + (Math.min(v, vmax) / vmax) * TW;

  const scene = (
    <div className="electronics-scene electronics-scene-centered">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Brown-out demo, supply ${vdd.toFixed(1)} volts, logic ${zone === 'healthy' ? 'valid' : zone === 'marginal' ? 'marginal' : 'invalid'}`}
      >
        {/* battery and its explicit supply rail */}
        <rect
          x={44}
          y={70}
          width={64}
          height={76}
          rx={12}
          fill="var(--stage-bg)"
          stroke={zoneColor}
          strokeWidth={2}
        />
        <rect x={64} y={62} width={24} height={8} rx={3} fill={zoneColor} opacity={0.8} />
        <rect x={51} y={78} width={50} height={60} rx={7} fill={zoneColor} opacity={0.18} />
        <Tag x={76} y={97} text="VDD" color="var(--stage-fg)" size={12} weight={800} anchor="middle" />
        <Tag
          x={76}
          y={121}
          text={`${vdd.toFixed(1)} V`}
          color={zoneColor}
          size={14}
          weight={800}
          anchor="middle"
        />
        <SupplyRail
          from={[108, gy - 34]}
          to={[gx, gy - 34]}
          label="supply rail"
          live={vdd > 0.05}
          color={zoneColor}
          labelAt={[166, gy - 42]}
          labelAnchor="middle"
        />
        {/* the gate: a NOT symbol (triangle + bubble) */}
        <polygon
          points={`${gx},${gy - 26} ${gx},${gy + 26} ${gx + 40},${gy}`}
          fill="color-mix(in oklab, var(--stage-metal, gray) 18%, var(--stage-bg))"
          stroke="var(--stage-fg)"
          strokeWidth={1.5}
        />
        <circle
          cx={gx + 46}
          cy={gy}
          r={5}
          fill="var(--stage-bg)"
          stroke="var(--stage-fg)"
          strokeWidth={1.5}
        />
        <Tag
          x={gx + 20}
          y={gy + 4}
          text="NOT"
          color="var(--stage-fg)"
          size={10}
          weight={700}
          anchor="middle"
        />
        {/* input A */}
        <Wire
          points={[
            [gx - 36, gy],
            [gx, gy],
          ]}
          live={!!A}
        />
        <LogicPort
          x={gx - 40}
          y={gy}
          name="A"
          value={A ? '1' : '0'}
          color={A ? C_HEALTHY : 'var(--stage-muted)'}
          side="left"
        />
        {/* output Y */}
        <Wire
          points={[
            [gx + 51, gy],
            [gx + 96, gy],
          ]}
          live={valid && level === '1'}
        />
        <LogicPort
          x={gx + 100}
          y={gy}
          name="Y"
          value={level === 'invalid' ? '?' : level}
          color={level === 'invalid' ? C_DEAD : level === '1' ? C_HEALTHY : 'var(--stage-muted)'}
          reading={`${Y.toFixed(2)} V`}
        />

        {/* one compact voltage instrument: invalid, marginal and safe ranges */}
        <rect x={TX} y={TY} width={tx(vth) - TX} height={8} rx={4} fill={C_DEAD} opacity={0.32} />
        <rect x={tx(vth)} y={TY} width={tx(SAFE) - tx(vth)} height={8} fill={C_MARGINAL} opacity={0.38} />
        <rect
          x={tx(SAFE)}
          y={TY}
          width={TX + TW - tx(SAFE)}
          height={8}
          rx={4}
          fill={C_HEALTHY}
          opacity={0.32}
        />
        <circle cx={tx(vdd)} cy={TY + 4} r={7} fill={zoneColor} stroke="var(--stage-bg)" strokeWidth={3} />
        <Tag x={TX} y={TY + 25} text="brown-out" color={C_DEAD} size={9} weight={700} anchor="start" />
        <Tag
          x={tx(vth)}
          y={TY - 8}
          text={`Vth ${vth} V`}
          color="var(--stage-muted)"
          size={9}
          weight={650}
          anchor="middle"
        />
        <Tag
          x={TX + TW}
          y={TY + 25}
          text="healthy headroom"
          color={C_HEALTHY}
          size={9}
          weight={700}
          anchor="end"
        />
      </svg>
    </div>
  );

  const controls = (
    <>
      <Field label={`battery EMF = ${vdd.toFixed(1)} V`}>
        <Slider
          min={0}
          max={vmax}
          step={0.1}
          value={vdd}
          onChange={setVdd}
          ariaLabel="battery EMF in volts"
        />
      </Field>
      <Field label="input A">
        <Segmented
          ariaLabel="input a"
          value={A === 1 ? '1' : '0'}
          onChange={(v) => setA(v === '1' ? 1 : 0)}
          options={[
            { value: '0', label: '0' },
            { value: '1', label: '1' },
          ]}
        />
      </Field>
    </>
  );

  const aside = (
    <div className="electronics-inspector">
      <StatusPill ok={valid}>
        {zone === 'healthy'
          ? 'Healthy rail · valid logic with good noise margin'
          : zone === 'marginal'
            ? 'Marginal rail · valid logic with little noise margin'
            : 'Brownout · output is not a valid logic level'}
      </StatusPill>
      <div>
        <div className="electronics-readout electronics-readout-relaxed">
          supply VDD = <strong>{vdd.toFixed(1)} V</strong> (threshold Vth = {vth} V)
          <br />
          output swing = <strong>{Math.max(0, swing).toFixed(2)} V</strong> (
          {Math.round(Math.max(0, swingFrac) * 100)}% of rail)
          <br />
          this output = {Y.toFixed(2)} V →{' '}
          {level === 'invalid' ? (
            <span className="electronics-invalid">invalid (neither 1 nor 0)</span>
          ) : (
            <strong>logic {level}</strong>
          )}
        </div>
      </div>
      <div>
        <div className="electronics-explanation">
          A transistor needs gate-to-source above Vth to conduct. Once the whole rail drops near Vth, neither
          the pull-up nor the pull-down can fully turn on, so the output can no longer be driven to a valid
          level and the swing collapses. Real systems brown out when a battery drains or a heavy load makes
          the supply sag (EMF minus the internal-resistance drop). The cure is a minimum supply voltage, not a
          faster chip.
        </div>
      </div>
    </div>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={authoredActivity}
      activityId={activityId}
      eyebrow="Digital electronics"
      title={title}
      description={prompt}
      status={
        <>
          <span>{zone}</span>
          <span>Vdd {vdd.toFixed(1)} V</span>
          <span>Y {level}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation="As supply headroom disappears, output swing and noise margin disappear with it. This simplified gate model marks the point where the output is no longer a reliable logic level."
      transcript={
        <p>
          Supply is {vdd.toFixed(1)} volts. The modeled output is{' '}
          {level === 'invalid' ? 'not a valid logic level' : `logic ${level}`}; the supply zone is {zone}.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="brownout-tested"
            met={zone === 'dead'}
            complete={complete}
            outcome={`${vdd.toFixed(1)} V supply`}
          />
          {scene}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
