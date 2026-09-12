import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BinomialDistributionLab } from '../../../src/discrete/binomial/preset.js';
import { HypergeometricLab } from '../../../src/discrete/hypergeometric/preset.js';
import { ExpectedValueLab } from '../../../src/discrete/expected-value/preset.js';

describe('discrete probability learning surfaces', () => {
  it('accepts both exact binomial modes and exposes keyboard bar inspection', () => {
    const view = render(<BinomialDistributionLab n={3} p={0.5} />);
    expect(view.getByText(/most likely successes 1 and 2/i)).toBeTruthy();

    const bar = view.getByRole('button', { name: /inspect 2 successes/i });
    fireEvent.keyDown(bar, { key: 'Enter' });
    expect(view.getByText(/selected probability P of 2 is 0\.375/i)).toBeTruthy();

    fireEvent.click(view.getByRole('button', { name: 'clear inspection' }));
    fireEvent.click(view.getByRole('button', { name: 'increase most likely k' }));
    fireEvent.click(view.getByRole('button', { name: 'Check' }));
    expect(view.getByText('✓ 1')).toBeTruthy();
  });

  it('announces the finite-population variance comparison', () => {
    const view = render(<HypergeometricLab N={10} K={4} n={3} />);
    expect(
      view.getByText(/With-replacement variance 0\.72; without-replacement variance 0\.56/i),
    ).toBeTruthy();
    fireEvent.keyDown(view.getByRole('button', { name: 'compare probability of exactly 1 winners' }), {
      key: ' ',
    });
    expect(view.getByText(/at 1 winners probabilities are/i)).toBeTruthy();
  });

  it('asks for a fairness prediction before deterministic simulation', () => {
    const view = render(<ExpectedValueLab />);
    fireEvent.click(view.getByRole('radio', { name: 'no, the house has an edge' }));
    fireEvent.click(view.getByRole('button', { name: 'Simulate 50 plays' }));

    expect(
      view
        .getAllByRole('status')
        .some((status) =>
          /Correct\. The normalized expected payout is 3\.75/i.test(status.textContent ?? ''),
        ),
    ).toBe(true);
    expect(view.getByText(/After 50 plays, the running average is/i)).toBeTruthy();
    expect(view.getByRole('button', { name: 'reset game' })).toBeTruthy();
  });
});
