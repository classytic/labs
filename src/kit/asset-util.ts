/**
 * Helpers for scene-asset Components that render in a y-flipped design space
 * (P(x,y) = coords.toPx(x, H - y), so design-y-down maps to math-y-up). Building an
 * SVG <rect> from two such corners is a known footgun: the projected top/bottom
 * swap, yielding a NEGATIVE height that SVG rejects (bit the ac-dc scope and the lln
 * plot frame). `pxRect` projects both corners and returns a normalized, always-valid
 * rect, use it for every rect in a flipped asset.
 */

export type Proj = (x: number, y: number) => [number, number];

export interface PxRect { x: number; y: number; width: number; height: number }

/** Normalized pixel rect from two DESIGN-space corners (handles the y-flip safely). */
export function pxRect(P: Proj, x0: number, y0: number, x1: number, y1: number): PxRect {
  const [ax, ay] = P(x0, y0);
  const [bx, by] = P(x1, y1);
  return { x: Math.min(ax, bx), y: Math.min(ay, by), width: Math.abs(bx - ax), height: Math.abs(by - ay) };
}
