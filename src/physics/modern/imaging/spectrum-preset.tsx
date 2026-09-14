'use client';
import { useMemo, useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { ActivitySelect, Slider } from '../../../kit/controls.js';
import { Field, Readout } from '../../../kit/frame.js';
import { xraySpectrumActivity } from './spectrum-activity.js';
import { ExperimentTransport, useExperimentTimeline } from '../shared/experiment-transport.js';
import { XraySpectrumExperimentScene } from './spectrum-scene.js';
import {
  createSpectrumPhotonCohort,
  XRAY_TARGETS,
  xraySpectrum,
  xraySpectrumExposureAt,
  type XrayTargetId,
} from './xray-spectrum-core.js';

export interface XrayTubeSpectrumLabProps {
  voltageKvp?: number;
  filtrationMmAl?: number;
  target?: XrayTargetId;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}
const TARGET_IDS = Object.keys(XRAY_TARGETS) as XrayTargetId[];

export function XrayTubeSpectrumLab({
  voltageKvp: initialVoltage = 90,
  filtrationMmAl: initialFilter = 2.5,
  target: initialTarget = 'tungsten',
  title = 'Inside an X-ray tube: shape the spectrum',
  prompt = 'Accelerate electrons into a target, inspect the photons they produce, then filter the low-energy part of the beam.',
  objectives,
  activity,
}: XrayTubeSpectrumLabProps = {}): ReactNode {
  const [voltage, setVoltage] = useState(initialVoltage),
    [filter, setFilter] = useState(initialFilter),
    [target, setTarget] = useState<XrayTargetId>(initialTarget);
  const state = xraySpectrum(voltage, filter, target);
  const cohort = useMemo(() => createSpectrumPhotonCohort(state, filter, 48), [state, filter]);
  const timeline = useExperimentTimeline({ durationMs: 5200, stops: [0, 0.25, 0.5, 0.75, 1] });
  const exposure = xraySpectrumExposureAt(cohort, timeline.progress);
  const controls = (
    <>
      <Field label="tube voltage" value={`${voltage.toFixed(0)} kVp`}>
        <Slider
          value={voltage}
          min={30}
          max={140}
          step={1}
          onChange={(value) => {
            timeline.reset();
            setVoltage(value);
          }}
          ariaLabel="tube voltage"
        />
      </Field>
      <Field label="aluminium filter" value={`${filter.toFixed(1)} mm Al`}>
        <Slider
          value={filter}
          min={0}
          max={6}
          step={0.1}
          onChange={(value) => {
            timeline.reset();
            setFilter(value);
          }}
          ariaLabel="aluminium filtration thickness"
        />
      </Field>
      <Field label="target">
        <ActivitySelect
          ariaLabel="target"
          value={target}
          onChange={(id) => {
            timeline.reset();
            setTarget(id);
          }}
          options={TARGET_IDS.map((id) => ({ value: id, label: XRAY_TARGETS[id].label }))}
        />
      </Field>
      <ExperimentTransport
        timeline={timeline}
        label="tube exposure"
        detail={`${exposure.detected}/${exposure.emitted} detected`}
      />
    </>
  );
  const evidence = (
    <>
      <Readout
        value={`${state.meanEnergyKev.toFixed(1)} keV mean energy`}
        sub={`${(state.removedFraction * 100).toFixed(0)}% of modeled photons removed by filtration`}
      />
      <div className="lab-metric-list">
        <div>
          <span>endpoint energy</span>
          <strong>{state.endpointKev.toFixed(0)} keV</strong>
        </div>
        <div>
          <span>target</span>
          <strong>{XRAY_TARGETS[target].label}</strong>
        </div>
        <div>
          <span>model</span>
          <strong>relative spectrum</strong>
        </div>
      </div>
      <p>This normalized teaching spectrum shows mechanisms and trends, not clinical output or dose.</p>
    </>
  );
  const runtime =
    activity ?? (objectives ? { ...xraySpectrumActivity.source, objectives } : xraySpectrumActivity);
  return (
    <AuthoredActivityRuntime
      className="physics-imaging"
      focusLayout="immersive"
      activity={runtime}
      activityId="xray-tube-spectrum"
      eyebrow="Modern physics · imaging"
      title={title}
      description={prompt}
      status={
        <>
          <span>{voltage.toFixed(0)} kVp</span>
          <span>{filter.toFixed(1)} mm Al</span>
          <span>mean {state.meanEnergyKev.toFixed(1)} keV</span>
        </>
      }
      controls={controls}
      evidence={evidence}
      observation={`The spectrum ends at ${state.endpointKev.toFixed(0)} keV because one electron cannot give a photon more energy than it gained through the tube voltage. Filtration removes the low-energy side preferentially.`}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="exposure-complete"
            met={timeline.progress >= 1}
            complete={complete}
          />
          <XraySpectrumExperimentScene state={state} exposure={exposure} />
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
