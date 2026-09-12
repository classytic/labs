'use client';

import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { ActivitySelect, Segmented, Slider } from '../../kit/controls.js';
import { Field, Readout, SceneViewport } from '../../kit/frame.js';
import { atomicOrbitalActivity } from './activity.js';
import { orbitalCloud, orbitalFacts, projectOrbital, type OrbitalKind } from './core.js';

export interface AtomicOrbitalProps {
  orbital?: OrbitalKind;
  view?: 'cloud' | 'cross-section';
  yaw?: number;
  pitch?: number;
  samples?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
  sceneRenderer?: AtomicOrbitalSceneRenderer;
}

export interface AtomicOrbitalSceneProps {
  kind: OrbitalKind;
  view: 'cloud' | 'cross-section';
  yaw: number;
  pitch: number;
  samples: number;
}

export type AtomicOrbitalSceneRenderer = ComponentType<AtomicOrbitalSceneProps>;

/** Lightweight renderer and the automatic fallback for optional WebGL scenes. */
export function AtomicOrbitalProjectedScene({
  kind,
  view,
  yaw,
  pitch,
  samples,
}: AtomicOrbitalSceneProps): ReactNode {
  const facts = orbitalFacts(kind);
  const points = useMemo(
    () => projectOrbital(orbitalCloud(kind, Math.max(120, Math.min(700, samples))), yaw, pitch),
    [kind, pitch, samples, yaw],
  );
  const visible = view === 'cloud' ? points : points.filter((point) => Math.abs(point.depth) < 0.18);
  return (
    <svg
      viewBox="0 0 420 340"
      width="100%"
      role="img"
      aria-label={`${kind} orbital probability ${view}; ${facts.radialNodes} radial and ${facts.angularNodes} angular nodes`}
    >
      <defs>
        <radialGradient id="orbital-nucleus">
          <stop offset="0" stopColor="white" />
          <stop offset="1" stopColor="var(--stage-warn)" />
        </radialGradient>
      </defs>
      <line x1="28" y1="170" x2="392" y2="170" stroke="var(--stage-grid)" strokeDasharray="3 5" />
      <line x1="210" y1="18" x2="210" y2="322" stroke="var(--stage-grid)" strokeDasharray="3 5" />
      {visible.map((point, index) => (
        <circle
          key={index}
          cx={point.px}
          cy={point.py}
          r={view === 'cloud' ? 1.9 : 2.7}
          fill={point.phase > 0 ? 'var(--stage-accent)' : 'var(--stage-accent-2)'}
          opacity={Math.min(0.78, 0.15 + point.density * 0.7)}
        />
      ))}
      <circle cx="210" cy="170" r="7" fill="url(#orbital-nucleus)" stroke="var(--stage-fg)" strokeWidth="1" />
      <text x="16" y="24" fill="var(--stage-muted)" fontSize="11">
        sampled |ψ|² · colour = sign of ψ
      </text>
      <text x="404" y="326" textAnchor="end" fill="var(--stage-muted)" fontSize="10">
        rotate the coordinate model, not an electron path
      </text>
    </svg>
  );
}

const KINDS: OrbitalKind[] = ['1s', '2s', '2p-x', '2p-y', '2p-z', '3d-z2', '3d-xy'];
export function AtomicOrbitalLab({
  orbital: initial = '2p-z',
  view: initialView = 'cloud',
  yaw: initialYaw = 28,
  pitch: initialPitch = -18,
  samples = 420,
  title = 'Atomic orbitals: probability, phase, and nodes',
  prompt = 'Rotate a hydrogen-like orbital model. The cloud shows where detection is more likely; it is not a shell, surface, or electron path.',
  objectives,
  activity,
  sceneRenderer: SceneRenderer,
}: AtomicOrbitalProps = {}): ReactNode {
  const [kind, setKind] = useState<OrbitalKind>(initial),
    [view, setView] = useState(initialView),
    [yaw, setYaw] = useState(initialYaw),
    [pitch, setPitch] = useState(initialPitch);
  const facts = orbitalFacts(kind);
  const runtimeActivity =
    activity ?? (objectives ? { ...atomicOrbitalActivity.source, objectives } : atomicOrbitalActivity);
  const sceneProps: AtomicOrbitalSceneProps = { kind, view, yaw, pitch, samples };
  const model = SceneRenderer ? (
    <SceneRenderer {...sceneProps} />
  ) : (
    <AtomicOrbitalProjectedScene {...sceneProps} />
  );
  const evidence = (
    <>
      <Readout
        value={
          <>
            {kind} · n={facts.n}, l={facts.l}
          </>
        }
        sub={facts.label}
      />
      <div className="lab-metric-list">
        <div>
          <span>angular nodes</span>
          <strong>{facts.angularNodes}</strong>
        </div>
        <div>
          <span>radial nodes</span>
          <strong>{facts.radialNodes}</strong>
        </div>
        <div>
          <span>total nodes</span>
          <strong>{facts.n - 1}</strong>
        </div>
      </div>
      <p>
        <strong>Model boundary:</strong> these are qualitative hydrogen-like probability samples. In
        many-electron atoms, orbitals are an approximation—not little containers occupied by orbiting balls.
      </p>
    </>
  );
  const controls = (
    <>
      <Field label="orbital">
        <ActivitySelect
          ariaLabel="orbital"
          value={kind}
          onChange={setKind}
          options={KINDS.map((item) => ({ value: item, label: item.replace('-', '') }))}
        />
      </Field>
      <Field label="representation">
        <Segmented
          ariaLabel="representation"
          value={view}
          onChange={setView}
          options={[
            { value: 'cloud', label: 'probability cloud' },
            { value: 'cross-section', label: 'thin cross-section' },
          ]}
        />
      </Field>
      <Field label="horizontal rotation" value={`${yaw}°`}>
        <Slider
          value={yaw}
          min={-180}
          max={180}
          step={5}
          onChange={setYaw}
          ariaLabel="horizontal orbital rotation"
        />
      </Field>
      <Field label="vertical rotation" value={`${pitch}°`}>
        <Slider
          value={pitch}
          min={-80}
          max={80}
          step={5}
          onChange={setPitch}
          ariaLabel="vertical orbital rotation"
        />
      </Field>
    </>
  );
  return (
    <AuthoredActivityRuntime
      activity={runtimeActivity}
      activityId="atomic-orbital"
      focusLayout="immersive"
      eyebrow="Quantum model"
      title={title}
      description={prompt}
      status={
        <>
          <span>{kind}</span>
          <span>
            {facts.angularNodes} angular node{facts.angularNodes === 1 ? '' : 's'}
          </span>
          <span>
            {facts.radialNodes} radial node{facts.radialNodes === 1 ? '' : 's'}
          </span>
        </>
      }
      evidence={evidence}
      controls={controls}
      observation={`${kind} has ${facts.angularNodes} angular and ${facts.radialNodes} radial nodes. Empty node regions are part of the wavefunction model, not gaps in a solid object.`}
      transcript={
        <p>
          The {kind} probability model has {facts.angularNodes} angular nodes and {facts.radialNodes} radial
          nodes. Blue and orange encode opposite wavefunction phase; neither colour is electrical charge. The
          displayed dots sample probability density and do not trace electron motion.
        </p>
      }
    >
      <SceneViewport label={`${kind} orbital model`}>{model}</SceneViewport>
    </AuthoredActivityRuntime>
  );
}
