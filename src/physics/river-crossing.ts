/**
 * River crossing: the two optimisations, and the regime that decides which one you get.
 *
 * Every textbook prints the same two bullets. Aim straight across and the crossing is fastest,
 * t = W/v. Aim upstream by sin θ = u/v and you land directly opposite. Then, in brackets, it adds
 * "requires v > u" and moves on.
 *
 * That bracket is the whole subject. The two aims are in tension, you cannot have both unless the
 * water is still, and once the current outruns the boat the second aim stops existing: no heading
 * lands you opposite, and the best you can do is lose as little ground as possible. The heading
 * that achieves THAT is sin θ = v/u, the exact mirror of the other condition, and it only exists
 * in the other regime. A printed page cannot let you cross that boundary and watch one optimum
 * hand over to the other. A screen can, which is the only reason this module exists.
 *
 * Angles are degrees upstream from straight across, matching the lab's slider: θ = 0 points at
 * the far bank, positive θ leans into the current.
 */

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;

export interface Crossing {
  /** Speed component across the river, which alone sets the crossing time. */
  across: number;
  /** Net speed along the river: the current, less whatever the boat spends fighting it. */
  downstream: number;
  /** Seconds to reach the far bank, Infinity when the boat never gets there. */
  time: number;
  /** Metres downstream of the launch point at landing, negative when upstream of it. */
  drift: number;
  /** False when the boat has no component across the river at all. */
  lands: boolean;
}

/** What one heading actually does. */
export function crossing(boat: number, current: number, headingDeg: number, width: number): Crossing {
  const rad = toRad(headingDeg);
  const across = boat * Math.cos(rad);
  const downstream = current - boat * Math.sin(rad);
  const lands = across > 1e-9;
  const time = lands ? width / across : Infinity;
  return { across, downstream, time, drift: lands ? downstream * time : Infinity, lands };
}

export type Regime = 'boat-wins' | 'balanced' | 'current-wins';

/**
 * Which optimisation is available.
 *
 * `boat-wins` (v > u): you can land directly opposite, at a price in time.
 * `balanced` (v === u): the two conditions meet at θ = 90°, where the boat points straight
 *   upstream and never crosses. Both aims collapse together, which is the boundary itself.
 * `current-wins` (v < u): landing opposite is impossible at any heading. Minimum drift is the
 *   only optimum left.
 */
export function regime(boat: number, current: number): Regime {
  if (Math.abs(boat - current) < 1e-9) return 'balanced';
  return boat > current ? 'boat-wins' : 'current-wins';
}

/** The fastest crossing is always straight across, whatever the current is doing. */
export const aimFastest = (): number => 0;

/**
 * The heading that lands you directly opposite: sin θ = u/v. Null when the current outruns the
 * boat, because then no heading does, and returning a clamped angle would be a lie.
 */
export function aimStraightAcross(boat: number, current: number): number | null {
  if (current > boat || boat <= 0) return null;
  return toDeg(Math.asin(current / boat));
}

/**
 * The heading that loses the least ground when landing opposite is impossible: sin θ = v/u.
 *
 * Derived by minimising drift = W(u − v sin θ)/(v cos θ) over θ. The derivative vanishes at
 * sin θ = v/u, which needs u >= v: in the other regime the minimum is the zero-drift heading
 * instead, so this returns null there and the caller should use `aimStraightAcross`.
 */
export function aimMinDrift(boat: number, current: number): number | null {
  if (boat > current || current <= 0) return null;
  return toDeg(Math.asin(boat / current));
}

/** The least drift achievable, W·√(u² − v²)/v, once landing opposite is off the table. */
export function minDrift(boat: number, current: number, width: number): number {
  if (boat > current || boat <= 0) return 0;
  return (width * Math.sqrt(current * current - boat * boat)) / boat;
}

export interface Strategy {
  id: 'fastest' | 'straight' | 'min-drift';
  label: string;
  /** Null when this strategy does not exist in the current regime. */
  headingDeg: number | null;
  /** Why it is unavailable, for the learner rather than for a log. */
  unavailable?: string;
}

/**
 * The strategies on offer, always all of them, with the unavailable one saying WHY.
 *
 * Hiding a control when its regime ends is the worst of the options: the learner drags a slider,
 * a button vanishes, and nothing tells them that the physics changed rather than the interface.
 */
export function strategies(boat: number, current: number): Strategy[] {
  const straight = aimStraightAcross(boat, current);
  const drift = aimMinDrift(boat, current);
  return [
    { id: 'fastest', label: 'Cross fastest', headingDeg: aimFastest() },
    {
      id: 'straight',
      label: 'Land directly opposite',
      headingDeg: straight,
      unavailable:
        straight === null
          ? 'The current is faster than the boat, so no heading cancels the drift.'
          : undefined,
    },
    {
      id: 'min-drift',
      label: 'Lose the least ground',
      headingDeg: drift,
      unavailable:
        drift === null
          ? 'The boat can already land directly opposite, so the least drift is zero.'
          : undefined,
    },
  ];
}
