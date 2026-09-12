'use client';

import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Chip, Segmented, Slider } from '../../kit/controls.js';
import { Field, Readout, SceneViewport } from '../../kit/frame.js';
import { crystalLatticeActivity } from './activity.js';
import {
  LATTICE_FACTS,
  latticePoints,
  projectedLatticePoint,
  type CrystalLatticeKind,
  type LatticePoint,
} from './core.js';

export interface CrystalLatticeSceneProps {
  kind: CrystalLatticeKind;
  repetitions: number;
  showPlane: boolean;
  yaw: number;
  pitch: number;
}
export type CrystalLatticeSceneRenderer = ComponentType<CrystalLatticeSceneProps>;
export interface CrystalLatticeProps {
  lattice?: CrystalLatticeKind;
  repetitions?: number;
  showPlane?: boolean;
  yaw?: number;
  pitch?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
  sceneRenderer?: CrystalLatticeSceneRenderer;
}
const KINDS = Object.keys(LATTICE_FACTS) as CrystalLatticeKind[];

export function CrystalLatticeProjectedScene({
  kind,
  repetitions,
  showPlane,
}: CrystalLatticeSceneProps): ReactNode {
  const points = useMemo(
    () =>
      latticePoints(kind, repetitions)
        .map((point) => ({ point, projected: projectedLatticePoint(point, repetitions) }))
        .sort((a, b) => a.projected.depth - b.projected.depth),
    [kind, repetitions],
  );
  const n = repetitions,
    corners: LatticePoint[] = [
      { x: 0, y: 0, z: 0, site: 'corner' },
      { x: n, y: 0, z: 0, site: 'corner' },
      { x: n, y: n, z: 0, site: 'corner' },
      { x: 0, y: n, z: 0, site: 'corner' },
      { x: 0, y: 0, z: n, site: 'corner' },
      { x: n, y: 0, z: n, site: 'corner' },
      { x: n, y: n, z: n, site: 'corner' },
      { x: 0, y: n, z: n, site: 'corner' },
    ];
  const p = corners.map((point) => projectedLatticePoint(point, repetitions));
  const edges: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  return (
    <svg
      viewBox="0 0 420 360"
      width="100%"
      role="img"
      aria-label={`${LATTICE_FACTS[kind].label}, ${repetitions} cells in each direction`}
    >
      {showPlane && (
        <polygon
          points={[p[3]!, p[2]!, p[5]!, p[4]!].map((point) => `${point.x},${point.y}`).join(' ')}
          fill="var(--stage-accent)"
          opacity=".12"
          stroke="var(--stage-accent)"
          strokeDasharray="5 5"
        />
      )}
      {edges.map(([a, b], index) => (
        <line
          key={index}
          x1={p[a]!.x}
          y1={p[a]!.y}
          x2={p[b]!.x}
          y2={p[b]!.y}
          stroke="var(--stage-grid)"
          strokeWidth="1.5"
        />
      ))}
      {points.map(({ point, projected }, index) => (
        <g key={index}>
          <circle
            cx={projected.x}
            cy={projected.y}
            r={point.site === 'corner' ? 8 : 10}
            fill={
              point.site === 'body'
                ? 'var(--stage-warn)'
                : point.site === 'face'
                  ? 'var(--stage-accent-2)'
                  : 'var(--stage-accent)'
            }
            opacity=".9"
          />
          <circle cx={projected.x - 2} cy={projected.y - 2} r="2" fill="white" opacity=".75" />
        </g>
      ))}
    </svg>
  );
}

