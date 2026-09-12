'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { Segmented, Slider } from '../../../kit/controls.js';
import { Field, Readout } from '../../../kit/frame.js';
import { ExperimentTransport, useExperimentTimeline } from '../shared/experiment-transport.js';
import { fissionChainActivity } from './fission-activity.js';
import { simulateFissionChain } from './fission-core.js';
import { FissionExperimentScene } from './fission-scene.js';

export interface FissionChainLabProps {
  baseK?: number;
  controlInsertion?: number;
  generations?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}

export function FissionChainLab({
  baseK: initialBaseK = 1.35,
  controlInsertion: initialControl = 0.36,
  generations = 7,
  title = 'Chain reaction: keep every generation steady',
  prompt = 'Trace where each neutron goes, then adjust the absorber until one generation replaces itself.',
  objectives,
  activity,
}: FissionChainLabProps = {}): ReactNode {
  const [baseK, setBaseK] = useState(initialBaseK);
  const [control, setControl] = useState(initialControl);
  const [disturbed, setDisturbed] = useState(false);
  const state = simulateFissionChain({ baseK, controlInsertion: control, generationCount: generations });
  const stops = useMemo(
    () => Array.from({ length: generations }, (_, index) => index / Math.max(1, generations - 1)),
    [generations],
  );
  const timeline = useExperimentTimeline({ durationMs: generations * 650, stops });
  const selectedGeneration = Math.min(generations - 1, Math.floor(timeline.progress * generations));
  const selected = state.generations[selectedGeneration]!;
  const runtime =
    activity ?? (objectives ? { ...fissionChainActivity.source, objectives } : fissionChainActivity);
  const controls = (
    <>
      <Field label="control-rod insertion" value={`${Math.round(control * 100)}%`}>
        <Slider
          value={control}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => {
            timeline.reset();
            setControl(value);
          }}
          ariaLabel="neutron absorber insertion"
        />
      </Field>
      <Field label="reactor condition">
        <Segmented
          ariaLabel="reactor condition"
          // `baseK` is a free number, so an authored value off these three presets selects nothing,
          // exactly as the chip row did.
          value={baseK === 1.15 ? 'low' : baseK === 1.35 ? 'nominal' : baseK === 1.55 ? 'disturbance' : ''}
          onChange={(next) => {
            timeline.reset();
            if (next === 'disturbance') setDisturbed(true);
            setBaseK(next === 'low' ? 1.15 : next === 'disturbance' ? 1.55 : 1.35);
          }}
          options={[
            { value: 'low', label: 'low' },
            { value: 'nominal', label: 'nominal' },
            { value: 'disturbance', label: 'disturbance' },
          ]}
        />
      </Field>
      <ExperimentTransport
        timeline={timeline}
        label="generations"
        detail={`G${selectedGeneration} · k ${state.kEffective.toFixed(2)}`}
      />
    </>
  );
  const evidence = (
    <>
      <Readout
        value={`k = ${state.kEffective.toFixed(2)} · ${state.criticality}`}
        sub="average next-generation multiplier"
      />
      <div className="lab-metric-list">
        <div>
          <span>expected fissions</span>
          <strong>{state.totalExpectedFissions.toFixed(1)}</strong>
        </div>
        <div>
          <span>expected released energy</span>
          <strong>{state.totalExpectedEnergyMeV.toFixed(0)} MeV</strong>
        </div>
        <div>
          <span>selected generation continues</span>
          <strong>{selected.emittedNeutrons.toFixed(2)}</strong>
        </div>
      </div>
      <p>Expected-value teaching model—not an operational reactor model.</p>
    </>
  );
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtime}
      activityId="fission-chain"
      eyebrow="Modern physics · nuclear fission"
      title={title}
      description={prompt}
      status={
        <>
          <span>G{selectedGeneration}</span>
          <span>k {state.kEffective.toFixed(2)}</span>
          <span>{state.criticality}</span>
        </>
      }
      controls={controls}
      evidence={evidence}
      observation={
        state.criticality === 'critical'
          ? 'Each generation replaces itself on average.'
          : state.criticality === 'subcritical'
            ? 'Capture and leakage exceed replacement, so the chain fades.'
            : 'Replacement exceeds losses, so the chain grows.'
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="run-complete" met={timeline.progress >= 1} complete={complete} />
          <AuthoredMetricGate
            conditionId="restored"
            met={disturbed && state.criticality === 'critical'}
            complete={complete}
          />
          <FissionExperimentScene state={state} selectedGeneration={selectedGeneration} />
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
