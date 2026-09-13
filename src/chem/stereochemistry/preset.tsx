'use client';

import { useState, type ComponentType, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { ActivitySelect, Chip, Segmented, Slider } from '../../kit/controls.js';
import { Field, Readout, SceneViewport } from '../../kit/frame.js';
import { stereochemistryActivity } from './activity.js';
import {
  CHIRAL_MOLECULES,
  TETRAHEDRAL_ANGLE,
  chiralVectors,
  mirrorEnantiomer,
  rotateChiralVector,
  type ChiralSpec,
  type Enantiomer,
  type StereochemistryMolecule,
} from './core.js';

export interface StereochemistrySceneProps {
  spec: ChiralSpec;
  enantiomer: Enantiomer;
  yaw: number;
  pitch: number;
  compareMirror: boolean;
  showPriorities: boolean;
}
export type StereochemistrySceneRenderer = ComponentType<StereochemistrySceneProps>;
export interface StereochemistryProps {
  molecule?: StereochemistryMolecule;
  enantiomer?: Enantiomer;
  yaw?: number;
  pitch?: number;
  compareMirror?: boolean;
  showPriorities?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
  sceneRenderer?: StereochemistrySceneRenderer;
}
const MOLECULE_KEYS = Object.keys(CHIRAL_MOLECULES) as StereochemistryMolecule[];

function ProjectedMolecule({
  spec,
  enantiomer,
  yaw,
  pitch,
  showPriorities,
  offset = 0,
}: Omit<StereochemistrySceneProps, 'compareMirror'> & { offset?: number }): ReactNode {
  const vectors = chiralVectors(enantiomer).map((vector) => rotateChiralVector(vector, yaw, pitch));
  const cx = 210 + offset,
    cy = 160,
    scale = 68;
  return (
    <g>
      {vectors.map((vector, index) => {
        const group = spec.groups[index]!,
          x = cx + vector.x * scale,
          y = cy - vector.y * scale;
        const color = `var(--stage-${group.tone === 'neutral' ? 'metal' : group.tone})`;
        return (
          <g key={group.priority} opacity={0.72 + Math.max(-0.2, vector.z * 0.12)}>
            <line
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={color}
              strokeWidth={vector.z > 0.25 ? 8 : vector.z < -0.25 ? 2 : 4}
              strokeDasharray={vector.z < -0.25 ? '5 5' : undefined}
              strokeLinecap="round"
            />
            <circle cx={x} cy={y} r="22" fill="var(--stage-bg)" stroke={color} strokeWidth="3" />
            <text x={x} y={y + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--stage-fg)">
              {group.label}
            </text>
            {showPriorities && (
              <g>
                <circle cx={x + 18} cy={y - 18} r="10" fill="var(--stage-fg)" />
                <text
                  x={x + 18}
                  y={y - 14}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill="var(--stage-bg)"
                >
                  {group.priority}
                </text>
              </g>
            )}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="24" fill="var(--stage-accent)" />
      <text x={cx} y={cy + 6} textAnchor="middle" fontWeight="900" fill="white">
        {spec.center}
      </text>
      <text x={cx} y="292" textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--stage-fg)">
        {enantiomer}
      </text>
    </g>
  );
}

export function StereochemistryProjectedScene(props: StereochemistrySceneProps): ReactNode {
  return (
    <svg
      viewBox="0 0 620 320"
      width="100%"
      role="img"
      aria-label={`${props.spec.name}, ${props.enantiomer} configuration${props.compareMirror ? ` beside its ${mirrorEnantiomer(props.enantiomer)} mirror image` : ''}`}
    >
      <ProjectedMolecule {...props} offset={props.compareMirror ? -115 : 100} />
      {props.compareMirror && (
        <>
          <line x1="310" y1="46" x2="310" y2="270" stroke="var(--stage-grid)" strokeDasharray="6 6" />
          <text x="310" y="28" textAnchor="middle" fontSize="11" fill="var(--stage-muted)">
            mirror
          </text>
          <ProjectedMolecule {...props} enantiomer={mirrorEnantiomer(props.enantiomer)} offset={115} />
        </>
      )}
    </svg>
  );
}

export function StereochemistryLab({
  molecule: initialMolecule = 'lactic-acid',
  enantiomer: initialEnantiomer = 'R',
  yaw: initialYaw = 24,
  pitch: initialPitch = -14,
  compareMirror: initialCompare = true,
  showPriorities: initialPriorities = true,
  title = 'Chirality: a molecule and its impossible mirror fit',
  prompt = 'Rotate a tetrahedral stereocentre, follow CIP priorities, and see why its mirror image cannot be aligned without breaking bonds.',
  objectives,
  activity,
  sceneRenderer: SceneRenderer,
}: StereochemistryProps = {}): ReactNode {
  const [molecule, setMolecule] = useState(initialMolecule),
    [enantiomer, setEnantiomer] = useState(initialEnantiomer),
    [yaw, setYaw] = useState(initialYaw),
    [pitch, setPitch] = useState(initialPitch),
    [compareMirror, setCompareMirror] = useState(initialCompare),
    [showPriorities, setShowPriorities] = useState(initialPriorities);
  const spec = CHIRAL_MOLECULES[molecule],
    sceneProps = { spec, enantiomer, yaw, pitch, compareMirror, showPriorities };
  const runtimeActivity =
    activity ?? (objectives ? { ...stereochemistryActivity.source, objectives } : stereochemistryActivity);
  const controls = (
    <>
      <Field label="molecule">
        <ActivitySelect
          ariaLabel="molecule"
          value={molecule}
          onChange={setMolecule}
          options={MOLECULE_KEYS.map((key) => ({ value: key, label: CHIRAL_MOLECULES[key].name }))}
        />
      </Field>
      <Field label="configuration">
        {/* R/S is the one-of-two choice; the two layer toggles beside it are independent, so they
            stay chips rather than joining the track. */}
        <span className="lab-field-row">
          <Segmented
            ariaLabel="configuration"
            value={enantiomer}
            onChange={setEnantiomer}
            options={[
              { value: 'R', label: 'R' },
              { value: 'S', label: 'S' },
            ]}
          />
          <Chip selected={compareMirror} onClick={() => setCompareMirror(!compareMirror)}>
            compare mirror
          </Chip>
          <Chip selected={showPriorities} onClick={() => setShowPriorities(!showPriorities)}>
            CIP priorities
          </Chip>
        </span>
      </Field>
      <Field label="rotate horizontally" value={`${yaw}°`}>
        <Slider
          value={yaw}
          min={-180}
          max={180}
          step={4}
          onChange={setYaw}
          ariaLabel="horizontal molecule rotation"
        />
      </Field>
      <Field label="tilt" value={`${pitch}°`}>
        <Slider
          value={pitch}
          min={-70}
          max={70}
          step={4}
          onChange={setPitch}
          ariaLabel="vertical molecule tilt"
        />
      </Field>
    </>
  );
  const evidence = (
    <>
      <Readout value={`${enantiomer} configuration`} sub={`${spec.name} · ${spec.formula}`} />
      <div className="lab-metric-list">
        <div>
          <span>centre geometry</span>
          <strong>tetrahedral</strong>
        </div>
        <div>
          <span>ideal bond angle</span>
          <strong>{TETRAHEDRAL_ANGLE}°</strong>
        </div>
        <div>
          <span>mirror configuration</span>
          <strong>{mirrorEnantiomer(enantiomer)}</strong>
        </div>
        <div>
          <span>relationship</span>
          <strong>enantiomers</strong>
        </div>
      </div>
      <p>
        Rank the directly attached atoms first, then compare outward at the first difference. With group 4
        pointing away, clockwise 1 → 2 → 3 is R; anticlockwise is S.
      </p>
    </>
  );
  return (
    <AuthoredActivityRuntime
      activity={runtimeActivity}
      activityId="stereochemistry"
      focusLayout="immersive"
      eyebrow="Organic chemistry"
      title={title}
      description={prompt}
      status={
        <>
          <span>{spec.name}</span>
          <span>{enantiomer}</span>
          <span>4 different groups</span>
        </>
      }
      evidence={evidence}
      controls={controls}
      observation={`Mirroring ${enantiomer}-${spec.name} reverses its handedness to ${mirrorEnantiomer(enantiomer)}. Rotation changes the view, never the configuration.`}
      transcript={
        <p>
          {spec.name} has four different groups around a tetrahedral stereogenic centre. Their CIP priorities
          are {spec.groups.map((group) => `${group.priority}: ${group.label}`).join(', ')}. The displayed
          molecule is {enantiomer}; its non-superimposable mirror image is {mirrorEnantiomer(enantiomer)}.
        </p>
      }
    >
      <SceneViewport size="wide" label={`${spec.name} stereochemistry model`}>
        {SceneRenderer ? (
          <SceneRenderer {...sceneProps} />
        ) : (
          <StereochemistryProjectedScene {...sceneProps} />
        )}
      </SceneViewport>
    </AuthoredActivityRuntime>
  );
}
