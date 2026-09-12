'use client';
import { useState, type ComponentType, type ReactNode } from 'react';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { Segmented, Slider } from '../../kit/controls.js';
import { Field, Readout, SceneViewport } from '../../kit/frame.js';
import { orbitalOverlapActivity } from './activity.js';
import { OVERLAP_FACTS, overlapStrength, type OverlapMode, type OverlapPhase } from './core.js';
export interface OrbitalOverlapSceneProps {
  mode: OverlapMode;
  phase: OverlapPhase;
  separation: number;
  yaw: number;
  pitch: number;
}
export type OrbitalOverlapSceneRenderer = ComponentType<OrbitalOverlapSceneProps>;
export interface OrbitalOverlapProps {
  mode?: OverlapMode;
  phase?: OverlapPhase;
  separation?: number;
  yaw?: number;
  pitch?: number;
  title?: string;
  prompt?: string;
  sceneRenderer?: OrbitalOverlapSceneRenderer;
}
export function OrbitalOverlapProjectedScene({
  mode,
  phase,
  separation,
}: OrbitalOverlapSceneProps): ReactNode {
  const pi = mode === 'p-p-pi',
    s = mode === 's-s-sigma',
    gap = 52 + separation * 24,
    same = phase === 'bonding';
  return (
    <svg
      viewBox="0 0 560 300"
      width="100%"
      role="img"
      aria-label={`${OVERLAP_FACTS[mode].label}, ${phase} overlap`}
    >
      <line x1="55" y1="150" x2="505" y2="150" stroke="var(--stage-grid)" strokeDasharray="5 5" />
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${280 + side * gap} 150)`}>
          {(s ? [0] : pi ? [-1, 1] : [side]).map((v, i) => (
            <ellipse
              key={i}
              cx={pi ? 0 : v * 36}
              cy={pi ? v * 48 : 0}
              rx={pi ? 42 : s ? 48 : 55}
              ry={pi ? 30 : s ? 42 : 28}
              fill={(side === 1 && !same) || (pi && v < 0) ? 'var(--stage-accent-2)' : 'var(--stage-accent)'}
              opacity=".5"
            />
          ))}
          <circle r="7" fill="var(--stage-warn)" />
        </g>
      ))}
      {phase === 'antibonding' && (
        <line
          x1="280"
          y1="55"
          x2="280"
          y2="245"
          stroke="var(--stage-fg)"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
      )}
      <text x="280" y="278" textAnchor="middle" fill="var(--stage-muted)" fontSize="12">
        {phase === 'bonding'
          ? 'constructive overlap · density builds between nuclei'
          : 'destructive overlap · node between nuclei'}
      </text>
    </svg>
  );
}
export function OrbitalOverlapLab({
  mode: initialMode = 'p-p-pi',
  phase: initialPhase = 'bonding',
  separation: initialSeparation = 1.6,
  yaw: initialYaw = 20,
  pitch: initialPitch = -12,
  title = 'Orbital overlap: where σ and π bonds come from',
  prompt = 'Align two orbitals, switch their relative phase, and watch constructive overlap build a bond—or destructive overlap create a node.',
  sceneRenderer: Scene,
}: OrbitalOverlapProps = {}): ReactNode {
  const [mode, setMode] = useState(initialMode),
    [phase, setPhase] = useState(initialPhase),
    [separation, setSeparation] = useState(initialSeparation),
    [yaw, setYaw] = useState(initialYaw),
    [pitch, setPitch] = useState(initialPitch);
  const facts = OVERLAP_FACTS[mode],
    strength = overlapStrength(mode, separation, phase),
    props = { mode, phase, separation, yaw, pitch };
  const controls = (
    <>
      <Field label="overlap">
        <Segmented
          ariaLabel="overlap"
          value={mode}
          onChange={setMode}
          options={(Object.keys(OVERLAP_FACTS) as OverlapMode[]).map((k) => ({
            value: k,
            label: OVERLAP_FACTS[k].label,
          }))}
        />
      </Field>
      <Field label="relative phase">
        <Segmented
          ariaLabel="relative phase"
          value={phase}
          onChange={setPhase}
          options={[
            { value: 'bonding', label: 'same · bonding' },
            { value: 'antibonding', label: 'opposite · antibonding' },
          ]}
        />
      </Field>
      <Field label="nuclear separation" value={separation.toFixed(1)}>
        <Slider
          value={separation}
          min={0.5}
          max={3}
          step={0.1}
          onChange={setSeparation}
          ariaLabel="nuclear separation"
        />
      </Field>
      <Field label="rotate" value={`${yaw}°`}>
        <Slider value={yaw} min={-180} max={180} step={5} onChange={setYaw} ariaLabel="horizontal rotation" />
      </Field>
      <Field label="tilt" value={`${pitch}°`}>
        <Slider value={pitch} min={-70} max={70} step={5} onChange={setPitch} ariaLabel="vertical tilt" />
      </Field>
    </>
  );
  const evidence = (
    <>
      <Readout value={`${phase} ${facts.bond} combination`} sub={facts.overlap} />
      <div className="lab-metric-list">
        <div>
          <span>qualitative overlap</span>
          <strong>{strength.toFixed(2)}</strong>
        </div>
        <div>
          <span>symmetry</span>
          <strong>{facts.bond}</strong>
        </div>
        <div>
          <span>bond-axis nodal planes</span>
          <strong>{facts.nodalPlanes}</strong>
        </div>
      </div>
      <p>
        Orbital colours encode wavefunction phase, not charge. Bonding combinations raise electron density
        between nuclei; antibonding combinations introduce a node there.
      </p>
    </>
  );
  return (
    <AuthoredActivityRuntime
      activity={orbitalOverlapActivity}
      activityId="orbital-overlap"
      focusLayout="immersive"
      eyebrow="Chemical bonding"
      title={title}
      description={prompt}
      status={
        <>
          <span>{facts.bond} overlap</span>
          <span>{phase}</span>
          <span>strength {strength.toFixed(2)}</span>
        </>
      }
      controls={controls}
      evidence={evidence}
      observation={`${facts.label} produces a ${facts.bond} combination. ${phase === 'bonding' ? 'Same phase reinforces density between the nuclei.' : 'Opposite phase cancels at the midpoint and creates an antibonding node.'}`}
      transcript={
        <p>
          {facts.label}, {phase}. The orbital separation is {separation.toFixed(1)} relative units and the
          qualitative overlap is {strength.toFixed(2)}.
        </p>
      }
    >
      <SceneViewport size="wide" label={`${facts.label} orbital overlap model`}>
        {Scene ? <Scene {...props} /> : <OrbitalOverlapProjectedScene {...props} />}
      </SceneViewport>
    </AuthoredActivityRuntime>
  );
}
