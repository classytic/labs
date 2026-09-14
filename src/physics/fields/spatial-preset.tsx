'use client';
import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { ActivitySelect, Segmented, Slider } from '../../kit/controls.js';
import { Field, Readout } from '../../kit/frame.js';
import { spatialLorentzActivity } from './spatial-activity.js';
import {
  fieldsFor,
  lorentzForce3D,
  traceLorentz,
  type SpatialFieldMode,
  type Vec3Value,
} from './spatial-core.js';
export interface SpatialLorentzSceneProps {
  mode: SpatialFieldMode;
  charge: 1 | -1;
  strength: number;
  forwardSpeed: number;
  axialSpeed: number;
  yaw: number;
  pitch: number;
  path: Vec3Value[];
}
export type SpatialLorentzSceneRenderer = ComponentType<SpatialLorentzSceneProps>;
export interface SpatialLorentzProps {
  mode?: SpatialFieldMode;
  charge?: 1 | -1;
  strength?: number;
  forwardSpeed?: number;
  axialSpeed?: number;
  yaw?: number;
  pitch?: number;
  title?: string;
  prompt?: string;
  sceneRenderer?: SpatialLorentzSceneRenderer;
}
const project = (v: Vec3Value, yaw: number, pitch: number) => {
  const y = (yaw * Math.PI) / 180,
    p = (pitch * Math.PI) / 180,
    x = v.x * Math.cos(y) + v.z * Math.sin(y),
    z = -v.x * Math.sin(y) + v.z * Math.cos(y);
  return { x, y: v.y * Math.cos(p) - z * Math.sin(p) };
};
export function SpatialLorentzProjectedScene(p: SpatialLorentzSceneProps): ReactNode {
  const pts = p.path.map((v) => project(v, p.yaw, p.pitch)),
    xs = pts.map((v) => v.x),
    ys = pts.map((v) => v.y),
    minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys),
    xy = (v: { x: number; y: number }) => ({
      x: 40 + ((v.x - minX) / Math.max(0.1, maxX - minX)) * 520,
      y: 280 - ((v.y - minY) / Math.max(0.1, maxY - minY)) * 240,
    }),
    end = xy(pts.at(-1)!);
  return (
    <svg
      viewBox="0 0 600 320"
      width="100%"
      role="img"
      aria-label={`${p.charge > 0 ? 'positive' : 'negative'} charge trajectory in ${p.mode} fields`}
    >
      <polyline
        points={pts
          .map((v) => {
            const q = xy(v);
            return `${q.x},${q.y}`;
          })
          .join(' ')}
        fill="none"
        stroke="var(--stage-good)"
        strokeWidth="4"
      />
      <circle
        cx={end.x}
        cy={end.y}
        r="7"
        fill={p.charge > 0 ? 'var(--stage-warn)' : 'var(--stage-accent-2)'}
      />
      <text x="18" y="24" fill="var(--stage-muted)" fontSize="12">
        projected 3D trajectory · rotate to resolve depth
      </text>
    </svg>
  );
}
export function SpatialLorentzLab({
  mode: im = 'magnetic',
  charge: iq = 1,
  strength: is = 1,
  forwardSpeed: iv = 1.8,
  axialSpeed: ia = 0.65,
  yaw: iy = 28,
  pitch: ip = -18,
  title = 'Fields in space: steer a charged particle',
  prompt = 'Launch a charge through electric and magnetic fields. Rotate the path and separate acceleration from magnetic turning.',
  sceneRenderer: Scene,
}: SpatialLorentzProps = {}): ReactNode {
  const [mode, setMode] = useState(im),
    [charge, setCharge] = useState(iq),
    [strength, setStrength] = useState(is),
    [forwardSpeed, setForward] = useState(iv),
    [axialSpeed, setAxial] = useState(ia),
    [yaw, setYaw] = useState(iy),
    [pitch, setPitch] = useState(ip),
    { e, b } = fieldsFor(mode, strength),
    velocity = { x: forwardSpeed, y: 0, z: axialSpeed },
    path = useMemo(
      () => traceLorentz(charge, 1, velocity, e, b),
      [charge, forwardSpeed, axialSpeed, e.x, e.y, e.z, b.x, b.y, b.z],
    ),
    force = lorentzForce3D(charge, velocity, e, b),
    props = { mode, charge, strength, forwardSpeed, axialSpeed, yaw, pitch, path };
  const controls = (
    <>
      <Field label="field setup">
        <ActivitySelect
          ariaLabel="field setup"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'electric', label: 'Electric field' },
            { value: 'magnetic', label: 'Magnetic field' },
            { value: 'crossed', label: 'Crossed E + B' },
          ]}
        />
      </Field>
      <Field label="charge">
        <Segmented
          ariaLabel="charge"
          value={charge > 0 ? 'pos' : 'neg'}
          onChange={(v) => setCharge(v === 'pos' ? 1 : -1)}
          options={[
            { value: 'pos', label: 'positive' },
            { value: 'neg', label: 'negative' },
          ]}
        />
      </Field>
      <Field label="field strength" value={strength.toFixed(1)}>
        <Slider
          value={strength}
          min={0.3}
          max={2.5}
          step={0.1}
          onChange={setStrength}
          ariaLabel="field strength"
        />
      </Field>
      <Field label="forward speed" value={forwardSpeed.toFixed(1)}>
        <Slider
          value={forwardSpeed}
          min={0.4}
          max={3}
          step={0.1}
          onChange={setForward}
          ariaLabel="forward speed"
        />
      </Field>
      <Field label="velocity along B" value={axialSpeed.toFixed(1)}>
        <Slider value={axialSpeed} min={0} max={2} step={0.1} onChange={setAxial} ariaLabel="axial speed" />
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
      <Readout
        value={`F = (${force.x.toFixed(2)}, ${force.y.toFixed(2)}, ${force.z.toFixed(2)})`}
        sub="q(E + v × B), normalized units"
      />
      <div className="lab-metric-list">
        <div>
          <span>electric field</span>
          <strong>
            ({e.x}, {e.y}, {e.z})
          </strong>
        </div>
        <div>
          <span>magnetic field</span>
          <strong>
            ({b.x}, {b.y}, {b.z})
          </strong>
        </div>
        <div>
          <span>path</span>
          <strong>{mode === 'electric' ? 'accelerating' : axialSpeed > 0 ? 'helical' : 'circular'}</strong>
        </div>
      </div>
    </>
  );
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={spatialLorentzActivity}
      activityId="spatial-lorentz"
      eyebrow="Electromagnetism"
      title={title}
      description={prompt}
      status={
        <>
          <span>{mode}</span>
          <span>{charge > 0 ? '+q' : '−q'}</span>
          <span>{axialSpeed > 0 ? '3D helix' : 'planar path'}</span>
        </>
      }
      evidence={evidence}
      controls={controls}
      observation={
        mode === 'electric'
          ? 'Electric force can add kinetic energy.'
          : 'Magnetic force stays perpendicular to velocity: it bends without changing speed.'
      }
      transcript={
        <p>
          A {charge > 0 ? 'positive' : 'negative'} charge follows a{' '}
          {mode === 'electric' ? 'curved accelerating' : axialSpeed > 0 ? 'helical' : 'circular'} path.
        </p>
      }
    >
      {Scene ? <Scene {...props} /> : <SpatialLorentzProjectedScene {...props} />}
    </AuthoredActivityRuntime>
  );
}
