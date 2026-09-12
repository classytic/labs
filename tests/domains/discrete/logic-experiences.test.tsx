import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TruthTableLab } from '../../../src/discrete/truth-table/preset.js';
import { KarnaughMapLab } from '../../../src/discrete/karnaugh/preset.js';
import truthTableManifest from '../../../src/domains/discrete/truth-table/manifest.js';
import karnaughManifest from '../../../src/domains/discrete/karnaugh/manifest.js';

describe('logic learning experiences', () => {
  it('requires a complete truth column before grading and transfers classification', () => {
    render(<TruthTableLab formula="p -> q" mode="fill" />);
    const check = screen.getByRole('button', { name: 'Check' }) as HTMLButtonElement;
    expect(check.disabled).toBe(true);
    const cells = [1, 2, 3, 4].map((row) => screen.getByRole('button', { name: `row ${row} output` }));
    fireEvent.click(cells[0]!);
    fireEvent.click(cells[1]!);
    fireEvent.click(cells[2]!);
    fireEvent.click(cells[2]!);
    fireEvent.click(cells[3]!);
    expect(check.disabled).toBe(false);
    fireEvent.click(check);
    expect(screen.getByText(/all correct/i)).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'contingency' }));
    expect(screen.getByText(/true for some assignments/i)).not.toBeNull();
  });

  it('builds a K-map group with command buttons and explains power-of-two grouping', () => {
    render(<KarnaughMapLab minterms={[0]} vars={['a', 'b']} mode="simplify" />);
    const add = screen.getByRole('button', { name: 'Add group' }) as HTMLButtonElement;
    expect(add.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /minterm 0, value 1/i }));
    expect(add.disabled).toBe(false);
    fireEvent.click(add);
    expect(screen.getByText(/all 1 one-cells are covered/i)).not.toBeNull();
    fireEvent.click(
      screen.getByRole('radio', { name: /each doubling lets one changing variable disappear/i }),
    );
    expect(screen.getByText(/cancel from the product term/i)).not.toBeNull();
  });

  it('ships a meaningful interactive Karnaugh default', () => {
    render(<KarnaughMapLab />);
    expect(screen.getByRole('grid', { name: /Karnaugh map, 2 variables.*3 ones/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Add group' })).not.toBeNull();
  });

  it('rejects unsafe or conflicting authored Boolean configurations', () => {
    expect(truthTableManifest.schema.safeParse({ formula: '' }).success).toBe(false);
    expect(truthTableManifest.schema.safeParse({ formula: 'p'.repeat(161) }).success).toBe(false);
    expect(karnaughManifest.schema.safeParse({ formula: 'a', minterms: [0], vars: ['a', 'b'] }).success).toBe(
      false,
    );
    expect(karnaughManifest.schema.safeParse({ minterms: [0, 0], vars: ['a', 'b'] }).success).toBe(false);
    expect(karnaughManifest.schema.safeParse({ minterms: [4], vars: ['a', 'b'] }).success).toBe(false);
    expect(
      karnaughManifest.schema.safeParse({ minterms: [1], dontCares: [1], vars: ['a', 'b'] }).success,
    ).toBe(false);
  });
});
