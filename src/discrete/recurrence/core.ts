export interface LinearRecurrence {
  base: number[];
  coefficients: number[];
}

export function recurrenceTerms(rule: LinearRecurrence, count: number): number[] {
  if (rule.base.length === 0 || rule.coefficients.length === 0) return [];
  const terms = rule.base.slice(0, count);
  while (terms.length < count) {
    const next = rule.coefficients.reduce((sum, coefficient, offset) => {
      const source = terms[terms.length - offset - 1] ?? 0;
      return sum + coefficient * source;
    }, 0);
    terms.push(next);
  }
  return terms;
}

export function recurrenceDependencies(index: number, order: number): number[] {
  return Array.from({ length: Math.min(order, index) }, (_, offset) => index - offset - 1).reverse();
}
