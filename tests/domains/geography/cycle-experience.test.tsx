import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CycleLab } from '../../../src/geography/cycle-lab/preset.js';
import { CARBON_CYCLE, ROCK_CYCLE } from '../../../src/geography/cycles.js';
import cycleManifest from '../../../src/domains/geography/cycle/manifest.js';

describe('geography cycle experience', () => {
  it('keeps repeated process labels independently available', () => {
    render(<CycleLab nodes={CARBON_CYCLE.nodes} edges={CARBON_CYCLE.edges} challenge="label-process" />);
    expect(screen.getAllByRole('button', { name: 'respiration' })).toHaveLength(2);

    const slots = screen.getAllByRole('button', { name: /empty process slot/i });
    fireEvent.click(screen.getAllByRole('button', { name: 'respiration' })[0]!);
    fireEvent.click(slots[4]!);
    expect(screen.getAllByRole('button', { name: 'respiration' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'respiration' }));
    fireEvent.click(slots[5]!);
    expect(screen.queryByRole('button', { name: 'respiration' })).toBeNull();
  });

  it('supports keyboard tracing and requires transfer reasoning', () => {
    render(<CycleLab nodes={ROCK_CYCLE.nodes} edges={ROCK_CYCLE.edges} challenge="trace" />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Magma' }), { key: 'Enter' });
    expect(screen.getByText('1/5 stages traced')).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'cooling' }));
    expect(screen.getByText(/directed system/i)).not.toBeNull();
  });

  it('rejects unsafe or structurally invalid authored cycles', () => {
    expect(cycleManifest.schema.safeParse({ preset: 'custom' }).success).toBe(false);
    expect(
      cycleManifest.schema.safeParse({
        preset: 'custom',
        nodes: [
          { id: 'a', label: 'A' },
          { id: 'a', label: 'B' },
        ],
        edges: [{ from: 'a', to: 'missing', label: 'move' }],
      }).success,
    ).toBe(false);
    expect(
      cycleManifest.schema.safeParse({
        preset: 'custom',
        nodes: [
          { id: 'a', label: 'A', tone: 'red; position:fixed' },
          { id: 'b', label: 'B' },
        ],
        edges: [{ from: 'a', to: 'b', label: 'move' }],
      }).success,
    ).toBe(false);
    expect(
      cycleManifest.schema.safeParse({
        preset: 'custom',
        challenge: 'label-process',
        nodes: [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ],
        edges: [{ from: 'a', to: 'b' }],
      }).success,
    ).toBe(false);
  });
});
