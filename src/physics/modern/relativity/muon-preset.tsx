'use client';
import { useMemo, useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { Slider } from '../../../kit/controls.js';
import { Field, Readout } from '../../../kit/frame.js';
import { muonSurvivalActivity } from './muon-activity.js';
import { ExperimentTransport, useExperimentTimeline } from '../shared/experiment-transport.js';
import { createMuonCohort, muonExperimentAt, muonSurvivalState } from './muon-core.js';
import { MuonAtmosphereScene } from './muon-scene.js';
export interface MuonSurvivalLabProps {
  beta?: number;
  altitudeKm?: number;
  population?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}
export function MuonSurvivalLab({
  beta: initialBeta = 0.995,
  altitudeKm: initialAltitude = 10,
  population = 1000,
  title = 'Muon mystery: particles that outlive the atmosphere',
  prompt = 'Cosmic rays create short-lived muons high above Earth. Compare the prediction without time dilation with what a clock travelling beside the muon records.',
  objectives,
  activity,
}: MuonSurvivalLabProps = {}): ReactNode {
  const [beta, setBeta] = useState(initialBeta),
    [altitudeKm, setAltitudeKm] = useState(initialAltitude),
    state = muonSurvivalState(beta, altitudeKm * 1000, population),
    runtime =
      activity ?? (objectives ? { ...muonSurvivalActivity.source, objectives } : muonSurvivalActivity);
  const cohort = useMemo(() => createMuonCohort(24), []);
  const timeline = useExperimentTimeline({ durationMs: 5200, stops: [0, 0.25, 0.5, 0.75, 1] });
  const experiment = muonExperimentAt(state, cohort, timeline.progress);
  const controls = (
    <>
      <Field label="speed β = v/c" value={state.beta.toFixed(3)}>
        <Slider
          value={beta}
          min={0.8}
          max={0.995}
          step={0.001}
          onChange={(value) => {
            timeline.reset();
            setBeta(value);
          }}
          ariaLabel="muon speed as a fraction of light speed"
        />
      </Field>
      <Field label="production altitude" value={`${altitudeKm.toFixed(1)} km`}>
        <Slider
          value={altitudeKm}
          min={1}
          max={20}
          step={0.5}
          onChange={(value) => {
            timeline.reset();
            setAltitudeKm(value);
          }}
          ariaLabel="muon production altitude in kilometres"
        />
      </Field>
      <ExperimentTransport
        timeline={timeline}
        label="muon flight"
        detail={`${Math.round(timeline.progress * 100)}% of journey`}
      />
    </>
  );
  const evidence = (
    <>
      <Readout
        value={`${(state.survivalProbability * 100).toFixed(1)}% reach Earth`}
        sub={`about ${state.expectedSurvivors.toFixed(0)} of ${population}`}
      />
      <div className="lab-metric-list">
        <div>
          <span>without time dilation</span>
          <strong>{(state.classicalSurvivalProbability * 100).toFixed(3)}%</strong>
        </div>
        <div>
          <span>Earth-frame journey</span>
          <strong>{(state.earthTravelTimeS * 1e6).toFixed(1)} μs</strong>
        </div>
        <div>
          <span>muon proper time</span>
          <strong>{(state.properTravelTimeS * 1e6).toFixed(1)} μs</strong>
        </div>
      </div>
      <p>Detector counts fluctuate; these are expected fractions from the decay law.</p>
    </>
  );
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtime}
      activityId="muon-survival"
      eyebrow="Modern physics · evidence for relativity"
      title={title}
      description={prompt}
      status={
        <>
          <span>β {state.beta.toFixed(3)}</span>
          <span>γ {state.gamma.toFixed(2)}</span>
        </>
      }
      controls={controls}
      evidence={evidence}
      observation="The muon lives through less proper time than Earth clocks measure for the trip, so far more survive than the decay law predicts without dilation."
      transcript={
        <p>
          Muons begin {altitudeKm.toFixed(1)} kilometres above the detector at {state.beta.toFixed(3)} c.
          Earth records {(state.earthTravelTimeS * 1e6).toFixed(1)} microseconds, while the muon experiences{' '}
          {(state.properTravelTimeS * 1e6).toFixed(1)} microseconds.
        </p>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="run-complete" met={timeline.progress >= 1} complete={complete} />
          <MuonAtmosphereScene state={state} population={population} experiment={experiment} />
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
