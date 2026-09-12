export function mod(value: number, modulus: number): number {
  if (!Number.isInteger(modulus) || modulus < 2)
    throw new RangeError('modulus must be an integer of at least 2');
  return ((value % modulus) + modulus) % modulus;
}

export function congruent(a: number, b: number, modulus: number): boolean {
  return mod(a - b, modulus) === 0;
}

export function residuePath(start: number, step: number, turns: number, modulus: number): number[] {
  return Array.from({ length: Math.max(0, turns) + 1 }, (_, index) => mod(start + index * step, modulus));
}
