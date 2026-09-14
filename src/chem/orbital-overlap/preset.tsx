'use client';
import { useState, type ComponentType, type ReactNode } from 'react';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { ActivitySelect, Slider } from '../../kit/controls.js';
import { Field, Readout, SceneViewport } from '../../kit/frame.js';
import { orbitalOverlapActivity } from './activity.js';
import { OVERLAP_FACTS, overlapStrength, type OverlapMode, type OverlapPhase } from './core.js';
import { ProjectedAtom } from '../visual/atom.js';
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
  const phaseFor = (side: number, lobe: number): 'primary' | 'secondary' => {
    const flipped = side === 1 && !same;
    return (lobe < 0) !== flipped ? 'secondary' : 'primary';
  };
  const fillFor = (tone: 'primary' | 'secondary'): string =>
    tone === 'primary' ? 'var(--stage-accent)' : 'var(--stage-accent-2)';
  return (
    <figure className="chem-orbital-overlap-figure">
      <svg
        viewBox="0 0 560 250"
        width="100%"
        role="img"
        aria-label={`${OVERLAP_FACTS[mode].label}, ${phase} overlap`}
      >
        <line x1="58" y1="125" x2="502" y2="125" className="chem-orbital-axis" />
        {phase === 'bonding' && (
          <ellipse
            cx="280"
            cy="125"
            rx={Math.max(18, gap - 34)}
            ry={pi ? 34 : 22}
            className="chem-orbital-density"
          />
        )}
        {[-1, 1].map((side) => (
          <g key={side} transform={`translate(${280 + side * gap} 125)`}>
            {(s ? [0] : pi ? [-1, 1] : [side]).map((v, i) => (
              <ellipse
                key={i}
                cx={pi ? 0 : v * 34}
                cy={pi ? v * 43 : 0}
                rx={pi ? 43 : s ? 45 : 54}
                ry={pi ? 27 : s ? 39 : 27}
                fill={fillFor(phaseFor(side, pi ? v : side))}
                className="chem-orbital-lobe"
              />
            ))}
            <ProjectedAtom
              x={0}
              y={0}
              radius={12}
              symbol={side < 0 ? 'A' : 'B'}
              fill="var(--stage-bg)"
              stroke="var(--stage-fg)"
            />
          </g>
        ))}
        {phase === 'antibonding' && (
          <g>
            <rect x="274" y="30" width="12" height="190" rx="6" className="chem-orbital-node" />
            <text x="280" y="22" textAnchor="middle" className="chem-orbital-node-label">
              node
            </text>
          </g>
        )}
      </svg>
      <figcaption>
        <strong>{same ? 'Constructive overlap' : 'Destructive overlap'}</strong>
        <span>{same ? 'Electron density joins the nuclei.' : 'A nodal plane separates the nuclei.'}</span>
      </figcaption>
    </figure>
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
        <ActivitySelect
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
        <ActivitySelect
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
