import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import DerivativeAuthoring from '../../../src/domains/math/derivative-explorer/authoring.js';
import IntegralAuthoring from '../../../src/domains/math/integral-explorer/authoring.js';
import LimitAuthoring from '../../../src/domains/math/limit-explorer/authoring.js';
import derivativeManifest from '../../../src/domains/math/derivative-explorer/manifest.js';
import integralManifest from '../../../src/domains/math/integral-explorer/manifest.js';
import limitManifest from '../../../src/domains/math/limit-explorer/manifest.js';

describe('calculus creator experience', () => {
  it('ships separate lazy authoring entries for the calculus sequence', () => {
    expect(limitManifest.loadAuthoring).toBeTypeOf('function');
    expect(derivativeManifest.loadAuthoring).toBeTypeOf('function');
    expect(integralManifest.loadAuthoring).toBeTypeOf('function');
  });

  it('shows concept-specific controls without exposing engine resolution', () => {
    const noop = vi.fn();
    const limit = render(<LimitAuthoring value={{}} onChange={noop} />);
    expect(limit.getByText('Initial c')).toBeTruthy();
    limit.unmount();
    const derivative = render(<DerivativeAuthoring value={{}} onChange={noop} />);
    expect(derivative.getByText('Initial x')).toBeTruthy();
    derivative.unmount();
    const integral = render(<IntegralAuthoring value={{}} onChange={noop} />);
    expect(integral.getByText('Initial bounds')).toBeTruthy();
    expect(integral.getByText('Rectangles')).toBeTruthy();
    expect(integral.queryByText(/Simpson intervals/i)).toBeNull();
  });

  it('reports invalid graph windows inline and manifests reject them', () => {
    const { getByText } = render(<DerivativeAuthoring value={{ xRange: [4, 1] }} onChange={vi.fn()} />);
    expect(getByText('Maximum must be greater than minimum.')).toBeTruthy();
    expect(derivativeManifest.schema.safeParse({ xRange: [4, 1] }).success).toBe(false);
    expect(integralManifest.schema.safeParse({ n: 500 }).success).toBe(false);
  });

  it('clamps the authored rectangle count before emitting a patch', () => {
    const onChange = vi.fn();
    const { getByDisplayValue } = render(<IntegralAuthoring value={{ n: 8 }} onChange={onChange} />);
    fireEvent.change(getByDisplayValue('8'), { target: { value: '200' } });
    expect(onChange).toHaveBeenLastCalledWith({ n: 80 });
  });
});
