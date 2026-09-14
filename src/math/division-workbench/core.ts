export type DivisionMode = 'share' | 'written' | 'decimal';

export interface DivisionStep {
  place: number;
  brought: number;
  quotientDigit: number;
  product: number;
  remainder: number;
}

export interface DivisionModel {
  dividend: number;
  divisor: number;
  normalizedDividend: number;
  normalizedDivisor: number;
  scale: number;
  quotient: number;
  integerQuotient: number;
  remainder: number;
  steps: DivisionStep[];
}

function decimalPlaces(value: number): number {
  const text = String(value);
  if (text.includes('e-')) return Number(text.split('e-')[1] ?? 0);
  return text.includes('.') ? (text.split('.')[1]?.length ?? 0) : 0;
}

export function normalizeDivision(dividend: number, divisor: number): Pick<DivisionModel, 'normalizedDividend' | 'normalizedDivisor' | 'scale'> {
  if (!Number.isFinite(dividend) || dividend < 0) throw new Error('Dividend must be a finite non-negative number.');
  if (!Number.isFinite(divisor) || divisor <= 0) throw new Error('Divisor must be a finite positive number.');
  const places = Math.max(decimalPlaces(dividend), decimalPlaces(divisor));
  const scale = 10 ** places;
  return {
    normalizedDividend: Math.round(dividend * scale),
    normalizedDivisor: Math.round(divisor * scale),
    scale,
  };
}

export function writtenDivisionSteps(dividend: number, divisor: number): DivisionStep[] {
  const digits = String(Math.max(0, Math.trunc(dividend))).split('').map(Number);
  let carried = 0;
  return digits.map((digit, place) => {
    const brought = carried * 10 + digit;
    const quotientDigit = Math.floor(brought / divisor);
    const product = quotientDigit * divisor;
    carried = brought - product;
    return { place, brought, quotientDigit, product, remainder: carried };
  });
}

export function divisionModel(dividend: number, divisor: number): DivisionModel {
  const normalized = normalizeDivision(dividend, divisor);
  const integerQuotient = Math.floor(normalized.normalizedDividend / normalized.normalizedDivisor);
  const remainder = normalized.normalizedDividend % normalized.normalizedDivisor;
  return {
    dividend,
    divisor,
    ...normalized,
    quotient: dividend / divisor,
    integerQuotient,
    remainder,
    steps: writtenDivisionSteps(normalized.normalizedDividend, normalized.normalizedDivisor),
  };
}

export function formatQuotient(value: number, precision = 4): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(precision).replace(/0+$/, '').replace(/\.$/, '');
}
