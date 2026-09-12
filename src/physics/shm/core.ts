export interface OscillatorSample {
  displacement: number;
  velocity: number;
  acceleration: number;
  potentialFraction: number;
  kineticFraction: number;
}

const validPositive = (value: number, name: string): number => {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be finite and positive`);
  return value;
};

export const springOmega = (stiffness: number, mass: number): number =>
  Math.sqrt(validPositive(stiffness, 'stiffness') / validPositive(mass, 'mass'));
export const smallAnglePendulumOmega = (length: number, gravity = 9.8): number =>
  Math.sqrt(validPositive(gravity, 'gravity') / validPositive(length, 'length'));
export const oscillatorPeriod = (omega: number): number =>
  (2 * Math.PI) / validPositive(omega, 'angular frequency');

export function sampleOscillator(amplitude: number, omega: number, time: number): OscillatorSample {
  if (![amplitude, time].every(Number.isFinite)) throw new RangeError('Amplitude and time must be finite');
  validPositive(omega, 'angular frequency');
  const phase = omega * time;
  const c = Math.cos(phase),
    s = Math.sin(phase);
  return {
    displacement: amplitude * c,
    velocity: -amplitude * omega * s,
    acceleration: -amplitude * omega * omega * c,
    potentialFraction: c * c,
    kineticFraction: s * s,
  };
}
