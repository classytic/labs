import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ZTableLab } from '../../../src/statistics/z-table/preset.js';

describe('ZTableLab', () => {
  it('labels its parameters and supports one-stop arrow-key table navigation', () => {
    const view = render(<ZTableLab />);

    expect((view.getByRole('spinbutton', { name: 'Raw value x' }) as HTMLInputElement).value).toBe('650');
    expect((view.getByRole('spinbutton', { name: 'Mean mu' }) as HTMLInputElement).value).toBe('500');
    expect(view.getByRole('spinbutton', { name: 'Standard deviation sigma' }).getAttribute('min')).toBe(
      '0.1',
    );

    const selected = view.getByRole('button', {
      name: 'z 1.50, cumulative probability 0.9332',
    });
    expect(selected.getAttribute('tabindex')).toBe('0');

    fireEvent.keyDown(selected, { key: 'ArrowRight' });

    expect((view.getByRole('spinbutton', { name: 'Raw value x' }) as HTMLInputElement).value).toBe('651');
    expect(
      view
        .getByRole('button', {
          name: 'z 1.51, cumulative probability 0.9345',
        })
        .getAttribute('tabindex'),
    ).toBe('0');
    expect(view.getByText(/z score 1\.51; left tail probability 93\.45 percent/i)).toBeTruthy();
  });
});
