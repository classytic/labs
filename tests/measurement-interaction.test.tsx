import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MeasurementLab } from '../src/math/measurement/preset.js';

afterEach(cleanup);

describe('measurement scene-first interaction', () => {
  it('keeps scene handles keyboard operable and calculations synchronized', () => {
    const result = render(<MeasurementLab mode="walking-path" length={12} width={8} pathWidth={1} />);

    expect(result.container.textContent).toContain('44.00 m²');
    const lengthHandle = result.getByRole('slider', { name: 'Pond length' });
    expect(lengthHandle.getAttribute('aria-valuenow')).toBe('12');

    fireEvent.keyDown(lengthHandle, { key: 'ArrowRight' });

    expect(result.getByRole('slider', { name: 'Pond length' }).getAttribute('aria-valuenow')).toBe('13');
    expect(result.container.textContent).toContain('46.00 m²');
  });

  it('renders author-provided dimensions in the model and evidence', () => {
    const result = render(<MeasurementLab mode="walking-path" length={10} width={6} pathWidth={2} />);

    expect(result.getByText('pond 10 m × 6 m')).toBeTruthy();
    expect(result.container.textContent).toContain('80.00 m²');
  });
});
