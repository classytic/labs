/**
 * Block attribute coercion — array attrs can round-trip from MDX as a JSON STRING
 * (blocks without a `fromAttrs` parser). A bare `attr ?? []` then slips the string
 * through and `.map` throws ("(vectors ?? []).map is not a function"). Blocks must
 * read array attrs through `coerceArray`. Regression: VectorBoard with string vectors.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { coerceArray } from '../dist/blocks/index.mjs';
import { VectorBoardBlock } from '../dist/blocks/physics.mjs';

describe('coerceArray', () => {
  it('passes arrays, parses JSON-string arrays, falls back otherwise', () => {
    expect(coerceArray([1, 2], [])).toEqual([1, 2]);
    expect(coerceArray('[{"a":1}]', [])).toEqual([{ a: 1 }]);
    expect(coerceArray('not json', ['x'])).toEqual(['x']);
    expect(coerceArray(undefined, ['d'])).toEqual(['d']);
    expect(coerceArray('{"not":"array"}', [])).toEqual([]);
  });
});

describe('VectorBoard block tolerates string-serialized array attrs', () => {
  it('renders without throwing when vectors/objectives arrive as JSON strings', () => {
    const attributes = {
      vectors: '[{"id":"a","label":"a","dx":3,"dy":1,"drag":true}]',
      objectives: '["add tip to tail"]',
      combine: 'sum',
    };
    expect(() => render(<div>{VectorBoardBlock.Component({ attributes, mode: 'preview' })}</div>)).not.toThrow();
  });
});
