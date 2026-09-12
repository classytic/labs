/**
 * Projectile motion — the individual equations, as pure leaf functions. Each is one
 * textbook formula so it can be unit-tested and reasoned about in isolation. No React,
 * DOM, or browser: the same equations power SVG/Canvas/WebGL renderers, a worker, a
 * server precompute, or a direct AI-agent call.
 */

import type { Point } from './types.js';

export const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Resolve a launch speed + angle into horizontal / vertical velocity components. */
export function velocityComponents(speed: number, angleDeg: number): { vx: number; vy: number } {
  const a = toRad(angleDeg);
  return { vx: speed * Math.cos(a), vy: speed * Math.sin(a) };
}

/** Range over level ground: R = vx · (2·vy) / g. */
export const range = (vx: number, vy: number, g: number): number => (vx * (2 * vy)) / g;

/** Peak height above launch: H = vy² / (2g). */
export const peakHeight = (vy: number, g: number): number => (vy * vy) / (2 * g);

/** Time of flight back to launch height: T = 2·vy / g. */
export const timeOfFlight = (vy: number, g: number): number => (2 * vy) / g;

/** Position at time t (y clamped at the ground, y = 0). */
export function positionAt(vx: number, vy: number, g: number, t: number): Point {
  return { x: vx * t, y: Math.max(vy * t - 0.5 * g * t * t, 0) };
}
