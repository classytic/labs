export function inverseSquareForce(
  gravitationalConstant: number,
  mass1: number,
  mass2: number,
  distance: number,
): number {
  if (gravitationalConstant <= 0 || mass1 <= 0 || mass2 <= 0 || distance <= 0)
    throw new RangeError('constant, masses, and distance must be positive');
  return (gravitationalConstant * mass1 * mass2) / distance ** 2;
}

export function gravitationalAcceleration(
  gravitationalConstant: number,
  centralMass: number,
  distance: number,
): number {
  return inverseSquareForce(gravitationalConstant, centralMass, 1, distance);
}

export function circularOrbitSpeed(
  gravitationalConstant: number,
  centralMass: number,
  radius: number,
): number {
  if (gravitationalConstant <= 0 || centralMass <= 0 || radius <= 0)
    throw new RangeError('constant, mass, and radius must be positive');
  return Math.sqrt((gravitationalConstant * centralMass) / radius);
}

const TAU = Math.PI * 2;

export function solveEccentricAnomaly(
  meanAnomaly: number,
  eccentricity: number,
  tolerance = 1e-10,
  maxIterations = 20,
): number {
  if (eccentricity < 0 || eccentricity >= 1) throw new RangeError('eccentricity must be in [0, 1)');
  const turns = Math.floor(meanAnomaly / TAU);
  const normalized = meanAnomaly - turns * TAU;
  let anomaly = eccentricity < 0.8 ? normalized : Math.PI;
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const delta =
      (anomaly - eccentricity * Math.sin(anomaly) - normalized) / (1 - eccentricity * Math.cos(anomaly));
    anomaly -= delta;
    if (Math.abs(delta) <= tolerance) return anomaly + turns * TAU;
  }
  return anomaly + turns * TAU;
}

export interface EllipseState {
  x: number;
  y: number;
  eccentricAnomaly: number;
  radius: number;
}

/** Position with the attracting focus at the origin and periapsis on +x. */
export function ellipseStateAtMeanAnomaly(
  semiMajor: number,
  eccentricity: number,
  meanAnomaly: number,
): EllipseState {
  if (semiMajor <= 0) throw new RangeError('semi-major axis must be positive');
  const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly, eccentricity);
  const x = semiMajor * (Math.cos(eccentricAnomaly) - eccentricity);
  const y = semiMajor * Math.sqrt(1 - eccentricity ** 2) * Math.sin(eccentricAnomaly);
  return { x, y, eccentricAnomaly, radius: semiMajor * (1 - eccentricity * Math.cos(eccentricAnomaly)) };
}

/** Normalized Kepler period; scale selects the lesson's time unit. */
export function keplerPeriod(semiMajor: number, scale = 1): number {
  if (semiMajor <= 0 || scale <= 0) throw new RangeError('semi-major axis and scale must be positive');
  return scale * semiMajor ** 1.5;
}

export interface TwoBodyState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function stepTwoBody(state: TwoBodyState, gravitationalParameter: number, dt: number): TwoBodyState {
  if (gravitationalParameter <= 0 || dt <= 0)
    throw new RangeError('gravitational parameter and timestep must be positive');
  const radiusSquared = state.x ** 2 + state.y ** 2;
  if (radiusSquared === 0) throw new RangeError('body cannot be at the force centre');
  const factor = -gravitationalParameter / (radiusSquared * Math.sqrt(radiusSquared));
  const vx = state.vx + factor * state.x * dt;
  const vy = state.vy + factor * state.y * dt;
  return { x: state.x + vx * dt, y: state.y + vy * dt, vx, vy };
}

export function specificOrbitalEnergy(state: TwoBodyState, gravitationalParameter: number): number {
  const radius = Math.hypot(state.x, state.y);
  if (radius === 0 || gravitationalParameter <= 0)
    throw new RangeError('radius and gravitational parameter must be positive');
  return 0.5 * (state.vx ** 2 + state.vy ** 2) - gravitationalParameter / radius;
}

export function launchState(radius: number, speedRatio: number, gravitationalParameter = 1): TwoBodyState {
  return { x: radius, y: 0, vx: 0, vy: -circularOrbitSpeed(gravitationalParameter, 1, radius) * speedRatio };
}
