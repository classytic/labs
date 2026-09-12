'use client';

/**
 * The tiger and the deer, drawn side-on and facing the way they run.
 *
 * A first version drew them from above, which is geometrically honest for a map and useless for a
 * learner: a striped ellipse read as a wasp and a spotted one as a lizard. Side-on silhouettes are
 * recognisable at a glance, the way game maps draw characters. Each faces its direction of travel
 * (mirrored when running left) and tilts a little towards its heading, clamped so it never stands
 * on its tail. Natural fur colours make them readable; trails and vectors keep the data hues.
 *
 * Geometry is authored in a unit box, 1 wide, facing right, then scaled to `size` pixels.
 */

import type { ReactNode } from 'react';
import { HUE, STROKE, shade, tint } from '../../kit/figure/index.js';

interface AnimalProps {
  /** Centre of the body, px. */
  x: number;
  y: number;
  /** Direction of travel on screen, degrees anticlockwise from east (y up, as in the physics). */
  heading: number;
  /** Width of the drawing, px. */
  size?: number;
}

/** Face the direction of travel and lean towards it, within ±35°. */
function pose(x: number, y: number, heading: number, size: number): string {
  const a = (((heading % 360) + 540) % 360) - 180; // −180..180
  const right = Math.abs(a) <= 90;
  const lean = right ? a : a > 0 ? 180 - a : -180 - a; // the heading measured from the way it faces
  const tilt = Math.max(-35, Math.min(35, lean));
  // Translate to the centre, lean, mirror if running left, scale the unit box and centre it.
  return `translate(${x} ${y}) rotate(${-tilt}) scale(${right ? size : -size} ${size}) translate(-0.5 -0.34)`;
}

export function TigerGlyph({ x, y, heading, size = 58 }: AnimalProps): ReactNode {
  const fur = HUE.warn;
  const dark = shade(HUE.warn, 28);
  const pale = tint(HUE.warn, 30);
  const hair = STROKE.hair / size;
  return (
    <g transform={pose(x, y, heading, size)}>
      <ellipse cx={0.5} cy={0.62} rx={0.42} ry={0.035} fill="var(--fig-shadow)" />
      {/* tail, raised in the chase */}
      <path
        d="M 0.2 0.27 Q 0.06 0.24 0.03 0.08"
        fill="none"
        stroke={fur}
        strokeWidth={0.05}
        strokeLinecap="round"
      />
      <path
        d="M 0.2 0.27 Q 0.06 0.24 0.03 0.08"
        fill="none"
        stroke={dark}
        strokeWidth={0.05}
        strokeLinecap="round"
        strokeDasharray="0.035 0.045"
      />
      {/* legs at full stretch: hind legs back, forelegs forward */}
      <path
        d="M 0.27 0.36 L 0.14 0.55 M 0.33 0.37 L 0.24 0.57 M 0.66 0.36 L 0.8 0.54 M 0.71 0.35 L 0.88 0.5"
        fill="none"
        stroke={fur}
        strokeWidth={0.055}
        strokeLinecap="round"
      />
      {/* the long body, pale underneath */}
      <ellipse cx={0.49} cy={0.3} rx={0.3} ry={0.12} fill={fur} stroke={dark} strokeWidth={hair} />
      <ellipse cx={0.5} cy={0.37} rx={0.22} ry={0.045} fill={pale} />
      {[0.3, 0.39, 0.48, 0.57, 0.66].map((sx) => (
        <path
          key={sx}
          d={`M ${sx} 0.19 Q ${sx + 0.03} 0.26 ${sx - 0.01} 0.33`}
          fill="none"
          stroke={dark}
          strokeWidth={0.025}
          strokeLinecap="round"
        />
      ))}
      {/* head with ears and a pale muzzle */}
      <path d="M 0.8 0.13 L 0.83 0.07 L 0.86 0.13 Z" fill={fur} stroke={dark} strokeWidth={hair} />
      <circle cx={0.86} cy={0.2} r={0.085} fill={fur} stroke={dark} strokeWidth={hair} />
      <ellipse cx={0.93} cy={0.24} rx={0.045} ry={0.035} fill={pale} />
      <circle cx={0.885} cy={0.18} r={0.012} fill={dark} />
    </g>
  );
}

export function DeerGlyph({ x, y, heading, size = 50 }: AnimalProps): ReactNode {
  const coat = shade(HUE.warn, 62);
  const dark = shade(HUE.warn, 36);
  const pale = tint(HUE.warn, 22);
  const hair = STROKE.hair / size;
  return (
    <g transform={pose(x, y, heading, size)}>
      <ellipse cx={0.5} cy={0.72} rx={0.36} ry={0.035} fill="var(--fig-shadow)" />
      {/* long thin legs in a leap */}
      <path
        d="M 0.28 0.42 L 0.12 0.62 M 0.33 0.43 L 0.22 0.68 M 0.62 0.42 L 0.76 0.66 M 0.67 0.4 L 0.86 0.58"
        fill="none"
        stroke={coat}
        strokeWidth={0.035}
        strokeLinecap="round"
      />
      {/* a white tail flag, raised in alarm */}
      <ellipse cx={0.2} cy={0.26} rx={0.04} ry={0.06} fill={pale} stroke={dark} strokeWidth={hair} />
      <ellipse cx={0.46} cy={0.34} rx={0.26} ry={0.1} fill={coat} stroke={dark} strokeWidth={hair} />
      {[0.34, 0.44, 0.54].map((sx) => (
        <circle key={sx} cx={sx} cy={0.3} r={0.016} fill={pale} />
      ))}
      {/* neck rising to a narrow head */}
      <path d="M 0.62 0.3 L 0.72 0.1 L 0.8 0.13 L 0.72 0.36 Z" fill={coat} stroke={dark} strokeWidth={hair} />
      <ellipse
        cx={0.81}
        cy={0.1}
        rx={0.08}
        ry={0.045}
        fill={coat}
        stroke={dark}
        strokeWidth={hair}
        transform="rotate(18 0.81 0.1)"
      />
      <circle cx={0.8} cy={0.085} r={0.01} fill={dark} />
      {/* branching antlers */}
      <path
        d="M 0.75 0.06 L 0.7 -0.06 M 0.72 -0.01 L 0.64 -0.04 M 0.71 -0.04 L 0.74 -0.11 M 0.78 0.06 L 0.8 -0.06 M 0.795 -0.01 L 0.86 -0.05"
        fill="none"
        stroke={dark}
        strokeWidth={0.02}
        strokeLinecap="round"
      />
    </g>
  );
}
