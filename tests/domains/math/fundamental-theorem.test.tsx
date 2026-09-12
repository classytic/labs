import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import manifest from '../../../src/domains/math/fundamental-theorem/manifest.js';
import Runtime from '../../../src/domains/math/fundamental-theorem/runtime.js';
import Authoring from '../../../src/domains/math/fundamental-theorem/authoring.js';

describe('Fundamental Theorem lab', () => {
  it('publishes a real authorable manifest with calculus prerequisites', () => {
    expect(manifest.id).toBe('fundamental-theorem');
    expect(manifest.loadAuthoring).toBeTypeOf('function');
    expect(manifest.taxonomy.prerequisites).toEqual(['derivative-explorer', 'integral-explorer']);
    expect(
      manifest.schema.safeParse({ equation: 'sin(x)', xRange: [-3, 3], anchor: 0, startX: 1 }).success,
    ).toBe(true);
  });

  it('renders linked function and accumulation graphs', () => {
    const { container, getByText } = render(<div>{Runtime({ equation: 'x^2', anchor: 0, startX: 2 })}</div>);
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(2);
    expect(getByText('A′(x) = f(x)')).toBeTruthy();
    expect(container.textContent).toMatch(/The rates agree/);
  });

  it('offers a focused creator form instead of numerical tuning knobs', () => {
    const { getByText, queryByText } = render(<Authoring value={{}} onChange={vi.fn()} />);
    expect(getByText('Function f(x)')).toBeTruthy();
    expect(getByText('Area starts at')).toBeTruthy();
    expect(queryByText(/intervals/i)).toBeNull();
  });
});
