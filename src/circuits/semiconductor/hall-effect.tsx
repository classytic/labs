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
  inBox,
  type Carrier,
  type CType,
  type Box,
} from '../../kit/carrier-engine.js';
import { W, ELEC, HOLE, MUTED, sited, renderCarriers, DeviceEvidence } from './shared.js';
import { hallEffectActivity } from './transport-activity-plans.js';

export interface HallProps {
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
}

const HB = { x: 80, y: 100, w: 400, h: 128 };
const HB_MID = HB.y + HB.h / 2;

export function HallEffectLab({
  title = 'The Hall effect: are the carriers electrons or holes?',
  prompt = 'Push a conventional current through a strip in a magnetic field. Carriers move sideways until a transverse electric field balances the magnetic force. With V_H defined here as top-edge potential minus bottom-edge potential, its sign distinguishes electron from hole conduction.',
  ask,
  activity = 'hall-effect',
}: HallProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'hall-effect';
  const authoredActivity = typeof activity === 'string' ? hallEffectActivity : activity;
  const [holes, setHoles] = useState(false); // false = electrons (n-type), true = holes (p-type)
  const [bField, setBField] = useState(0.6); // + = into the page
  const reduceB = Math.abs(bField) < 0.05;
  const I = 30; // current (mA), the longitudinal current (fixed)
  const VH = bField * (holes ? 1 : -1); // sign: + for holes, − for electrons (same current + B)
  const carrierT: CType = holes ? 'h' : 'e';
  // both carrier types deflect to the SAME edge (top for B into page); only the SIGN of the
  // charge that lands there differs → opposite Hall voltage.
  const topEdge = bField >= 0;

  const box: Box = { x: HB.x + 8, y: HB.y + 10, w: HB.w - 16, h: HB.h - 20 };
  const carriers = useCarrierSim(
    () =>
      Array.from({ length: 16 }, (_, i): Carrier => ({
        id: i,
        t: carrierT,
        o: 1,
        box,
        ...sited(box, i + 1),
      })),
    (cs, step) => {
      const driftX = (holes ? 1 : -1) * 1.1; // holes drift +x with the current, electrons −x
      const edgeY = topEdge ? box.y + 14 : box.y + box.h - 14;
      const defl = Math.min(0.85, Math.abs(bField)); // how far carriers are pushed toward that edge
      const cs2 = cs.map((c) => {
        let hx = (c.hx ?? c.x) + driftX; // conveyor home (longitudinal current), wraps
        if (hx > box.x + box.w - 4) hx = box.x + 4;
        if (hx < box.x + 4) hx = box.x + box.w - 4;
        const lane = inBox(box, c.id + 1).y; // the carrier's original transverse lane
        const hy = lane + (edgeY - (box.y + box.h / 2)) * defl; // bias toward the deflection edge ∝ B
        return { ...c, hx, hy };
      });
      return stepCarriers(cs2, step, box, {
        jitter: 0.9,
        speed: 0.9,
        damp: 0.82,
        spring: 0.06,
      });
    },
    true,
    `${holes}`,
  );

  // magnetic-field background symbols (× into page, • out of page)
  const bSyms: ReactNode[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 7; c++) {
      const x = HB.x + 34 + c * 56,
        y = HB.y + 26 + r * 38;
      bSyms.push(
        bField >= 0 ? (
          <g key={`b${r}-${c}`} className="electronics-svg-passive" opacity={reduceB ? 0.12 : 0.3}>
            <line x1={x - 3} y1={y - 3} x2={x + 3} y2={y + 3} stroke="var(--stage-muted)" strokeWidth={1} />
            <line x1={x - 3} y1={y + 3} x2={x + 3} y2={y - 3} stroke="var(--stage-muted)" strokeWidth={1} />
          </g>
        ) : (
          <circle key={`b${r}-${c}`} cx={x} cy={y} r={1.6} fill="var(--stage-muted)" opacity={0.3} />
        ),
      );
    }

  const edgeCharge = (top: boolean): ReactNode => {
    if (reduceB) return null;
    const here = top === topEdge; // the deflection edge
    const sign = here ? (holes ? '+' : '−') : holes ? '−' : '+';
    const col = sign === '+' ? HOLE : ELEC;
    const y = top ? HB.y - 4 : HB.y + HB.h + 12;
    return (
      <Tag
        x={HB.x + HB.w / 2}
        y={y}
        text={`${sign} ${sign} ${sign} ${sign} ${sign}`}
        color={col}
        size={13}
        weight={700}
      />
    );
  };

  const scene = (
    <div className="semiconductor-scene">
      <svg
        viewBox={`0 0 ${W} 300`}
        width="100%"
        role="img"
        aria-label={`Hall bar, ${holes ? 'holes' : 'electrons'}, field ${bField >= 0 ? 'into' : 'out of'} page`}
      >
        <rect
          x={HB.x}
          y={HB.y}
          width={HB.w}
          height={HB.h}
          rx={8}
          fill="color-mix(in oklab, var(--stage-metal) 12%, var(--stage-bg))"
          stroke="var(--stage-metal)"
          strokeWidth={1}
        />
        {bSyms}
        {/* current direction (conventional, +x) */}
        <g>
          <line
            x1={HB.x - 36}
            y1={HB_MID}
            x2={HB.x - 6}
            y2={HB_MID}
            stroke="var(--stage-good)"
            strokeWidth={2}
            markerEnd="url(#stage-arrow)"
          />
          <Tag
            x={HB.x - 40}
            y={HB_MID - 6}
            text="I"
            color="var(--stage-good)"
            size={11}
            weight={700}
            anchor="end"
          />
        </g>
        <line
          x1={HB.x + HB.w + 6}
          y1={HB_MID}
          x2={HB.x + HB.w + 30}
          y2={HB_MID}
          stroke="var(--stage-good)"
          strokeWidth={2}
          markerEnd="url(#stage-arrow)"
        />
        {edgeCharge(true)}
        {edgeCharge(false)}
        <Tag
          x={HB.x + HB.w / 2}
          y={HB.y + HB.h + 28}
          text={`B field ${bField >= 0 ? 'into the page (×)' : 'out of the page (•)'} · carriers: ${holes ? 'holes (+)' : 'electrons (−)'}`}
          color={MUTED}
          size={10.5}
          weight={500}
        />
        {renderCarriers(carriers)}
      </svg>
    </div>
  );

  const controls = (
    <>
      <Field label="carrier type">
        <div className="semiconductor-choice-row">
          <Chip selected={!holes} onClick={() => setHoles(false)}>
            electrons (n)
          </Chip>
          <Chip selected={holes} onClick={() => setHoles(true)}>
            holes (p)
          </Chip>
        </div>
      </Field>
      <Field label="magnetic field" value={reduceB ? 'off' : bField >= 0 ? 'into page' : 'out of page'}>
        <Slider value={bField} min={-1} max={1} step={0.05} onChange={setBField} ariaLabel="magnetic field" />
      </Field>
    </>
  );

  const aside = (
    <DeviceEvidence
      active={!reduceB}
      state={
        reduceB
          ? 'No magnetic field · no transverse voltage'
          : `${holes ? 'Holes' : 'Electrons'} accumulate at the edge`
      }
      metrics={[
        {
          label: (
            <>
              Hall voltage V<sub>H</sub>
            </>
          ),
          value: reduceB ? '≈ 0' : VH > 0 ? 'positive' : 'negative',
        },
      ]}
      explanation={
        <>
          The force bends both carrier types toward the same edge, but their charge signs produce opposite
          Hall voltages: negative identifies electron conduction; positive identifies hole conduction.
        </>
      }
    />
  );

  // mastery: the learner turned the magnetic field on so the carriers bend, charge
  // piles on one edge and a transverse Hall voltage appears (the carrier-type measurement).
  useCheckpoint({ solved: !reduceB, activity: `semiconductor:${activityId}` });

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={authoredActivity}
      activityId={activityId}
      eyebrow="Semiconductor measurements"
      title={title}
      description={prompt}
      status={
        <>
          <span>{holes ? 'hole carriers' : 'electron carriers'}</span>
          <span>Vh {reduceB ? '≈ 0' : VH > 0 ? 'positive' : 'negative'}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation="For fixed conventional current and field, both carrier types deflect toward the same edge; the charge accumulated there—and therefore the Hall-voltage polarity—changes sign."
      transcript={
        <p>
          {holes ? 'Hole' : 'Electron'} carriers with magnetic field{' '}
          {reduceB ? 'off' : bField >= 0 ? 'into the page' : 'out of the page'}. V top minus V bottom is{' '}
          {reduceB ? 'approximately zero' : VH > 0 ? 'positive' : 'negative'}.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="field-tested"
            met={!reduceB}
            complete={complete}
            outcome={`${bField.toFixed(2)} field`}
          />
          <AuthoredMetricGate
            conditionId="carrier-compared"
            met={sequence.current.id === 'transfer' && holes && !reduceB}
            complete={complete}
            outcome="positive Hall polarity"
          />
          {scene}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
