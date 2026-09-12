'use client';
import { useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { Slider } from '../../../kit/controls.js';
import { Field, Readout } from '../../../kit/frame.js';
import { Ball, FigText, Figure, Guide, HUE } from '../../../kit/figure/index.js';
import { lengthContractionActivity } from './length-activity.js';
import { lengthContractionState } from './length-core.js';
import { MeasurementLine, Spacecraft } from './scene-primitives.js';
import { ExperimentTransport, useExperimentTimeline } from '../shared/experiment-transport.js';
export interface LengthContractionLabProps {
  beta?: number;
  properLengthM?: number;
  title?: string;
  prompt?: string;
  activity?: AuthoredActivity;
}

const W = 720;
const H = 316;
const X0 = 100;
const REST_Y = 44;
const PLATFORM_Y = 196;

export function LengthContractionLab({
  beta: initial = 0.8,
  properLengthM: initialLength = 100,
  title = 'Measure a moving spacecraft: length needs a shared now',
  prompt = 'Mark the rear and front at the same platform time. Transform those two measurement events and discover why they do not define the proper length in the spacecraft frame.',
  activity,
}: LengthContractionLabProps = {}): ReactNode {
  const [beta, setBeta] = useState(initial),
    [properLength, setProperLength] = useState(initialLength),
    s = lengthContractionState(beta, properLength),
    restWidth = 520;
  const timeline = useExperimentTimeline({ durationMs: 3400, stops: [0, 0.5, 1] });
  const contractedWidth = (restWidth * s.contractedLengthM) / s.properLengthM;
  const platformWidth = restWidth + (contractedWidth - restWidth) * timeline.progress;
  const measured = properLength + (s.contractedLengthM - properLength) * timeline.progress;
  const markFlash = timeline.progress >= 1 ? 1 : 0;
  const controls = (
      <>
        <Field label="speed β = v/c" value={beta.toFixed(2)}>
          <Slider
            value={beta}
            min={0}
            max={0.95}
            step={0.01}
            onChange={(value) => {
              timeline.reset();
              setBeta(value);
            }}
            ariaLabel="spacecraft speed as a fraction of light speed"
          />
        </Field>
        <Field label="proper length L₀" value={`${properLength.toFixed(0)} m`}>
          <Slider
            value={properLength}
            min={20}
            max={140}
            step={5}
            onChange={(value) => {
              timeline.reset();
              setProperLength(value);
            }}
            ariaLabel="spacecraft proper length"
          />
        </Field>
        <ExperimentTransport
          timeline={timeline}
          label="endpoint measurement"
          detail={`${Math.round(timeline.progress * 100)}% · ${s.contractedLengthM.toFixed(1)} m`}
        />
      </>
    ),
    evidence = (
      <>
        <Readout
          label="platform length"
          value={`L = ${s.contractedLengthM.toFixed(1)} m`}
          sub={`L₀ / γ · γ = ${s.gamma.toFixed(3)}`}
        />
        <div className="lab-metric-list">
          <div>
            <span>proper/rest length L₀</span>
            <strong>{s.properLengthM.toFixed(1)} m</strong>
          </div>
          <div>
            <span>same marks in rod frame Δt′</span>
            <strong>{s.rodTimeOffsetNs.toFixed(1)} ns</strong>
          </div>
        </div>
      </>
    );
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={activity ?? lengthContractionActivity}
      activityId="length-contraction"
      eyebrow="Modern physics · special relativity"
      title={title}
      description={prompt}
      status={
        <>
          <span>β {s.beta.toFixed(2)}</span>
          <span>γ {s.gamma.toFixed(2)}</span>
        </>
      }
      controls={controls}
      evidence={evidence}
      observation={`The platform’s simultaneous endpoint marks are ${s.contractedLengthM.toFixed(1)} m apart. In the spacecraft frame those same events differ by ${Math.abs(s.rodTimeOffsetNs).toFixed(1)} ns, so they cannot define its rest length.`}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="measurement-complete"
            met={timeline.progress >= 1}
            complete={complete}
          />
          <Figure
            viewBox={[W, H]}
            domain="physics"
            label={`${properLength.toFixed(0)} metre spacecraft measured as ${s.contractedLengthM.toFixed(1)} metres at ${beta.toFixed(2)} c`}
          >
            {/* rest frame */}
            <FigText x={X0} y={32} size="eyebrow" tone="soft">
              spacecraft rest frame
            </FigText>
            <Spacecraft x={X0} y={REST_Y} width={restWidth} />
            <MeasurementLine
              x1={X0}
              x2={X0 + restWidth}
              y={126}
              label={`L₀ = ${properLength.toFixed(0)} m`}
            />

            {/* platform frame: both ends marked at the same platform time */}
            <FigText x={X0} y={184} size="eyebrow" tone="soft">
              platform frame · one snapshot
            </FigText>
            <FigText x={X0 + restWidth} y={184} anchor="end" size="note" tone="soft">
              both marks at platform t = 0
            </FigText>
            <Spacecraft x={X0} y={PLATFORM_Y} width={platformWidth} accent />
            <g opacity={0.35 + timeline.progress * 0.65}>
              <Guide x1={X0} y1={PLATFORM_Y - 6} x2={X0} y2={284} color={HUE[2]} />
              <Guide
                x1={X0 + platformWidth}
                y1={PLATFORM_Y - 6}
                x2={X0 + platformWidth}
                y2={284}
                color={HUE[2]}
              />
            </g>
            <Ball cx={X0} cy={PLATFORM_Y + 26} r={5} color={HUE[2]} flash={markFlash} flashColor={HUE[2]} />
            <Ball
              cx={X0 + platformWidth}
              cy={PLATFORM_Y + 26}
              r={5}
              color={HUE[2]}
              flash={markFlash}
              flashColor={HUE[2]}
            />
            <MeasurementLine
              x1={X0}
              x2={X0 + platformWidth}
              y={300}
              label={`L = ${measured.toFixed(1)} m`}
              tone={HUE[2]}
              labelTone="hue-2"
            />
          </Figure>
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