export function CrystalLatticeLab({
  lattice: initial = 'face-centred',
  repetitions: initialRepetitions = 1,
  showPlane: initialPlane = false,
  yaw: initialYaw = 32,
  pitch: initialPitch = -18,
  title = 'Crystal lattices: one cell becomes a solid',
  prompt = 'Repeat a unit cell, reveal a crystallographic plane, and connect shared atom positions to coordination and packing.',
  objectives,
  activity,
  sceneRenderer: SceneRenderer,
}: CrystalLatticeProps = {}): ReactNode {
  const [kind, setKind] = useState(initial),
    [repetitions, setRepetitions] = useState(Math.max(1, Math.min(3, initialRepetitions))),
    [showPlane, setShowPlane] = useState(initialPlane),
    [yaw, setYaw] = useState(initialYaw),
    [pitch, setPitch] = useState(initialPitch);
  const facts = LATTICE_FACTS[kind],
    sceneProps = { kind, repetitions, showPlane, yaw, pitch };
  const runtimeActivity =
    activity ?? (objectives ? { ...crystalLatticeActivity.source, objectives } : crystalLatticeActivity);
  const evidence = (
    <>
      <Readout
        value={`${facts.atomsPerCell} atom${facts.atomsPerCell === 1 ? '' : 's'} per cell`}
        sub={`${facts.coordination} nearest neighbours`}
      />
      <div className="lab-metric-list">
        <div>
          <span>coordination number</span>
          <strong>{facts.coordination}</strong>
        </div>
        <div>
          <span>packing efficiency</span>
          <strong>{(facts.packingEfficiency * 100).toFixed(1)}%</strong>
        </div>
        <div>
          <span>displayed lattice sites</span>
          <strong>{latticePoints(kind, repetitions).length}</strong>
        </div>
      </div>
      <p>
        Corner and face atoms are shared with adjacent cells. Count their fractions, not every complete sphere
        visible in the drawing.
      </p>
    </>
  );
  const controls = (
    <>
      <Field label="unit cell">
        <Segmented
          ariaLabel="unit cell"
          value={kind}
          onChange={setKind}
          options={KINDS.map((item) => ({
            value: item,
            label: item === 'simple-cubic' ? 'SC' : item === 'body-centred' ? 'BCC' : 'FCC',
          }))}
        />
      </Field>
      <Field label="repeat cells" value={`${repetitions} × ${repetitions} × ${repetitions}`}>
        <Slider
          value={repetitions}
          min={1}
          max={3}
          step={1}
          onChange={setRepetitions}
          ariaLabel="unit cell repetitions"
        />
      </Field>
      <Field label="rotate horizontally" value={`${yaw}°`}>
        <Slider
          value={yaw}
          min={-180}
          max={180}
          step={2}
          onChange={setYaw}
          ariaLabel="horizontal lattice rotation"
        />
      </Field>
      <Field label="tilt" value={`${pitch}°`}>
        <Slider
          value={pitch}
          min={-70}
          max={70}
          step={2}
          onChange={setPitch}
          ariaLabel="vertical lattice tilt"
        />
      </Field>
      <Field label="structure layers">
        <Chip selected={showPlane} onClick={() => setShowPlane(!showPlane)}>
          show (110) plane
        </Chip>
      </Field>
    </>
  );
  return (
    <AuthoredActivityRuntime
      activity={runtimeActivity}
      activityId="crystal-lattice"
      focusLayout="immersive"
      eyebrow="Solid-state chemistry"
      title={title}
      description={prompt}
      status={
        <>
          <span>{facts.label}</span>
          <span>{facts.coordination} neighbours</span>
          <span>{(facts.packingEfficiency * 100).toFixed(0)}% packed</span>
        </>
      }
      evidence={evidence}
      controls={controls}
      observation={`${facts.label} has ${facts.atomsPerCell} atoms per unit cell, coordination number ${facts.coordination}, and ${(facts.packingEfficiency * 100).toFixed(1)}% packing efficiency.`}
      transcript={
        <p>
          {facts.label}. Each atom has {facts.coordination} nearest neighbours. Shared lattice sites
          contribute {facts.atomsPerCell} atoms per unit cell, giving{' '}
          {(facts.packingEfficiency * 100).toFixed(1)} percent packing efficiency.
        </p>
      }
    >
      <SceneViewport label={`${facts.label} crystal lattice model`}>
        {SceneRenderer ? <SceneRenderer {...sceneProps} /> : <CrystalLatticeProjectedScene {...sceneProps} />}
      </SceneViewport>
    </AuthoredActivityRuntime>
  );
}
