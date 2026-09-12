import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NormalDistributionLab } from '../../../src/statistics/normal/preset.js';

describe('Normal distribution learning surface', () => {
  it('lets keyboard learners adjust both interval bounds and announces the result', () => {
    const view = render(<NormalDistributionLab a={-1} b={1} />);
    const lower = view.getByRole('slider', { name: 'lower bound' });
    const upper = view.getByRole('slider', { name: 'upper bound' });

    expect(lower.getAttribute('aria-valuetext')).toContain('z score -1.00');
    expect(upper.getAttribute('aria-valuetext')).toContain('z score 1.00');
    fireEvent.keyDown(lower, { key: 'ArrowRight' });

    expect(view.getByRole('slider', { name: 'lower bound' }).getAttribute('aria-valuenow')).toBe('-0.9');
    expect(view.getByText(/The interval from -0.9 to 1.0 contains/)).toBeTruthy();
  });
});
