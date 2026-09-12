import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RelativityLightClockLab } from '../src/physics/modern/relativity/preset.js';
import { RelativitySimultaneityLab } from '../src/physics/modern/relativity/simultaneity-preset.js';

describe('relativity learning progression', () => {
  it('turns Continue into a visible light-clock progression', () => {
    const view = render(<RelativityLightClockLab />);
    expect(view.getByText('Predict before the pulse leaves')).toBeTruthy();
    fireEvent.click(view.getByRole('radio', { name: 'The ship clock' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByText('Trace one complete tick')).toBeTruthy();
    expect(view.getByLabelText('light clock event progress')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByText('Link path and clocks')).toBeTruthy();
    expect(view.getByLabelText('Spacetime evidence')).toBeTruthy();
  });

  it('reveals frame evidence only after the simultaneity prediction', () => {
    const view = render(<RelativitySimultaneityLab />);
    expect(view.queryByText('train Δt′ (front − rear)')).toBeNull();
    fireEvent.click(view.getByRole('radio', { name: 'the right/front flash' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByLabelText('train velocity as a fraction of light speed')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByText('train Δt′ (front − rear)')).toBeTruthy();
  });
});
