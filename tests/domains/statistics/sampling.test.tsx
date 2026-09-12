import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SamplingDistributionLab } from '../../../src/statistics/sampling/preset.js';

describe('Sampling distribution learning surface', () => {
  it('supports a deterministic manual sample step', () => {
    const view = render(<SamplingDistributionLab mode="ci" />);

    expect(view.getByText('0 intervals')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Draw one sample' }));

    expect(view.getByText('1 intervals')).toBeTruthy();
    expect(view.getByText(/coverage:/)).toBeTruthy();
  });
});
