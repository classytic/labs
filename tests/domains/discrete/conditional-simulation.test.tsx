import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BayesLab } from '../../../src/discrete/bayes/preset.js';
import { LawOfLargeNumbersLab } from '../../../src/discrete/lln/preset.js';
import { MontyHallLab } from '../../../src/discrete/monty-hall/preset.js';
import { MonteCarloLab } from '../../../src/discrete/monte-carlo/preset.js';
import bayesManifest from '../../../src/domains/discrete/bayes/manifest.js';
import montyManifest from '../../../src/domains/discrete/monty-hall/manifest.js';
import monteCarloManifest from '../../../src/domains/discrete/monte-carlo/manifest.js';

describe('conditional probability and simulation experiences', () => {
  it('keeps Bayes prediction gated and announces the walkthrough', () => {
    render(<BayesLab predict />);
    const next = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(next);
    fireEvent.click(next);
    fireEvent.click(next);
    expect(screen.getByRole('radio', { name: /only a small fraction/i })).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /only a small fraction/i }));
    expect(screen.getByText(/base-rate neglect/i)).not.toBeNull();
    expect(screen.getByText(/walkthrough step 4 of 4/i)).not.toBeNull();
  });

  it('gives the LLN scene an explicit transport and a transfer check', () => {
    render(<LawOfLargeNumbersLab />);
    const run = screen.getByRole('button', { name: /run experiment/i });
    expect(run.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(run);
    expect(run.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: /first few draws/i }));
    fireEvent.click(screen.getByRole('radio', { name: /tends toward the true probability/i }));
    expect(screen.getAllByText(/correct/i)).toHaveLength(2);
  });

  it('makes Monty Hall prediction and evidence distinct', () => {
    render(<MontyHallLab />);
    fireEvent.click(screen.getByRole('radio', { name: /switch doors/i }));
    expect(screen.getByText(/first pick is wrong two-thirds/i)).not.toBeNull();
    expect(screen.getByText(/switch wins 0 of 0; stay wins 0 of 0/i)).not.toBeNull();
    expect((screen.getByRole('button', { name: /run 100/i }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('rejects invalid authored probability inputs', () => {
    expect(
      bayesManifest.schema.safeParse({ prior: 0, sensitivity: 0.9, falsePositive: 0.1, population: 1000 })
        .success,
    ).toBe(false);
    expect(montyManifest.schema.safeParse({ doors: 2 }).success).toBe(false);
  });

  it('renders a useful Monte Carlo default with accessible evidence and stepping', () => {
    render(<MonteCarloLab />);
    expect(screen.getByText('π estimate estimate')).not.toBeNull();
    expect(screen.getByText('theoretical target')).not.toBeNull();
    expect(screen.getByText('absolute error')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /run one trial/i }));
    expect(screen.getByText('1', { selector: '.lab-stat-val' })).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /settles closer/i }));
    fireEvent.click(screen.getByRole('radio', { name: /sampled square has four/i }));
    expect(screen.getAllByText(/correct/i)).toHaveLength(2);
  });

  it('validates every authored Monte Carlo experiment shape', () => {
    for (const experiment of [
      { kind: 'piDarts' as const },
      { kind: 'montyHall' as const, doors: 4 },
      { kind: 'diceSum' as const, dice: 2, target: 7 },
      { kind: 'bernoulli' as const, p: 0.35, label: 'conversion' },
    ])
      expect(monteCarloManifest.schema.safeParse({ experiment }).success).toBe(true);
    expect(
      monteCarloManifest.schema.safeParse({ experiment: { kind: 'diceSum', dice: 2, target: 13 } }).success,
    ).toBe(false);
    expect(monteCarloManifest.schema.safeParse({ experiment: { kind: 'bernoulli', p: 1.1 } }).success).toBe(
      false,
    );
  });
});
