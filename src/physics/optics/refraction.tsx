'use client';

/**
 * RefractionLab — Snell's law you can steer. A ray crosses the boundary between two
 * media; drag the angle (or pick materials) and watch it bend TOWARD the normal
 * going into a denser medium, AWAY going out. Past the critical angle (dense → rare)
 * it can't escape at all: total internal reflection, the trick behind optical fibres.
 *
 * On the shared optics kernel (`refract` / `criticalAngle` = n₁sinθ₁ = n₂sinθ₂), so
 * the numbers are one source of truth. Authorable: the two indices (or material
 * presets), the incidence angle, plus the usual title/prompt — an author can spin up
 * air→glass, glass→water, water→air, diamond… any pair, for endless quiz variants.
 */

import { useId, useState, type ReactNode } from 'react';
import { refract, criticalAngle, MEDIA } from './core.js';
import { IconButton, Segmented, Slider } from '../../kit/controls.js';
import { Field, ControlPolicy } from '../../kit/frame.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { OpticsActivity } from './activity.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';

export interface Medium {
  label: string;
  n: number;
}
export interface RefractionProps {
  /** Index of the top medium (where the ray starts). */
  n1?: number;
  /** Index of the bottom medium. */
  n2?: number;
  /** Angle of incidence, degrees from the normal. */
  angle?: number;
  /** Material presets offered as chips for each side. */
  materials?: Medium[];
  title?: string;
  prompt?: string;
  objectives?: string[];
  height?: number;
  activity?: string | AuthoredActivity;
}

const W = 540,
  CX = 270,
  L = 150;
const INC = 'var(--stage-accent, #3b82f6)';
const REF = 'var(--stage-good, #16a34a)';
const RFL = 'var(--stage-warn, #e0a020)';

const DEFAULT_MEDIA: Medium[] = [
  { label: 'air', n: MEDIA.air! },
  { label: 'water', n: MEDIA.water! },
  { label: 'glass', n: MEDIA.glass! },
  { label: 'diamond', n: MEDIA.diamond! },
];

const CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'bend',
    prompt: 'Light passing into a denser medium (bigger n) bends…',
    choices: [
      { value: 'toward', label: 'toward the normal' },
      { value: 'away', label: 'away from the normal' },
      { value: 'straight', label: 'straight through, no bend' },
    ],
    answer: 'toward',
    explain:
      'It slows in the denser medium, so it bends toward the normal (n₁sinθ₁ = n₂sinθ₂). The reverse (dense → rare) bends away.',
  },
  {
    id: 'tir',
    prompt: 'Going from glass to air, past the critical angle, the light…',
    choices: [
      { value: 'tir', label: 'totally reflects — none escapes' },
      { value: 'bends', label: 'bends and escapes' },
      { value: 'stops', label: 'is absorbed' },
    ],
    answer: 'tir',
    explain:
      'Beyond the critical angle Snell has no solution (it needs sin θ₂ > 1), so all the light reflects back: total internal reflection — the basis of optical fibres.',
  },
];

const D2R = Math.PI / 180;
const f1 = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(n < 10 ? 2 : 1));

