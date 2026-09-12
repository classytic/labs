export interface EnergySnapshot {
  potential: number;
  kinetic: number;
  thermal: number;
  total: number;
}

export interface CollisionResult {
  velocity1: number;
  velocity2: number;
  momentumBefore: number;
  momentumAfter: number;
  kineticBefore: number;
  kineticAfter: number;
}

export interface ForceTimePoint {
  x: number;
  y: number;
}

export interface CircularMotionState {
  angularSpeed: number;
  centripetalForce: number;
  period: number;
}

export interface AtwoodState {
  acceleration: number;
  tension: number;
}

export interface RampForceState {
  normal: number;
  gravityAlong: number;
  staticLimit: number;
  friction: number;
  net: number;
  acceleration: number;
  held: boolean;
}

export interface TerminalVelocityState {
  terminalSpeed: number;
  timeConstant: number;
  speed: number;
  dragRatio: number;
  acceleration: number;
  distance: number;
}

export interface StoppingMetrics {
  reactionDuration: number;
  brakingDuration: number;
  totalDuration: number;
  reactionDistance: number;
  brakingDistance: number;
  totalDistance: number;
}

export interface PenetrationResult {
  fullPenetrated: number;
  remainingSpeedSquared: number;
  lodgeFraction: number;
  exitsStack: boolean;
}

/** Height on a symmetric parabolic track whose lips are (+/- halfWidth, lipHeight). */
export function parabolicTrackHeight(x: number, halfWidth: number, lipHeight: number): number {
  if (halfWidth <= 0) throw new RangeError('halfWidth must be positive');
  return lipHeight * (x / halfWidth) ** 2;
}

/** Partition a fixed energy budget into PE, KE, and thermal energy. */
export function energySnapshot(
  total: number,
  mass: number,
  gravity: number,
  height: number,
  thermal = 0,
): EnergySnapshot {
  const boundedThermal = Math.min(Math.max(0, thermal), Math.max(0, total));
  const potential = Math.min(Math.max(0, mass * gravity * height), Math.max(0, total - boundedThermal));
  const kinetic = Math.max(0, total - potential - boundedThermal);
  return { potential, kinetic, thermal: boundedThermal, total: potential + kinetic + boundedThermal };
}

/** One-dimensional collision for coefficient of restitution 0..1. */
export function collisionResult(
  m1: number,
  m2: number,
  u1: number,
  u2: number,
  restitution: number,
): CollisionResult {
  if (m1 <= 0 || m2 <= 0) throw new RangeError('masses must be positive');
  const e = Math.min(1, Math.max(0, restitution));
  const mass = m1 + m2;
  const momentumBefore = m1 * u1 + m2 * u2;
  const velocity1 = (momentumBefore + m2 * e * (u2 - u1)) / mass;
  const velocity2 = (momentumBefore + m1 * e * (u1 - u2)) / mass;
  const kineticBefore = 0.5 * m1 * u1 ** 2 + 0.5 * m2 * u2 ** 2;
  const kineticAfter = 0.5 * m1 * velocity1 ** 2 + 0.5 * m2 * velocity2 ** 2;
  return {
    velocity1,
    velocity2,
    momentumBefore,
    momentumAfter: m1 * velocity1 + m2 * velocity2,
    kineticBefore,
    kineticAfter,
  };
}

/** Peak of a half-sine force pulse whose area equals the requested impulse. */
export function halfSinePeakForce(impulse: number, duration: number): number {
  if (duration <= 0) throw new RangeError('duration must be positive');
  return (Math.PI * Math.abs(impulse)) / (2 * duration);
}

/** Sample a half-sine pulse; its integral is the requested impulse. */
export function halfSinePulse(impulse: number, duration: number, samples = 60): ForceTimePoint[] {
  const count = Math.max(2, Math.floor(samples));
  const peak = halfSinePeakForce(impulse, duration);
  return Array.from({ length: count + 1 }, (_, index) => {
    const x = (index / count) * duration;
    return { x, y: peak * Math.sin((Math.PI * x) / duration) };
  });
}

export function circularMotionState(mass: number, speed: number, radius: number): CircularMotionState {
  if (mass <= 0 || radius <= 0 || speed < 0)
    throw new RangeError('mass and radius must be positive; speed cannot be negative');
  const angularSpeed = speed / radius;
  return {
    angularSpeed,
    centripetalForce: (mass * speed ** 2) / radius,
    period: speed === 0 ? Infinity : (2 * Math.PI) / angularSpeed,
  };
}

