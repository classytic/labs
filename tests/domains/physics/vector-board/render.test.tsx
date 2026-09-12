/**
 * Vector-board runtime — the string-serialized-array regression (from src). Array attrs can
 * round-trip from MDX as a JSON STRING; the runtime reads them through `coerceArray`, so a
 * `.map is not a function` throw can't happen. Migrated lab → tested from src, not dist.
 */
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VectorBoardLab from '../../../../src/domains/physics/vector-board/runtime.js';

describe('vector-board runtime (from src)', () => {
  it('renders without throwing when vectors/objectives arrive as JSON strings', () => {
    const attrs = {
      vectors: '[{"id":"a","label":"a","dx":3,"dy":1,"drag":true}]',
      objectives: '["add tip to tail"]',
      combine: 'sum',
    };
    expect(() => renderToStaticMarkup(createElement(VectorBoardLab, attrs))).not.toThrow();
  });
});
