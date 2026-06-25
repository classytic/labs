'use client';

/**
 * Space glyph kit — Earth, Sun and a satellite, drawn in the stage's pixel frame
 * (project the world centre, then size everything off the px radius so the glyph
 * is crisp at any zoom). Kurzgesagt-style: radial body gradient + a rim shadow
 * for spherical depth + a top-left specular highlight, the technique borrowed from
 * my-video's EarthIcon. Gradient ids are made unique per instance so multiple
 * glyphs on one Stage don't collide.
 *
 * These are decorative (pointer-events:none) — drop a draggable MovableDot on top
 * if the body needs to be grabbed.
 */

import { useId, type ReactNode } from 'react';
import { useCoords, fmt, type Vec2 } from '@classytic/stage';

/** Earth — blue oceans, a few green landmasses, ice caps, rim + shine + atmosphere. */
export function EarthGlyph({ center, r, atmosphere = true }: { center: Vec2; r: number; atmosphere?: boolean }): ReactNode {
  const c = useCoords();
  const [cx, cy] = c.toPx(center.x, center.y);
  const R = c.sx(r);
  const uid = useId().replace(/:/g, '');
  const land = `url(#${uid}-land)`;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <defs>
        <radialGradient id={`${uid}-ocean`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#60A5FA" /><stop offset="40%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1E3A5F" />
        </radialGradient>
        <linearGradient id={`${uid}-land`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ADE80" /><stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <radialGradient id={`${uid}-rim`} cx="50%" cy="50%" r="50%">
          <stop offset="68%" stopColor="rgba(0,0,0,0)" /><stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
        </radialGradient>
        <radialGradient id={`${uid}-shine`} cx="32%" cy="28%" r="42%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" /><stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <clipPath id={`${uid}-clip`}><circle cx={fmt(cx)} cy={fmt(cy)} r={fmt(R)} /></clipPath>
      </defs>
      {atmosphere && <circle cx={fmt(cx)} cy={fmt(cy)} r={fmt(R + R * 0.1)} fill="none" stroke="#93C5FD" strokeWidth={fmt(R * 0.06)} opacity={0.25} />}
      <circle cx={fmt(cx)} cy={fmt(cy)} r={fmt(R)} fill={`url(#${uid}-ocean)`} />
      <g clipPath={`url(#${uid}-clip)`}>
        {/* compact landmasses (blobs, scaled off R) */}
        <path d={`M ${fmt(cx - R * 0.5)} ${fmt(cy - R * 0.45)} q ${fmt(R * 0.3)} ${fmt(-R * 0.15)} ${fmt(R * 0.5)} ${fmt(R * 0.1)} q ${fmt(R * 0.1)} ${fmt(R * 0.3)} ${fmt(-R * 0.15)} ${fmt(R * 0.4)} q ${fmt(-R * 0.35)} ${fmt(R * 0.1)} ${fmt(-R * 0.45)} ${fmt(-R * 0.2)} Z`} fill={land} opacity={0.88} />
        <path d={`M ${fmt(cx + R * 0.05)} ${fmt(cy - R * 0.1)} q ${fmt(R * 0.3)} ${fmt(-R * 0.05)} ${fmt(R * 0.4)} ${fmt(R * 0.25)} q ${fmt(-R * 0.05)} ${fmt(R * 0.45)} ${fmt(-R * 0.3)} ${fmt(R * 0.5)} q ${fmt(-R * 0.25)} ${fmt(-R * 0.1)} ${fmt(-R * 0.1)} ${fmt(-R * 0.7)} Z`} fill={land} opacity={0.82} />
        <ellipse cx={fmt(cx)} cy={fmt(cy - R * 0.92)} rx={fmt(R * 0.6)} ry={fmt(R * 0.16)} fill="#E2E8F0" opacity={0.35} />
        <ellipse cx={fmt(cx)} cy={fmt(cy + R * 0.92)} rx={fmt(R * 0.66)} ry={fmt(R * 0.18)} fill="#F1F5F9" opacity={0.4} />
      </g>
      <circle cx={fmt(cx)} cy={fmt(cy)} r={fmt(R)} fill={`url(#${uid}-rim)`} />
      <circle cx={fmt(cx)} cy={fmt(cy)} r={fmt(R)} fill={`url(#${uid}-shine)`} />
    </g>
  );
}

/** Sun — glowing core with a corona of rays. */
export function SunGlyph({ center, r }: { center: Vec2; r: number }): ReactNode {
  const c = useCoords();
  const [cx, cy] = c.toPx(center.x, center.y);
  const R = c.sx(r);
  const uid = useId().replace(/:/g, '');
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return { x1: fmt(cx + Math.cos(a) * R * 1.15), y1: fmt(cy + Math.sin(a) * R * 1.15), x2: fmt(cx + Math.cos(a) * R * 1.5), y2: fmt(cy + Math.sin(a) * R * 1.5) };
  });
  return (
    <g style={{ pointerEvents: 'none' }}>
      <defs>
        <radialGradient id={`${uid}-core`} cx="42%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#FEF9C3" /><stop offset="45%" stopColor="#FDB813" /><stop offset="100%" stopColor="#F97316" />
        </radialGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="rgba(253,184,19,0)" /><stop offset="80%" stopColor="rgba(253,184,19,0.25)" /><stop offset="100%" stopColor="rgba(253,184,19,0)" />
        </radialGradient>
      </defs>
      <circle cx={fmt(cx)} cy={fmt(cy)} r={fmt(R * 1.8)} fill={`url(#${uid}-glow)`} />
      {rays.map((p, i) => <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke="#FDB813" strokeWidth={fmt(R * 0.14)} strokeLinecap="round" opacity={0.75} />)}
      <circle cx={fmt(cx)} cy={fmt(cy)} r={fmt(R)} fill={`url(#${uid}-core)`} />
      <circle cx={fmt(cx - R * 0.3)} cy={fmt(cy - R * 0.32)} r={fmt(R * 0.32)} fill="rgba(255,255,255,0.45)" />
    </g>
  );
}