export function atwoodState(mass1: number, mass2: number, gravity = 9.8): AtwoodState {
  if (mass1 <= 0 || mass2 <= 0 || gravity <= 0) throw new RangeError('masses and gravity must be positive');
  const total = mass1 + mass2;
  return {
    acceleration: ((mass1 - mass2) * gravity) / total,
    tension: (2 * mass1 * mass2 * gravity) / total,
  };
}

/** Signed along-ramp force balance; positive points up the slope. */
export function rampForceState(
  mass: number,
  gravity: number,
  angleRadians: number,
  applied: number,
  staticFriction: number,
  kineticFriction: number,
): RampForceState {
  if (mass <= 0 || gravity <= 0) throw new RangeError('mass and gravity must be positive');
  const mus = Math.max(0, staticFriction);
  const muk = Math.min(mus, Math.max(0, kineticFriction));
  const normal = mass * gravity * Math.cos(angleRadians);
  const gravityAlong = mass * gravity * Math.sin(angleRadians);
  const drive = applied - gravityAlong;
  const staticLimit = mus * normal;
  const held = Math.abs(drive) <= staticLimit + 1e-9;
  const friction = held ? -drive : -Math.sign(drive) * muk * normal;
  const net = held ? 0 : drive + friction;
  return { normal, gravityAlong, staticLimit, friction, net, acceleration: net / mass, held };
}

/** Exact solution of m dv/dt = mg - b v² for release from rest. */
export function terminalVelocityState(
  mass: number,
  gravity: number,
  drag: number,
  time: number,
): TerminalVelocityState {
  if (mass <= 0 || gravity <= 0 || drag <= 0)
    throw new RangeError('mass, gravity, and drag must be positive');
  const t = Math.max(0, time);
  const terminalSpeed = Math.sqrt((mass * gravity) / drag);
  const timeConstant = terminalSpeed / gravity;
  const ratio = Math.tanh(t / timeConstant);
  const dragRatio = ratio ** 2;
  return {
    terminalSpeed,
    timeConstant,
    speed: terminalSpeed * ratio,
    dragRatio,
    acceleration: gravity * (1 - dragRatio),
    distance: (terminalSpeed ** 2 / gravity) * Math.log(Math.cosh(t / timeConstant)),
  };
}

export function stoppingMetrics(speed: number, reactionTime: number, deceleration: number): StoppingMetrics {
  if (speed < 0 || reactionTime < 0 || deceleration <= 0)
    throw new RangeError('speed and reaction time cannot be negative; deceleration must be positive');
  const reactionDistance = speed * reactionTime;
  const brakingDistance = speed ** 2 / (2 * deceleration);
  const brakingDuration = speed / deceleration;
  return {
    reactionDuration: reactionTime,
    brakingDuration,
    totalDuration: reactionTime + brakingDuration,
    reactionDistance,
    brakingDistance,
    totalDistance: reactionDistance + brakingDistance,
  };
}

export function stoppingPositionAt(
  time: number,
  speed: number,
  reactionTime: number,
  deceleration: number,
): number {
  const metrics = stoppingMetrics(speed, reactionTime, deceleration);
  const t = Math.min(Math.max(0, time), metrics.totalDuration);
  if (t <= reactionTime) return speed * t;
  const brakingTime = t - reactionTime;
  return metrics.reactionDistance + speed * brakingTime - 0.5 * deceleration * brakingTime ** 2;
}

export function stoppingSpeedAt(
  time: number,
  speed: number,
  reactionTime: number,
  deceleration: number,
): number {
  const metrics = stoppingMetrics(speed, reactionTime, deceleration);
  const t = Math.min(Math.max(0, time), metrics.totalDuration);
  return t <= reactionTime ? speed : Math.max(0, speed - deceleration * (t - reactionTime));
}

/** Penetration when every barrier removes the same amount of v² (constant work per barrier). */
export function penetrationResult(
  speed: number,
  speedSquaredCost: number,
  barriers: number,
): PenetrationResult {
  if (speed < 0 || speedSquaredCost <= 0 || barriers < 0)
    throw new RangeError('speed and barriers cannot be negative; cost must be positive');
  const count = Math.floor(barriers);
  const available = speed ** 2;
  const theoreticalFull = Math.floor(available / speedSquaredCost + 1e-12);
  const fullPenetrated = Math.min(count, theoreticalFull);
  const exitsStack = theoreticalFull >= count;
  const remainingSpeedSquared = Math.max(0, available - fullPenetrated * speedSquaredCost);
  return {
    fullPenetrated,
    remainingSpeedSquared,
    lodgeFraction: exitsStack ? 0 : Math.min(1, remainingSpeedSquared / speedSquaredCost),
    exitsStack,
  };
}
