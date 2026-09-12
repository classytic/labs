'use client';

import { useState, type ComponentType, type ReactNode } from 'react';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { ActivitySelect, Chip, Segmented, Slider } from '../../kit/controls.js';
import { Field, Readout, SceneViewport } from '../../kit/frame.js';
import { molecularGeometryActivity } from './activity.js';
import { DiagramLabel } from '../../kit/annotate.js';
import {
  MOLECULES,
  hasDirectionalHybridModel,
  molecularDipole,
  projectVector,
  type MoleculeKey,
} from './core.js';

export interface MolecularGeometrySceneProps {
  spec: (typeof MOLECULES)[MoleculeKey];
  yaw: number;
  pitch: number;
  showLonePairs: boolean;
  showDipoles: boolean;
  showDomains: boolean;
  showHybridOrbitals: boolean;
}

export type MolecularGeometrySceneRenderer = ComponentType<MolecularGeometrySceneProps>;

export interface MolecularGeometryProps {
  molecule?: MoleculeKey;
  yaw?: number;
  pitch?: number;
  showLonePairs?: boolean;
  showDipoles?: boolean;
  showDomains?: boolean;
  showHybridOrbitals?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
  sceneRenderer?: MolecularGeometrySceneRenderer;
}
const KEYS = Object.keys(MOLECULES) as MoleculeKey[];
/** Lightweight renderer and the automatic fallback for optional WebGL scenes. */
export function MolecularGeometryProjectedScene({
  spec,
  yaw,
  pitch,
  showLonePairs,
  showDipoles,
  showDomains,
  showHybridOrbitals,
}: MolecularGeometrySceneProps): ReactNode {
  const projected = spec.vectors.map((vector, index) => ({
    ...projectVector(vector, yaw, pitch),
    index,
    vector,
  }));
  const domains = projected.slice(0, spec.bonds + spec.lonePairs).sort((a, b) => a.depth - b.depth),
    cx = 220,
    cy = 170,
    radius = 112;
  return (
    <svg
      viewBox="0 0 440 340"
      width="100%"
      role="img"
      aria-label={`${spec.formula}, ${spec.shape}, bond angle ${spec.angle}, ${spec.lonePairs} lone pairs, ${spec.polar ? 'polar' : 'non-polar'}. Perspective projection; VSEPR predicts approximate geometry, not a rigid sculpture.`}
    >
      <defs>
        <radialGradient id="atom-core">
          <stop offset="0" stopColor="white" />
          <stop offset=".32" stopColor="var(--stage-accent)" />
          <stop offset="1" stopColor="color-mix(in oklab,var(--stage-accent) 55%,var(--stage-fg))" />
        </radialGradient>
      </defs>
      {domains.map((item) => {
        const x = cx + item.x * radius,
          y = cy - item.y * radius,
          bonded = item.index < spec.bonds,
          angle = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
        if (!bonded && !showLonePairs) return null;
        return (
          <g key={item.index} opacity={0.62 + (item.depth + 1) * 0.18}>
            {showHybridOrbitals && hasDirectionalHybridModel(spec) && (
              <g transform={`rotate(${angle} ${cx} ${cy})`} aria-hidden="true">
                <ellipse
                  cx={cx + 48}
                  cy={cy}
                  rx="43"
                  ry="17"
                  fill={bonded ? 'var(--stage-accent)' : 'var(--stage-accent-2)'}
                  opacity=".2"
                />
                <ellipse cx={cx - 17} cy={cy} rx="14" ry="8" fill="var(--stage-warn)" opacity=".2" />
              </g>
            )}
            {showDomains && (
              <ellipse
                cx={(cx + x) / 2}
                cy={(cy + y) / 2}
                rx="50"
                ry="18"
                transform={`rotate(${(Math.atan2(y - cy, x - cx) * 180) / Math.PI} ${(cx + x) / 2} ${(cy + y) / 2})`}
                fill={bonded ? 'var(--stage-accent)' : 'var(--stage-accent-2)'}
                opacity=".12"
              />
            )}
            {bonded ? (
              <>
                <line
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke="var(--stage-metal)"
                  strokeWidth={item.depth > 0 ? 9 : 5}
                  strokeLinecap="round"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={item.depth > 0 ? 21 : 17}
                  fill="var(--stage-bg)"
                  stroke="var(--stage-accent-2)"
                  strokeWidth="3"
                />
                <text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="800"
                  fill="var(--stage-fg)"
                >
                  {spec.outer}
                </text>
                {showDipoles && (
                  <path
                    d={`M ${(cx + x) / 2 - 7} ${(cy + y) / 2} l 14 0 l -4 -4 m 4 4 l -4 4`}
                    stroke="var(--stage-warn)"
                    strokeWidth="2"
                    fill="none"
                    transform={`rotate(${(Math.atan2(y - cy, x - cx) * 180) / Math.PI} ${(cx + x) / 2} ${(cy + y) / 2})`}
                  />
                )}
              </>
            ) : (
              <g>
                <ellipse cx={x} cy={y} rx="24" ry="15" fill="var(--stage-accent-2)" opacity=".2" />
                <circle cx={x - 6} cy={y} r="3" fill="var(--stage-accent-2)" />
                <circle cx={x + 6} cy={y} r="3" fill="var(--stage-accent-2)" />
                <DiagramLabel
                  x={x}
                  y={y + 27}
                  text="lone pair"
                  tone="muted"
                  fontSize={10}
                  bounds={{ left: 8, right: 432, top: 8, bottom: 332 }}
                />
              </g>
            )}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="28" fill="url(#atom-core)" stroke="var(--stage-fg)" strokeWidth="2" />
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize="19" fontWeight="900" fill="white">
        {spec.central}
      </text>
      <DiagramLabel
        x={16}
        y={24}
        text="perspective projection · rotate to resolve depth"
        tone="muted"
        fontSize={11}
        fontWeight={500}
        anchor="start"
        bounds={{ left: 8, right: 432, top: 8, bottom: 332 }}
      />
      <DiagramLabel
        x={424}
        y={326}
        text="VSEPR predicts approximate geometry, not a rigid sculpture"
        tone="muted"
        fontSize={10}
        fontWeight={500}
        anchor="end"
        maxChars={52}
        bounds={{ left: 8, right: 432, top: 8, bottom: 332 }}
      />
    </svg>
  );
}

export function MolecularGeometryLab({
  molecule: initial = 'h2o',
  yaw: initialYaw = 28,
  pitch: initialPitch = -18,
  showLonePairs: loneInitial = true,
  showDipoles: dipoleInitial = true,
  showDomains: domainInitial = false,
  showHybridOrbitals: hybridInitial = false,
  title = 'Molecular geometry: shape is three-dimensional',
  prompt = 'Rotate the molecule, reveal lone-pair domains, and connect VSEPR shape to bond angle, hybridization, and polarity.',
  objectives,
  activity,
  sceneRenderer: SceneRenderer,
}: MolecularGeometryProps = {}): ReactNode {
  const [key, setKey] = useState<MoleculeKey>(initial),
    [yaw, setYaw] = useState(initialYaw),
    [pitch, setPitch] = useState(initialPitch),
    [showLonePairs, setShowLonePairs] = useState(loneInitial),
    [showDipoles, setShowDipoles] = useState(dipoleInitial),
    [showDomains, setShowDomains] = useState(domainInitial),
    [showHybridOrbitals, setShowHybridOrbitals] = useState(hybridInitial);
  const spec = MOLECULES[key];
  const sceneProps: MolecularGeometrySceneProps = {
    spec,
    yaw,
    pitch,
    showLonePairs,
    showDipoles,
    showDomains,
    showHybridOrbitals,
  };
  const model = SceneRenderer ? (
    <SceneRenderer {...sceneProps} />
  ) : (
    <MolecularGeometryProjectedScene {...sceneProps} />
  );
  const evidence = (
    <>
      <Readout
        value={
          <>
            {spec.formula} · {spec.shape}
          </>
        }
        sub={`${spec.bonds + spec.lonePairs} electron domains · ${spec.angle}`}
      />
      <div className="lab-metric-list">
        <div>
          <span>electron geometry</span>
          <strong>{spec.electronGeometry}</strong>
        </div>
        <div>
          <span>molecular shape</span>
          <strong>{spec.shape}</strong>
        </div>
        <div>
          <span>hybridization model</span>
          <strong>{spec.hybridization}</strong>
        </div>
        <div>
          <span>polarity</span>
          <strong>{spec.polar ? 'polar' : 'non-polar'}</strong>
        </div>
      </div>
      <p>
        {molecularDipole(spec)}. Hybrid orbitals are a directional bonding model, not photographed balloons or
        electron paths. Their large lobes point toward bonds or lone-pair domains.
      </p>
    </>
  );
  const controls = (
    <>
      <Field label="molecule">
        <ActivitySelect
          ariaLabel="molecule"
          value={key}
          onChange={setKey}
          options={KEYS.map((item) => ({ value: item, label: MOLECULES[item].formula }))}
        />
      </Field>
      <Field label="model layers">
        <span className="lab-field-row">
          <Chip selected={showLonePairs} onClick={() => setShowLonePairs(!showLonePairs)}>
            lone pairs
          </Chip>
          <Chip selected={showDomains} onClick={() => setShowDomains(!showDomains)}>
            electron domains
          </Chip>
          <Chip selected={showDipoles} onClick={() => setShowDipoles(!showDipoles)}>
            bond dipoles
          </Chip>
          <Chip
            selected={showHybridOrbitals}
            disabled={!hasDirectionalHybridModel(spec)}
            onClick={() => setShowHybridOrbitals(!showHybridOrbitals)}
          >
            hybrid directions
          </Chip>
        </span>
        <small className="lab-field-help">
          {hasDirectionalHybridModel(spec)
            ? 'Layer controls reveal the same molecular geometry; they do not change its shape.'
            : 'Expanded-octet hybrid labels are bookkeeping; this model does not draw literal d-orbital mixtures.'}
        </small>
      </Field>
      <Field label="horizontal rotation" value={`${yaw}°`}>
        <Slider
          value={yaw}
          min={-180}
          max={180}
          step={5}
          onChange={setYaw}
          ariaLabel="horizontal molecular rotation"
        />
      </Field>
      <Field label="vertical rotation" value={`${pitch}°`}>
        <Slider
          value={pitch}
          min={-80}
          max={80}
          step={5}
          onChange={setPitch}
          ariaLabel="vertical molecular rotation"
        />
      </Field>
    </>
  );
  const runtimeActivity =
    activity ??
    (objectives ? { ...molecularGeometryActivity.source, objectives } : molecularGeometryActivity);
  return (
    <AuthoredActivityRuntime
      activity={runtimeActivity}
      activityId="molecular-geometry"
      focusLayout="immersive"
      eyebrow="Bonding and shape"
      title={title}
      description={prompt}
      status={
        <>
          <span>{spec.formula}</span>
          <span>{spec.shape}</span>
          <span>{spec.angle}</span>
          <span>{spec.polar ? 'polar' : 'non-polar'}</span>
        </>
      }
      evidence={evidence}
      controls={controls}
      observation={`${spec.formula} has ${spec.bonds + spec.lonePairs} electron domains. Its electron geometry is ${spec.electronGeometry}, while the atom-only molecular shape is ${spec.shape}.`}
      transcript={
        <p>
          {spec.formula} has {spec.bonds} bonded domains and {spec.lonePairs} lone-pair domains around{' '}
          {spec.central}. The electron geometry is {spec.electronGeometry}; the molecular shape is{' '}
          {spec.shape}; characteristic angles are {spec.angle}. The introductory hybridization model is{' '}
          {spec.hybridization}. The molecule is{' '}
          {spec.polar
            ? 'polar because its bond dipoles do not cancel'
            : 'non-polar because its symmetric bond dipoles cancel'}
          .
        </p>
      }
    >
      <SceneViewport label={`${spec.formula} molecular geometry model`}>{model}</SceneViewport>
    </AuthoredActivityRuntime>
  );
}
