'use client';

import { useState, type ReactNode } from 'react';
import { Field } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Slider } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Tag } from '../../kit/electronics/index.js';
import { useCarrierSim, stepCarriers, type Carrier, type Box } from '../../kit/carrier-engine.js';
import { W, MUTED, sited, renderCarriers, Lead, Ion, DeviceEvidence } from './shared.js';
import { conductionActivity } from './transport-activity-plans.js';

export interface ConductionProps {
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
}

const CD = { x: 70, y: 100, w: 420, h: 120 };
const CD_MID = CD.y + CD.h / 2;

export function ConductionLab({
  title = 'Why current flows: electrons drifting in a field',
  prompt = 'A metal contains mobile electrons among a positively charged lattice. With no applied field their thermal motion has no net direction. Apply a voltage and a slow drift appears on top of that motion. For an ohmic sample held near constant temperature, current is proportional to voltage.',
  ask,
  activity = 'conduction',
}: ConductionProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'conduction';
  const authoredActivity = typeof activity === 'string' ? conductionActivity : activity;
  const [volts, setVolts] = useState(0);
  const Rohm = 50; // bar resistance
  const I = (volts / Rohm) * 1000; // mA (Ohm's law)
  const E = volts / 1; // field = V / length (length = 1 unit)
  const flowing = volts > 0.02;
  // drift velocity is DERIVED FROM THE FIELD (v = μE), not a hand-tuned constant
  const mu = 0.34; // mobility (px·tick⁻¹ per volt, for display)
  const vDriftPx = mu * E;

  const barBox: Box = {
    x: CD.x + 10,
    y: CD.y + 12,
    w: CD.w - 20,
    h: CD.h - 24,
  };
  const electrons = useCarrierSim(
    () =>
      Array.from({ length: 14 }, (_, i): Carrier => ({
        id: i,
        t: 'e',
        o: 1,
        box: barBox,
        ...sited(barBox, i + 1),
      })),
    (cs, step) => {
      // each electron's HOME conveyor-belts right at the field-driven drift speed (and wraps);
      // the electron jiggles thermally AROUND its moving home. So the thermal motion stays
      // evenly spread while the whole frame drifts right — drift on jiggle, no pile-up.
      const cs2 = cs.map((c) => {
        let hx = (c.hx ?? c.x) + vDriftPx;
        let x = c.x;
        if (hx > barBox.x + barBox.w - 4) {
          hx = barBox.x + 4;
          x = hx;
        } // home + electron re-enter at the − end
        return { ...c, hx, x };
      });
      return stepCarriers(cs2, step, barBox, {
        jitter: 1.1,
        speed: 0.9,
        damp: 0.82,
        spring: 0.06,
      });
    },
    true,
    'conduction',
  );

  // fixed positive ion cores the electrons scatter off (the origin of resistance)
  const ions: ReactNode[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 6; c++)
      ions.push(<Ion key={`ion${r}-${c}`} x={CD.x + 44 + c * 66} y={CD.y + 30 + r * 30} sign="+" />);

  const scene = (
    <div className="semiconductor-scene">
      <svg
        viewBox={`0 0 ${W} 300`}
        width="100%"
        role="img"
        aria-label={`conductor, ${flowing ? 'voltage applied, electrons drift, current flows' : 'no voltage, no current'}`}
      >
        <rect
          x={CD.x}
          y={CD.y}
          width={CD.w}
          height={CD.h}
          rx={8}
          fill="color-mix(in oklab, var(--stage-metal) 16%, var(--stage-bg))"
          stroke="var(--stage-metal)"
          strokeWidth={1}
        />
        {/* terminals */}
        <Lead x={CD.x} y1={CD_MID} y2={CD.y - 18} label="−" sub="0 V" color={MUTED} />
        <Lead
          x={CD.x + CD.w}
          y1={CD_MID}
          y2={CD.y - 18}
          label="+"
          sub={`${volts.toFixed(1)} V`}
          color={flowing ? 'var(--stage-good)' : MUTED}
        />
        {/* the field E points + → − (right → left); electrons drift the OTHER way */}
        {flowing && (
          <g>
            <line
              x1={CD.x + CD.w / 2 + 30}
              y1={CD.y - 6}
              x2={CD.x + CD.w / 2 - 30}
              y2={CD.y - 6}
              stroke="var(--stage-muted)"
              strokeWidth={1.4}
              markerEnd="url(#stage-arrow)"
            />
            <Tag x={CD.x + CD.w / 2} y={CD.y - 12} text="field E" color={MUTED} size={10} weight={500} />
          </g>
        )}
        <Tag
          x={CD.x + CD.w / 2}
          y={CD.y + CD.h + 18}
          text="conductor: free electrons (−) in fixed + ion cores"
          color={MUTED}
          size={11}
          weight={500}
        />
        {ions}
        {renderCarriers(electrons)}
      </svg>
    </div>
  );

  const controls = (
    <>
      <Field label="applied voltage" value={`${volts.toFixed(1)} V`}>
        <Slider value={volts} min={0} max={5} step={0.1} onChange={setVolts} ariaLabel="applied voltage" />
      </Field>
    </>
  );

  const aside = (
    <DeviceEvidence
      active={flowing}
      state={flowing ? 'Net drift · conventional current flows' : 'Thermal motion · no net drift'}
      metrics={[
        { label: 'Electric field E = V/L', value: E.toFixed(1) },
        { label: 'Drift velocity v = μE', value: vDriftPx.toFixed(2) },
        {
          label: 'Current I = V/R',
          value: I < 0.05 ? '≈ 0' : `${I.toFixed(1)} mA`,
        },
      ]}
      explanation="The field adds a small net drift to rapid thermal motion. Scattering from the lattice, impurities, and boundaries limits drift and produces resistance."
    />
  );

  // mastery: the learner applied a voltage so the field gives the electrons a net
  // drift on top of the jiggle, current flows (Ohm's law from the inside).
  useCheckpoint({ solved: flowing, activity: `semiconductor:${activityId}` });

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={authoredActivity}
      activityId={activityId}
      eyebrow="Charge transport"
      title={title}
      description={prompt}
      status={
        <>
          <span>{flowing ? 'net drift' : 'thermal motion only'}</span>
          <span>{I.toFixed(1)} mA</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation="In this constant-temperature ohmic model, voltage sets the field, the field biases electron motion into a drift, and scattering limits that drift."
      transcript={
        <p>
          Applied voltage {volts.toFixed(1)} volts. Electric field {E.toFixed(1)} display units; electron
          drift {vDriftPx.toFixed(2)} display units; current {I.toFixed(1)} milliamps.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="current-made"
            met={flowing}
            complete={complete}
            outcome={`${volts.toFixed(1)} V`}
          />
          {scene}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
