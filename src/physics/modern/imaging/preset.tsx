'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { Slider } from '../../../kit/controls.js';
import { Field, Readout } from '../../../kit/frame.js';
import { xrayAttenuationActivity } from './activity.js';
import { ExperimentTransport, useExperimentTimeline } from '../shared/experiment-transport.js';
import { createXrayPhotonCohort, xrayExposureAt, xrayImageState } from './xray-core.js';
import { XrayAttenuationScene } from './xray-scene.js';

export interface XrayAttenuationLabProps {
  energyKev?: number;
  tissueThicknessCm?: number;
  boneThicknessCm?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

export function XrayAttenuationLab({
  energyKev: initialEnergy = 60,
  tissueThicknessCm: initialTissue = 12,
  boneThicknessCm: initialBone = 1,
  title = 'X-ray contrast: what reaches the detector?',
  prompt = 'Send the same beam through soft tissue and a bone insert. Compare raw detector exposure with the inverted radiograph image.',
  objectives,
  activity,
}: XrayAttenuationLabProps = {}): ReactNode {
  const [energy, setEnergy] = useState(initialEnergy);
  const [tissue, setTissue] = useState(initialTissue);
  const [bone, setBone] = useState(initialBone);
  const state = xrayImageState(energy, tissue, bone);
  const cohort = useMemo(() => createXrayPhotonCohort(30), []);
  const timeline = useExperimentTimeline({ durationMs: 4200, stops: [0, 0.33, 0.66, 1] });
  const exposure = xrayExposureAt(state, cohort, timeline.progress);
  const runtime =
    activity ?? (objectives ? { ...xrayAttenuationActivity.source, objectives } : xrayAttenuationActivity);
  const controls = (
    <>
      <Field label="photon energy" value={`${energy.toFixed(0)} keV`}>
        <Slider
          value={energy}
          min={30}
          max={120}
          step={1}
          onChange={(value) => {
            timeline.reset();
            setEnergy(value);
          }}
          ariaLabel="X-ray photon energy"
        />
      </Field>
      <Field label="soft-tissue path" value={`${tissue.toFixed(1)} cm`}>
        <Slider
          value={tissue}
          min={1}
          max={30}
          step={0.5}
          onChange={(value) => {
            timeline.reset();
            setTissue(value);
          }}
          ariaLabel="soft tissue thickness"
        />
      </Field>
      <Field label="bone insert" value={`${bone.toFixed(1)} cm`}>
        <Slider
          value={bone}
          min={0}
          max={4}
          step={0.1}
          onChange={(value) => {
            timeline.reset();
            setBone(value);
          }}
          ariaLabel="bone thickness"
        />
      </Field>
      <ExperimentTransport
        timeline={timeline}
        label="exposure"
        detail={`${exposure.tissueDetected + exposure.boneDetected} photons detected`}
      />
    </>
  );
  const evidence = (
    <>
      <Readout
        value={`${percent(state.detectorContrast)} detector contrast`}
        sub="difference in transmitted incident intensity"
      />
      <div className="lab-metric-list">
        <div>
          <span>tissue-only path</span>
          <strong>{percent(state.tissueTransmission)}</strong>
        </div>
        <div>
          <span>path through bone</span>
          <strong>{percent(state.bonePathTransmission)}</strong>
        </div>
        <div>
          <span>display convention</span>
          <strong>less exposure → lighter</strong>
        </div>
      </div>
      <p>
        Preset coefficients are an illustrative energy-dependent model, not clinical exposure or diagnostic
        guidance. Authors can use the exact attenuation kernel with sourced coefficients.
      </p>
    </>
  );
  return (
    <AuthoredActivityRuntime
      className="physics-imaging"
      focusLayout="immersive"
      activity={runtime}
      activityId="xray-attenuation"
      eyebrow="Modern physics · imaging"
      title={title}
      description={prompt}
      status={
        <>
          <span>{energy.toFixed(0)} keV</span>
          <span>contrast {percent(state.detectorContrast)}</span>
        </>
      }
      controls={controls}
      evidence={evidence}
      observation={`The bone path transmits ${percent(state.bonePathTransmission)}, compared with ${percent(state.tissueTransmission)} through tissue alone. The detector measures exposure; the radiograph display inverts it.`}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="exposure-complete"
            met={timeline.progress >= 1}
            complete={complete}
          />
          <XrayAttenuationScene state={state} exposure={exposure} />
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