export function RefractionLab({
  n1 = MEDIA.air!,
  n2 = MEDIA.glass!,
  angle = 40,
  materials = DEFAULT_MEDIA,
  title = 'Refraction & total internal reflection (Snell’s law)',
  prompt = 'Light bends as it crosses into a new medium. Change the angle or the materials, and find the critical angle where it can no longer escape.',
  objectives = [
    'Use Snell’s law: n₁ sinθ₁ = n₂ sinθ₂',
    'See light bend toward the normal into a denser medium, away out of it',
    'Find the critical angle and total internal reflection (dense → rare)',
  ],
  height = 300,
  activity,
}: RefractionProps = {}): ReactNode {
  const [i, setI] = useState(angle);
  const svgId = useId().replaceAll(':', '');
  const [nTop, setNTop] = useState(n1);
  const [nBot, setNBot] = useState(n2);
  const ch = useChallenge(CHALLENGE);
  useCheckpoint({ solved: ch.allCorrect, activity: 'refraction' });

  const theta2 = refract(i, nTop, nBot); // null ⇒ TIR
  const tir = theta2 == null;
  const crit = criticalAngle(nTop, nBot); // null when nTop ≤ nBot
  const H = Math.max(280, height);
  const CY = H / 2;

  const th1 = i * D2R;
  const th2 = theta2 != null ? theta2 * D2R : 0;
  // incident from upper-left → O; refracted into lower medium; reflected to upper-right
  const inc = { x: CX - L * Math.sin(th1), y: CY - L * Math.cos(th1) };
  const rfr = { x: CX + L * Math.sin(th2), y: CY + L * Math.cos(th2) };
  const rfl = { x: CX + L * Math.sin(th1), y: CY - L * Math.cos(th1) };
  const denser = nBot > nTop;

  const topLabel = materials.find((m) => Math.abs(m.n - nTop) < 0.01)?.label ?? 'medium 1';
  const bottomLabel = materials.find((m) => Math.abs(m.n - nBot) < 0.01)?.label ?? 'medium 2';
  const bend = tir
    ? 'Total internal reflection'
    : denser
      ? 'Bends toward normal'
      : nBot < nTop
        ? 'Bends away from normal'
        : 'Continues straight';

  const figure = (
    <div className="physics-optics-scene">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Refraction; incidence ${i}° from n ${f1(nTop)} to n ${f1(nBot)}; ${tir ? 'total internal reflection' : `refracted ${theta2!.toFixed(0)}°`}`}
      >
        <defs>
          <marker
            id={`${svgId}-incident`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 0 10 5 0 10Z" fill={INC} />
          </marker>
          <marker
            id={`${svgId}-refracted`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 0 10 5 0 10Z" fill={REF} />
          </marker>
          <marker
            id={`${svgId}-reflected`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 0 10 5 0 10Z" fill={RFL} />
          </marker>
        </defs>
        {/* media */}
        <rect x={0} y={0} width={W} height={CY} fill={INC} opacity={0.05} />
        <rect x={0} y={CY} width={W} height={H - CY} fill={INC} opacity={denser ? 0.14 : 0.03} />
        <text x={18} y={28} fontSize={15} fontWeight={700} fill="var(--stage-fg)">
          {topLabel} · n₁={f1(nTop)}
        </text>
        <text x={18} y={H - 20} fontSize={15} fontWeight={700} fill="var(--stage-fg)">
          {bottomLabel} · n₂={f1(nBot)}
        </text>
        {/* interface + normal */}
        <line x1={0} y1={CY} x2={W} y2={CY} stroke="var(--stage-fg)" strokeWidth={1.6} />
        <line
          x1={CX}
          y1={40}
          x2={CX}
          y2={H - 30}
          stroke="var(--stage-muted)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <text x={CX + 6} y={52} fontSize={10} fill="var(--stage-muted)">
          normal
        </text>
        {/* incident ray */}
        <line
          x1={inc.x}
          y1={inc.y}
          x2={CX}
          y2={CY}
          stroke={INC}
          strokeWidth={3}
          markerEnd={`url(#${svgId}-incident)`}
        />
        <text
          x={(inc.x + CX) / 2 - 6}
          y={(inc.y + CY) / 2}
          fontSize={11}
          fontWeight={700}
          fill={INC}
          textAnchor="end"
        >
          θ₁={i.toFixed(0)}°
        </text>
        {/* refracted (or nothing on TIR) */}
        {!tir && (
          <>
            <line
              x1={CX}
              y1={CY}
              x2={rfr.x}
              y2={rfr.y}
              stroke={REF}
              strokeWidth={3}
              markerEnd={`url(#${svgId}-refracted)`}
            />
            <text x={(CX + rfr.x) / 2 + 8} y={(CY + rfr.y) / 2 + 6} fontSize={11} fontWeight={700} fill={REF}>
              θ₂={theta2!.toFixed(0)}°
            </text>
          </>
        )}
        {/* In TIR, equal-angle reflection replaces the transmitted ray. */}
        {tir && (
          <line
            x1={CX}
            y1={CY}
            x2={rfl.x}
            y2={rfl.y}
            stroke={RFL}
            strokeWidth={3}
            markerEnd={`url(#${svgId}-reflected)`}
          />
        )}
        {tir && (
          <>
            <text
              x={(CX + rfl.x) / 2 + 10}
              y={(CY + rfl.y) / 2 - 5}
              fontSize={11}
              fontWeight={700}
              fill={RFL}
            >
              θᵣ={i.toFixed(0)}°
            </text>
            <text x={CX} y={CY + 30} textAnchor="middle" fontSize={11} fontWeight={700} fill={RFL}>
              total internal reflection
            </text>
            <text x={CX} y={CY + 47} textAnchor="middle" fontSize={10} fill="var(--stage-muted)">
              no transmitted ray
            </text>
          </>
        )}
        <circle cx={CX} cy={CY} r={3.5} fill="var(--stage-fg)" />
      </svg>
    </div>
  );

  const aside = (
    <>
      <div className="physics-imaging-ledger">
        <div>
          <span>Angle in · θ₁</span>
          <strong>{i.toFixed(0)}°</strong>
        </div>
        <div>
          <span>{tir ? 'Reflected angle · θᵣ' : 'Angle out · θ₂'}</span>
          <strong>{tir ? `${i.toFixed(1)}°` : `${theta2!.toFixed(1)}°`}</strong>
        </div>
        <div>
          <span>Critical angle</span>
          <strong>{crit == null ? 'Not available' : `${crit.toFixed(1)}°`}</strong>
        </div>
      </div>
      <p className="physics-explain">
        {tir
          ? 'Past the critical angle the light can’t leave the denser medium — it all reflects.'
          : denser
            ? 'Into a denser medium: the ray bends toward the normal.'
            : nBot < nTop
              ? 'Into a rarer medium: the ray bends away from the normal.'
              : 'Same index: the ray goes straight through.'}
      </p>
    </>
  );

  // The index is continuous, so a hand-typed n between materials selects none of them: `''` is
  // that state and is deliberately absent from `options`.
  const matChips = (n: number, set: (v: number) => void, label: string): ReactNode => (
    <Segmented
      className="physics-medium-grid"
      ariaLabel={label}
      value={materials.find((m) => Math.abs(n - m.n) < 0.01)?.label ?? ''}
      onChange={(picked) => {
        const material = materials.find((m) => m.label === picked);
        if (material) set(material.n);
      }}
      options={materials.map((m) => ({ value: m.label, label: m.label }))}
    />
  );

  const controls = (
    <div className="lab-activity-fields physics-controls">
      <Field label="top medium n₁">{matChips(nTop, setNTop, 'top medium')}</Field>
      <Field label="bottom medium n₂">{matChips(nBot, setNBot, 'bottom medium')}</Field>
    </div>
  );

  const footer = <ChallengeCard questions={CHALLENGE} state={ch} title="Predict first" />;

  const angleControl = (
    <>
      <IconButton label="Decrease incidence angle 5 degrees" onClick={() => setI(Math.max(0, i - 5))}>
        −
      </IconButton>
      <Field label="incidence angle" value={`${i.toFixed(0)}°`}>
        <Slider value={i} min={0} max={89} step={1} onChange={setI} ariaLabel="angle of incidence" />
      </Field>
      <IconButton label="Increase incidence angle 5 degrees" onClick={() => setI(Math.min(89, i + 5))}>
        +
      </IconButton>
    </>
  );
  return (
    <ControlPolicy>
      <OpticsActivity
        activity={activity}
        activityId="refraction"
        title={title}
        prompt={prompt}
        status={
          <>
            <strong>{bend}</strong>
            <span>θ₁ {i.toFixed(0)}°</span>
            <span>{tir ? `θᵣ ${i.toFixed(1)}°` : `θ₂ ${theta2!.toFixed(1)}°`}</span>
            {crit != null && <span>θc {crit.toFixed(1)}°</span>}
          </>
        }
        figure={figure}
        evidence={aside}
        controls={
          <>
            {controls}
            <div className="lab-field-row">{angleControl}</div>
          </>
        }
        observation={
          tir
            ? 'The required sin θ₂ would be greater than 1, so no transmitted ray exists.'
            : `${f1(nTop)} × sin ${i.toFixed(0)}° = ${f1(nBot)} × sin ${theta2!.toFixed(1)}°`
        }
        transcript={footer}
        objectives={objectives}
      />
    </ControlPolicy>
  );
}
