'use client';

import { useState, type ReactNode } from 'react';
import { solveDC } from '@classytic/stage/circuit';
import { Field } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Tag } from '../../kit/electronics/index.js';
import { useCarrierSim, stepCarriers, recombine, type Carrier, type Box } from '../../kit/carrier-engine.js';
import {
  W,
  ELEC,
  HOLE,
  N_FILL,
  P_FILL,
  MUTED,
  sited,
  renderCarriers,
  Ion,
  DeviceEvidence,
} from './shared.js';
import { pnJunctionActivity } from './transport-activity-plans.js';

export interface PnJunctionProps {
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
  /** Initial applied p-to-n voltage, in volts. */
  bias?: number;
  /** Whether mobile carriers are visible initially. */
  showCarriers?: boolean;
}

const PJ = { x: 44, y: 96, w: 472, h: 150, junc: 280 };
const PJ_BOT = PJ.y + PJ.h;
/** Halfway between the second and third rows of ions, the widest clear line through the region. */
const FIELD_Y = PJ.y + 26 + (1.5 * (PJ.h - 40)) / 4;

export function PnJunctionLab({
  title = 'Inside the diode: the PN junction',
  prompt = 'An n-region (free electrons) meets a p-region (free holes). Where they touch, carriers recombine and leave a depletion region of fixed ions with a built-in field. Bias it: forward narrows the barrier and current floods across; reverse widens it and it blocks.',
  ask,
  activity = 'pn-junction',
  bias: initialBias = 0,
  showCarriers: initialShowCarriers = true,
}: PnJunctionProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'pn-junction';
  const authoredActivity = typeof activity === 'string' ? pnJunctionActivity : activity;
  const [bias, setBias] = useState(Math.max(-3, Math.min(0.9, initialBias)));
  const [showCarriers, setShowCarriers] = useState(initialShowCarriers);

  // p side = anode (node 1), n side = cathode (gnd). bias > 0 = forward.
  const sol = solveDC([
    { kind: 'V', n1: 1, n2: 0, value: bias },
    { kind: 'R', n1: 1, n2: 2, value: 40 },
    { kind: 'D', n1: 2, n2: 0, value: 0, id: 'd' },
  ]);
  const Id = (sol.current['d'] ?? 0) * 1000;
  const forward = bias > 0.05 && Id > 0.2;
  const reverse = bias < -0.02;
  // depletion half-width: equilibrium, shrinks forward, grows reverse
  const w = Math.max(7, 24 - (forward ? Math.min(15, Id / 6) : 0) + (reverse ? Math.min(40, -bias * 16) : 0));
  const dL = PJ.junc - w,
    dR = PJ.junc + w;
  const speed = Math.max(0.5, Math.min(2.2, Id / 12));

  // carrier engine: electrons confined to the n-bulk, holes to the p-bulk. Under forward
  // bias the confine boxes reach across the (thin) junction so carriers stream over and
  // recombine; reverse just widens the carrier-free depletion. Nothing leaves the device.
  const bounds: Box = { x: PJ.x, y: PJ.y, w: PJ.w, h: PJ.h };
  const nBox = (right: number): Box => ({
    x: PJ.x + 8,
    y: PJ.y + 10,
    w: Math.max(10, right - PJ.x - 12),
    h: PJ.h - 20,
  });
  const pBox = (left: number): Box => ({
    x: left + 4,
    y: PJ.y + 10,
    w: Math.max(10, PJ.x + PJ.w - left - 12),
    h: PJ.h - 20,
  });
  // home sites sit in the BULK, clear of the widest depletion, so equilibrium/reverse
  // carriers jiggle there (spread, no clumping). Forward releases them to flow + recombine.
  const nHome: Box = {
    x: PJ.x + 12,
    y: PJ.y + 12,
    w: PJ.junc - 70 - (PJ.x + 12),
    h: PJ.h - 24,
  };
  const pHome: Box = {
    x: PJ.junc + 70,
    y: PJ.y + 12,
    w: PJ.x + PJ.w - (PJ.junc + 70) - 12,
    h: PJ.h - 24,
  };
  const carriers = useCarrierSim(
    () => {
      const out: Carrier[] = [];
      for (let i = 0; i < 10; i++) out.push({ id: i, t: 'e', ...sited(nHome, i + 1) });
      for (let i = 0; i < 10; i++) out.push({ id: 100 + i, t: 'h', ...sited(pHome, i + 11) });
      return out;
    },
    (cs, step) => {
      const eBox = nBox(forward ? PJ.junc + 10 : dL);
      const hBox = pBox(forward ? PJ.junc - 10 : dR);
      const boxed = cs.map((c) => ({ ...c, box: c.t === 'e' ? eBox : hBox }));
      if (forward) {
        const moved = stepCarriers(boxed, step, bounds, {
          drift: { x: 0.9, y: 0 },
          jitter: 0.45,
          speed,
          damp: 0.9,
        });
        return recombine(moved, 12, step, (c) =>
          c.t === 'e' ? sited(nHome, c.id + 31 * step) : sited(pHome, c.id + 31 * step),
        );
      }
      // equilibrium / reverse: jiggle on home sites in the bulk
      return stepCarriers(boxed, step, bounds, {
        jitter: 0.7,
        speed: 0.7,
        damp: 0.85,
        spring: 0.05,
      });
    },
    true,
    'pn',
  );
  // Immobile ionised donors (+) and acceptors (−) exist only inside the
  // depletion region. Keeping them out of the neutral bulk is essential to the
  // model: it is their uncovered charge that creates the built-in field.
  const ions: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const y = PJ.y + 26 + (i * (PJ.h - 40)) / 4;
    ions.push(
      <Ion key={`donor-${i}`} x={dL + w * 0.48} y={y} sign="+" />,
      <Ion key={`acceptor-${i}`} x={dR - w * 0.48} y={y} sign="−" />,
    );
  }

  const scene = (
    <div className="semiconductor-scene">
      <svg
        viewBox={`0 0 ${W} 300`}
        width="100%"
        role="img"
        aria-label={`PN junction, ${forward ? 'forward biased, conducting' : reverse ? 'reverse biased, blocking' : 'unbiased'}`}
      >
        <defs>
          <linearGradient id="pn-barrier" x1="0" x2="1">
            <stop offset="0" stopColor={ELEC} stopOpacity="0.16" />
            <stop offset="0.5" stopColor="var(--stage-bg)" stopOpacity="0.92" />
            <stop offset="1" stopColor={HOLE} stopOpacity="0.16" />
          </linearGradient>
        </defs>
        {/* Neutral bulk regions. */}
        <rect
          x={PJ.x}
          y={PJ.y}
          width={PJ.junc - PJ.x}
          height={PJ.h}
          fill={N_FILL}
          stroke={ELEC}
          strokeWidth={1}
        />
        <rect
          x={PJ.junc}
          y={PJ.y}
          width={PJ.x + PJ.w - PJ.junc}
          height={PJ.h}
          fill={P_FILL}
          stroke={HOLE}
          strokeWidth={1}
        />
        <Tag
          x={(PJ.x + dL) / 2}
          y={PJ.y - 8}
          text="n-type (electrons −)"
          color={ELEC}
          size={15}
          weight={700}
        />
        <Tag
          x={(dR + PJ.x + PJ.w) / 2}
          y={PJ.y - 8}
          text="p-type (holes +)"
          color={HOLE}
          size={15}
          weight={700}
        />
        {/* depletion region */}
        <rect
          x={dL}
          y={PJ.y}
          width={2 * w}
          height={PJ.h}
          fill="url(#pn-barrier)"
          stroke="var(--stage-fg)"
          strokeWidth={1.2}
          strokeDasharray="5 5"
          data-testid="depletion-region"
        />
        <Tag
          x={PJ.junc}
          y={PJ_BOT + 16}
          text={`depletion width ${Math.round(2 * w)} units`}
          color={MUTED}
          size={14}
          weight={650}
        />
        {/* built-in field arrow (n → p) when not fully forward-collapsed. The arrow runs through the
            gap between the second and third ion rows, and its name sits above the device, joined by a
            leader: written on the arrow it covered the ions and both dashed edges. The head is drawn
            here because this svg is not a Stage, so the stage arrow marker does not exist in it. */}
        {w > 9 && (
          <g>
            <line
              x1={dL + 4}
              y1={FIELD_Y}
              x2={dR - 10}
              y2={FIELD_Y}
              stroke="var(--stage-fg)"
              strokeWidth={2}
            />
            <path d={`M${dR - 4},${FIELD_Y} l-8,-4.5 v9 z`} fill="var(--stage-fg)" />
            <line x1={PJ.junc} y1={PJ.y - 36} x2={PJ.junc} y2={PJ.y} stroke={MUTED} strokeWidth={1} />
            <Tag
              x={PJ.junc}
              y={PJ.y - 42}
              text="built-in field, n → p"
              color={MUTED}
              size={13}
              weight={650}
            />
          </g>
        )}
        {ions}
        {showCarriers && renderCarriers(carriers)}
      </svg>
    </div>
  );

  const controls = (
    <>
      <Field label="bias voltage" value={`${bias.toFixed(2)} V`}>
        <Slider value={bias} min={-3} max={0.9} step={0.05} onChange={setBias} ariaLabel="bias voltage" />
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
      active={forward}
      state={
        forward
          ? 'Forward bias · barrier narrowed'
          : reverse
            ? 'Reverse bias · barrier widened'
            : 'Equilibrium · built-in barrier'
      }
      metrics={[
        {
          label: 'Diode current',
          value: Math.abs(Id) < 0.05 ? '≈ 0' : `${Id.toFixed(1)} mA`,
        },
        { label: 'Depletion width', value: `${Math.round(2 * w)} units` },
      ]}
      explanation={
        forward
          ? 'Near turn-on, the depletion barrier narrows and carriers cross the junction and recombine.'
          : 'The depletion region contains few mobile carriers. Reverse bias widens that barrier and suppresses current.'
      }
    />
  );

  // mastery: the learner forward-biased the junction so the barrier collapses and
  // current floods across (the diode conducts), not just held it at equilibrium/reverse.
  useCheckpoint({ solved: forward, activity: `semiconductor:${activityId}` });

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
          <span>{forward ? 'forward conducting' : reverse ? 'reverse blocking' : 'equilibrium'}</span>
          <span>bias {bias.toFixed(2)} V</span>
          <span>{Math.abs(Id) < 0.05 ? '≈ 0 mA' : `${Id.toFixed(1)} mA`}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        forward
          ? 'Forward bias narrows the carrier-free barrier; electrons and holes cross and recombine.'
          : reverse
            ? 'Reverse bias pulls mobile carriers away from the junction, widening the carrier-free barrier.'
            : 'Diffusion exposes fixed ions at the junction; their electric field opposes further carrier motion.'
      }
      transcript={
        <p>
          The junction is{' '}
          {forward
            ? 'forward biased and conducting'
            : reverse
              ? 'reverse biased and blocking'
              : 'near equilibrium'}
          , with bias {bias.toFixed(2)} volts and depletion half-width {w.toFixed(0)} model units.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="forward-tested"
            met={forward}
            complete={complete}
            outcome={`${bias.toFixed(2)} V bias`}
          />
          {scene}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
