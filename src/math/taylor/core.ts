export const factorial = (n: number): number => {
  const count = Math.max(0, Math.floor(n));
  let value = 1;
  for (let index = 2; index <= count; index++) value *= index;
  return value;
};

/** Coefficients c_n = f^(n)(a)/n! supplied by exact derivative evaluators. */
export function taylorCoefficients(
  derivatives: readonly ((x: number) => number)[],
  center: number,
): number[] {
  return derivatives.map((derivative, order) => derivative(center) / factorial(order));
}

export function evaluateTaylor(
  coefficients: readonly number[],
  center: number,
  x: number,
  order = coefficients.length - 1,
): number {
  const highest = Math.min(Math.max(0, Math.floor(order)), coefficients.length - 1);
  const dx = x - center;
  let value = 0;
  for (let index = highest; index >= 0; index--) value = value * dx + (coefficients[index] ?? 0);
  return value;
}

export function maxApproximationError(
  fn: (x: number) => number,
  approximation: (x: number) => number,
  range: readonly [number, number],
  samples = 160,
): number {
  const count = Math.max(8, Math.floor(samples));
  let maximum = 0;
  for (let index = 0; index <= count; index++) {
    const x = range[0] + ((range[1] - range[0]) * index) / count;
    const error = Math.abs(fn(x) - approximation(x));
    if (Number.isFinite(error)) maximum = Math.max(maximum, error);
  }
  return maximum;
}
