'use client';
import { useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import {
  AuthoredActivityRuntime,
  AuthoredMetricGate,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import { Segmented, Slider } from '../../../kit/controls.js';
import { Field, Readout } from '../../../kit/frame.js';
import { lightClockActivity } from './activity.js';
import { lightClockState } from './core.js';
import { LightClockScene } from './light-clock.js';
import { SpacetimeDiagram } from './spacetime.js';
import { ExperimentTransport, useExperimentTimeline } from '../shared/experiment-transport.js';
export interface RelativityLightClockProps {
  beta?: number;
  properTick?: number;
  view?: 'experiment' | 'spacetime' | 'linked';
  betaMin?: number;
  betaMax?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}
export function RelativityLightClockLab({
  beta: initialBeta = 0.6,
  properTick = 2,
  view: initialView = 'experiment',
  betaMin = 0,
  betaMax = 0.95,
  title = 'Two light clocks: why moving time dilates',
  prompt = 'Follow the same emission, reflection, and return events from the ship and platform frames. Light keeps speed c; the measured interval changes.',
  objectives,
  activity,
}: RelativityLightClockProps = {}): ReactNode {
  const [beta, setBeta] = useState(initialBeta),
    [view, setView] = useState(initialView);
  const timeline = useExperimentTimeline({ durationMs: 4200, stops: [0, 0.5, 1] });
  const state = lightClockState(beta, properTick, timeline.progress),
    runtime = activity ?? (objectives ? { ...lightClockActivity.source, objectives } : lightClockActivity);
  const controls = (
    <>
      <Field label="view">
        <Segmented
          ariaLabel="view"
          value={view}
          onChange={setView}
          options={[
            { value: 'experiment', label: 'experiment' },
            { value: 'spacetime', label: 'spacetime' },
            { value: 'linked', label: 'linked' },
          ]}
        />
      </Field>
      <Field label="speed β" value={beta.toFixed(2)}>
        <Slider
          value={beta}
          min={Math.max(0, betaMin)}
          max={Math.min(0.995, betaMax)}
          step={0.01}
          onChange={(value) => {
            timeline.reset();
            setBeta(value);
          }}
          ariaLabel="speed as a fraction of light speed"
        />
      </Field>
      <ExperimentTransport
        timeline={timeline}
        label="light pulse"
        scrubAriaLabel="light clock event progress"
        detail={`${state.event} · ${Math.round(timeline.progress * 100)}%`}
      />
    </>
  );
  const evidence = (
    <>
      <Readout
        label="Lorentz factor"
        value={`γ = ${state.gamma.toFixed(3)}`}
        sub="1 / √(1 − β²) — also the ratio Δt / Δτ"
      />
      <div className="lab-metric-list">
        <div>
          <span>ship proper time Δτ</span>
          <strong>{state.properElapsed.toFixed(2)} s</strong>
        </div>
        <div>
          <span>platform coordinate time Δt</span>
          <strong>{state.coordinateElapsed.toFixed(2)} s</strong>
        </div>
      </div>
    </>
  );
  const showControls = (context: AuthoredActivityContext): ReactNode =>
    ['act', 'transfer'].includes(context.sequence.current.phase) ? controls : null;
  const showEvidence = (context: AuthoredActivityContext): ReactNode =>
    ['observe', 'explain', 'transfer'].includes(context.sequence.current.phase) ? evidence : null;
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtime}
      activityId="relativity-light-clock"
      eyebrow="Modern physics · special relativity"
      title={title}
      description={prompt}
      status={
        <>
          <span>β {state.beta.toFixed(2)}</span>
          <span>{state.event}</span>
        </>
      }
      controls={showControls}
      evidence={showEvidence}
      observation={`One ${properTick.toFixed(1)} s ship tick spans ${(state.gamma * properTick).toFixed(2)} s in the platform frame because light follows a longer path at the same speed c.`}
      transcript={
        <p>
          {state.event}. The ship clock reads {state.properElapsed.toFixed(2)} seconds and the platform frame
          assigns {state.coordinateElapsed.toFixed(2)} seconds. The moving clock events are separated by{' '}
          {state.shipX.toFixed(2)} light-seconds in the platform frame.
        </p>
      }
    >
      {(context) => {
        const phase = context.sequence.current.phase,
          activeView =
            phase === 'predict'
              ? 'experiment'
              : phase === 'observe' || phase === 'transfer'
                ? 'linked'
                : phase === 'explain'
                  ? 'spacetime'
                  : view;
        return (
          <>
            <AuthoredMetricGate
              conditionId="tick-complete"
              met={timeline.progress >= 1}
              complete={context.complete}
            />
            <div className={`modern-linked-scene modern-linked-scene--${activeView}`}>
              {activeView !== 'spacetime' && (
                <section aria-label="Light clock experiment">
                  <LightClockScene state={state} />
                </section>
              )}
              {activeView !== 'experiment' && (
                <section aria-label="Spacetime evidence">
                  <SpacetimeDiagram state={state} />
                </section>
              )}
            </div>
          </>
        );
      }}
    </AuthoredActivityRuntime>
  );
}