/** Satellite — a body with two solar-panel wings and a dish. */
export function SatelliteGlyph({ center, size, tilt = -0.4 }: { center: Vec2; size: number; tilt?: number }): ReactNode {
  const c = useCoords();
  const [cx, cy] = c.toPx(center.x, center.y);
  const s = c.sx(size);
  const deg = (tilt * 180) / Math.PI;
  return (
    <g style={{ pointerEvents: 'none' }} transform={`translate(${fmt(cx)},${fmt(cy)}) rotate(${fmt(deg)})`}>
      {/* solar panels */}
      <rect x={fmt(-s * 2.1)} y={fmt(-s * 0.55)} width={fmt(s * 1.3)} height={fmt(s * 1.1)} rx={fmt(s * 0.1)} fill="#2563EB" stroke="#1E3A8A" strokeWidth={fmt(s * 0.08)} />
      <rect x={fmt(s * 0.8)} y={fmt(-s * 0.55)} width={fmt(s * 1.3)} height={fmt(s * 1.1)} rx={fmt(s * 0.1)} fill="#2563EB" stroke="#1E3A8A" strokeWidth={fmt(s * 0.08)} />
      <line x1={fmt(-s * 0.8)} y1={0} x2={fmt(-s * 0.45)} y2={0} stroke="#94A3B8" strokeWidth={fmt(s * 0.1)} />
      <line x1={fmt(s * 0.45)} y1={0} x2={fmt(s * 0.8)} y2={0} stroke="#94A3B8" strokeWidth={fmt(s * 0.1)} />
      {/* body */}
      <rect x={fmt(-s * 0.5)} y={fmt(-s * 0.6)} width={fmt(s)} height={fmt(s * 1.2)} rx={fmt(s * 0.14)} fill="#E5E7EB" stroke="#9CA3AF" strokeWidth={fmt(s * 0.08)} />
      {/* dish */}
      <ellipse cx={0} cy={fmt(-s * 0.8)} rx={fmt(s * 0.42)} ry={fmt(s * 0.18)} fill="#F8FAFC" stroke="#9CA3AF" strokeWidth={fmt(s * 0.06)} />
      <line x1={0} y1={fmt(-s * 0.6)} x2={0} y2={fmt(-s * 0.82)} stroke="#9CA3AF" strokeWidth={fmt(s * 0.06)} />
    </g>
  );
}
