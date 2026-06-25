/**
 * @classytic/labs discrete-math core — the pure, dependency-free kernels the
 * discrete labs compute against (combinatorics, sets, inclusion–exclusion,
 * probability, pigeonhole, seeded RNG). The PROPOSITIONAL-LOGIC kernel lives in
 * @classytic/stage (`compileLogic`/`truthTable`/…) since the scene engine + ICT
 * boolean labs share it; import it from there, re-exported by ../index.ts.
 */

export { factorial, nPr, nCr, binomial, multinomial, starsAndBars, gcd, lcm } from './combinatorics.js';
export { union, intersection, difference, symmetricDifference, complement, isSubset, setEqual, powerset, cartesian, type Elem } from './sets.js';
export { inclusionExclusion, type IETerm, type IEResult } from './inclusionExclusion.js';
export { probability, conditional, bayes, independent, expectedValue, atLeastOne, complement as probComplement } from './probability.js';
export { guaranteedOccupancy, minToGuaranteePair, minForOccupancy } from './pigeonhole.js';
export { mulberry32, randInt, shuffle, sample, type Rng } from './rng.js';
