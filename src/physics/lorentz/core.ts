export interface Vec2Value {
  x: number;
  y: number;
}

/** In-plane force for v=(vx,vy,0), B=(0,0,Bz): q(v×B). */
export function lorentzForce2D(velocity: Vec2Value, charge: number, fieldZ: number): Vec2Value {
  if (![velocity.x, velocity.y, charge, fieldZ].every(Number.isFinite))
    throw new RangeError('Lorentz inputs must be finite');
  return { x: charge * velocity.y * fieldZ, y: -charge * velocity.x * fieldZ };
}

/** Angular sense for cyclotron motion: +1 counter-clockwise, −1 clockwise. */
export function cyclotronSense(charge: number, fieldZ: number): 1 | -1 {
  if (!Number.isFinite(charge) || !Number.isFinite(fieldZ) || charge === 0 || fieldZ === 0)
    throw new RangeError('Charge and field must be finite and non-zero');
  return charge * fieldZ > 0 ? -1 : 1;
}

export function cyclotronRadius(mass: number, speed: number, charge: number, fieldMagnitude: number): number {
  if (
    ![mass, speed, charge, fieldMagnitude].every(Number.isFinite) ||
    mass <= 0 ||
    speed < 0 ||
    charge === 0 ||
    fieldMagnitude <= 0
  )
    throw new RangeError('Invalid cyclotron parameters');
  return (mass * speed) / (Math.abs(charge) * fieldMagnitude);
}
