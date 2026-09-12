/** Projectile motion — pure domain types. No React, DOM, canvas, or browser state. */

export interface ProjectileInput {
  /** Launch angle above the horizontal, in degrees. */
  angleDeg: number;
  /** Launch speed, in m/s. */
  speed: number;
  /** Gravitational acceleration, in m/s². */
  g: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface ProjectileResult {
  /** Horizontal velocity component, m/s. */
  vx: number;
  /** Vertical velocity component, m/s. */
  vy: number;
  /** Horizontal distance travelled before returning to launch height, m. */
  range: number;
  /** Maximum height above launch, m. */
  peak: number;
  /** Total time in the air, s. */
  timeOfFlight: number;
}

export interface LandingResult {
  /** Where the projectile lands on the ground (x, m). */
  landedX: number;
  /** |landedX − target|, m. */
  error: number;
  /** Whether the landing is within tolerance of the target. */
  hit: boolean;
}
