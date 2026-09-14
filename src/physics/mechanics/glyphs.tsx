'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useCoords, type Vec2 } from '@classytic/stage';

function haloText(fill: string): CSSProperties {
  return {
    fill,
    paintOrder: 'stroke',
    stroke: 'var(--stage-bg)',
    strokeWidth: 4,
    strokeLinejoin: 'round',
  };
}

export function MechanicsCartGlyph({
  at,
  color,
  name,
  mass,
}: {
  at: Vec2;
  color: string;
  name: string;
  mass: number;
}): ReactNode {
  const coords = useCoords();
  const [x, y] = coords.toPx(at.x, at.y);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="8" rx="43" ry="7" fill="var(--stage-fg)" opacity="0.12" />
      <path
        d="M-45-8 H31 L43 2 V12 H-45 Z"
        fill={color}
        stroke="var(--stage-fg)"
        strokeOpacity="0.72"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M-27-8 L-16-24 H13 L28-8 Z"
        fill={color}
        stroke="var(--stage-fg)"
        strokeOpacity="0.72"
        strokeWidth="2"
      />
      <path d="M-13-21 H9 L20-8 H-20 Z" fill="var(--stage-bg)" opacity="0.72" />
      <circle cx="-26" cy="13" r="9" fill="var(--stage-fg)" />
      <circle cx="27" cy="13" r="9" fill="var(--stage-fg)" />
      <circle cx="-26" cy="13" r="3" fill="var(--stage-bg)" />
      <circle cx="27" cy="13" r="3" fill="var(--stage-bg)" />
      <text
        x="0"
        y="-34"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        style={haloText('var(--stage-fg)')}
      >
        {name} · {mass} kg
      </text>
    </g>
  );
}

export function FallingBodyGlyph({ at, parachute = false }: { at: Vec2; parachute?: boolean }): ReactNode {
  const coords = useCoords();
  const [x, y] = coords.toPx(at.x, at.y);
  return (
    <g transform={`translate(${x} ${y})`}>
      {parachute && (
        <>
          <path
            d="M-64-58 Q0-118 64-58 Q32-78 0-58 Q-32-78-64-58Z"
            fill="var(--stage-accent-2)"
            stroke="var(--stage-fg)"
            strokeWidth="2"
          />
          <path
            d="M-61-58 L-15-7 M61-58 L15-7 M0-58 V-8"
            fill="none"
            stroke="var(--stage-muted)"
            strokeWidth="2"
          />
        </>
      )}
      <circle cx="0" cy="-22" r="11" fill="var(--stage-warn)" stroke="var(--stage-fg)" strokeWidth="2" />
      <path
        d="M-13-8 Q0-15 13-8 L16 28 Q0 36-16 28 Z"
        fill="var(--stage-primary)"
        stroke="var(--stage-fg)"
        strokeWidth="2"
      />
      {!parachute && (
        <rect
          x="9"
          y="-5"
          width="9"
          height="27"
          rx="4"
          fill="color-mix(in oklab, var(--stage-muted) 24%, var(--stage-bg))"
          stroke="var(--stage-fg)"
          strokeWidth="1.5"
        />
      )}
      <path
        d="M-10 4 L-34 18 L-27 25 M10 4 L34 18 L27 25 M-8 28 L-23 50 L-31 45 M8 28 L23 50 L31 45"
        fill="none"
        stroke="var(--stage-fg)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </g>
  );
}

export function SkaterGlyph({ at, direction = 1 }: { at: Vec2; direction?: -1 | 1 }): ReactNode {
  const coords = useCoords();
  const [x, y] = coords.toPx(at.x, at.y);
  return (
    <g transform={`translate(${x} ${y}) scale(${direction} 1)`}>
      <ellipse cx="0" cy="13" rx="27" ry="5" fill="var(--stage-fg)" opacity="0.12" />
      <path d="M-24 7 H22" stroke="var(--stage-primary)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="-17" cy="13" r="4" fill="var(--stage-fg)" />
      <circle cx="15" cy="13" r="4" fill="var(--stage-fg)" />
      <circle cx="3" cy="-36" r="8" fill="var(--stage-warn)" stroke="var(--stage-fg)" strokeWidth="2" />
      <path d="M1-27 L-5-8 L11 3 M-5-8 L-19 4 M-2-20 L-17-13 M0-20 L15-10" fill="none" stroke="var(--stage-fg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-3-27 Q4-29 9-22 L4-9 L-8-12 Z" fill="var(--stage-accent-2)" stroke="var(--stage-fg)" strokeWidth="1.5" />
    </g>
  );
}

export function MechanicsCrateGlyph({
  at,
  angleDeg,
  label,
}: {
  at: Vec2;
  angleDeg: number;
  label?: string;
}): ReactNode {
  const coords = useCoords();
  const [x, y] = coords.toPx(at.x, at.y);
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`rotate(${-angleDeg})`}>
        <rect
          x="-21"
          y="-21"
          width="42"
          height="42"
          rx="4"
          fill="var(--stage-accent-2)"
          stroke="var(--stage-fg)"
          strokeWidth="2.5"
        />
        <path
          d="M-15-15 L15 15 M15-15 L-15 15"
          stroke="var(--stage-fg)"
          strokeOpacity="0.28"
          strokeWidth="2"
        />
        <path d="M-21-21 H21 L15-15 H-15 Z" fill="var(--stage-bg)" opacity="0.45" />
      </g>
      {label && (
        <g transform="translate(32 25)">
          <rect
            x="-20"
            y="-10"
            width="40"
            height="20"
            rx="10"
            fill="var(--stage-bg)"
            stroke="var(--stage-border)"
            strokeWidth="1.5"
          />
          <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--stage-fg)">
            {label}
          </text>
        </g>
      )}
    </g>
  );
}
