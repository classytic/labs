import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CenterSpreadLab } from '../../../src/statistics/center-spread/preset.js';

describe('CenterSpreadLab', () => {
  it('lets keyboard learners move each data point and hear the recalculated statistics', () => {
    const view = render(<CenterSpreadLab data={[2, 3, 3, 5, 8]} />);
    const first = view.getByRole('slider', { name: 'Data point 1' });

    expect(first.getAttribute('aria-valuenow')).toBe('2');
    fireEvent.keyDown(first, { key: 'ArrowRight' });

    expect(view.getByRole('slider', { name: 'Data point 1' }).getAttribute('aria-valuenow')).toBe('3');
    expect(view.getByText(/Mean 4\.40, median 3, range 5, standard deviation/i)).toBeTruthy();
    expect(view.getByRole('button', { name: '− point' })).toBeTruthy();
  });
});
