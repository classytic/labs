import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HistogramBoxLab } from '../../../src/statistics/histogram/preset.js';

describe('HistogramBoxLab', () => {
  it('provides a keyboard and mobile path for adding a value and announces the new summary', () => {
    const view = render(<HistogramBoxLab data={[2, 3, 4]} min={0} max={20} />);
    const value = view.getByRole('slider', { name: 'new data value' });
    fireEvent.change(value, { target: { value: '20' } });
    fireEvent.click(view.getByRole('button', { name: 'add value' }));

    expect(view.getByText(/Dataset has 4 values; mean 7\.3, median 3\.5, IQR/i)).toBeTruthy();
    expect(view.getByRole('button', { name: 'right-skewed' }).getAttribute('aria-pressed')).toBe('false');
  });
});
