import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { arrayState, divisibilityEvidence, factorPairs, factorTree, gcd, isPrime, lcm, primeFactors, primePowers } from '../../../../src/math/number-structure/core.js';
import manifest from '../../../../src/domains/math/number-structure/manifest.js';
import Runtime from '../../../../src/domains/math/number-structure/runtime.js';
describe('number structure', () => {
  it('computes factors and primes exactly', () => { expect(factorPairs(24)).toEqual([{rows:1,columns:24},{rows:2,columns:12},{rows:3,columns:8},{rows:4,columns:6}]); expect(primeFactors(60)).toEqual([2,2,3,5]); expect(isPrime(23)).toBe(true); expect(isPrime(24)).toBe(false); });
  it('keeps leftovers visible', () => { expect(arrayState(23,5)).toMatchObject({rows:5,columns:4,placed:20,remainder:3,exact:false}); });
  it('computes gcd/lcm and prime exponents', () => { expect(gcd(18,24)).toBe(6); expect(lcm(4,6)).toBe(12); expect(primePowers(18,24)).toEqual([{prime:2,exponentA:1,exponentB:3,gcdExponent:1,lcmExponent:3},{prime:3,exponentA:2,exponentB:1,gcdExponent:1,lcmExponent:2}]); });
  it('builds genuinely different factor trees with the same prime leaves', () => { expect(factorTree(36, 'smallest').left?.value).toBe(2); expect(factorTree(36, 'balanced').left?.value).toBe(6); });
  it('derives divisibility evidence', () => { expect(divisibilityEvidence(126).find(x => x.divisor === 3)?.works).toBe(true); expect(divisibilityEvidence(126).find(x => x.divisor === 5)?.works).toBe(false); });
  it('validates schema and renders every mode', () => { expect(manifest.schema.safeParse({mode:'prime-tree',value:36,splitStrategy:'smallest'}).success).toBe(true); expect(manifest.schema.safeParse({value:999}).success).toBe(false); for (const mode of ['factor-array','prime-tree','gcd','lcm','divisibility'] as const) { const view=render(<Runtime mode={mode} />); expect(view.container.textContent).toContain('Number structure'); view.unmount(); } });
});
