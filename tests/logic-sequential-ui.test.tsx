import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SequentialLogicLab } from '../src/logic/SequentialLogicLab.js';

afterEach(cleanup);

describe('SequentialLogicLab', () => {
  it('advances a counter exactly once per clock pulse and resets it', () => {
    render(<SequentialLogicLab preset="counter" />);
    expect(screen.getByText('0 · 0000')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pulse clock' }));
    expect(screen.getByText('1 · 0001')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reset simulation' }));
    expect(screen.getByText('0 · 0000')).toBeTruthy();
  });

  it('retains an SR latch value after set is released', () => {
    render(<SequentialLogicLab preset="sr-latch" />);
    fireEvent.click(screen.getByRole('button', { name: /Set/ }));
    expect(screen.getByText('Inputs update this latch immediately')).toBeTruthy();
    expect(screen.getByText('Q').parentElement?.textContent).toContain('1');
    fireEvent.click(screen.getByRole('button', { name: /Set/ }));
    expect(screen.getByText('Q').parentElement?.textContent).toContain('1');
  });

  it('decodes finite-state-machine states into named outputs', () => {
    render(<SequentialLogicLab preset="traffic-light" />);
    expect(screen.getByText('red')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pulse clock' }));
    expect(screen.getByText('red-amber')).toBeTruthy();
  });
});
