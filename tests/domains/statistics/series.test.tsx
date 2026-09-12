import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SequenceLab } from '../../../src/statistics/sequence/preset.js';

describe('SequenceLab', () => {
  it('announces recalculated term, partial-sum, and convergence results', () => {
    const view = render(<SequenceLab kind="geometric" first={1} step={0.5} count={4} />);
    expect(
      view.getByText(
        /geometric sequence with 4 terms\. Term 4 is 0\.13; partial sum is 1\.88; infinite sum is 2/i,
      ),
    ).toBeTruthy();

    fireEvent.change(view.getByRole('slider', { name: 'common ratio' }), { target: { value: '1' } });
    expect(view.getByText(/the series does not have a finite infinite sum/i)).toBeTruthy();
  });
});
