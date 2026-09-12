/**
 * Block attribute coercion — array attrs can round-trip from MDX as a JSON STRING
 * (blocks without a `fromAttrs` parser). A bare `attr ?? []` then slips the string
 * through and `.map` throws ("(vectors ?? []).map is not a function"). Blocks must
 * read array attrs through `coerceArray`. Regression: VectorBoard with string vectors.
 */

import { describe, it, expect } from 'vitest';
import { coerceArray } from '../dist/blocks/index.mjs';

// The VectorBoard string-attr regression moved with the lab to
// tests/domains/physics/vector-board/render.test.tsx (migrated → tested from src).
describe('coerceArray', () => {
  it('passes arrays, parses JSON-string arrays, falls back otherwise', () => {
    expect(coerceArray([1, 2], [])).toEqual([1, 2]);
    expect(coerceArray('[{"a":1}]', [])).toEqual([{ a: 1 }]);
    expect(coerceArray('not json', ['x'])).toEqual(['x']);
    expect(coerceArray(undefined, ['d'])).toEqual(['d']);
    expect(coerceArray('{"not":"array"}', [])).toEqual([]);
  });
});
