import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SampleSpaceBoardLab } from '../../../src/discrete/sample-space/preset.js';
import { CountingTreeLab } from '../../../src/discrete/counting-tree/preset.js';
import { CombinationStudioLab } from '../../../src/discrete/combination-studio/preset.js';
import sampleSpaceManifest from '../../../src/domains/discrete/sample-space/manifest.js';
import countingTreeManifest from '../../../src/domains/discrete/counting-tree/manifest.js';
import combinationStudioManifest from '../../../src/domains/discrete/combination-studio/manifest.js';
import { ArrangementsLab } from '../../../src/discrete/arrangements/preset.js';
import { SelectionLab } from '../../../src/discrete/selection/preset.js';
import arrangementsManifest from '../../../src/domains/discrete/arrangements/manifest.js';
import selectionManifest from '../../../src/domains/discrete/selection/manifest.js';
import { CountingSlotsLab } from '../../../src/discrete/counting-slots/preset.js';
import { OutcomeBuilderLab } from '../../../src/discrete/outcome-builder/preset.js';
import countingSlotsManifest from '../../../src/domains/discrete/counting-slots/manifest.js';
import outcomeBuilderManifest from '../../../src/domains/discrete/outcome-builder/manifest.js';

describe('counting and sample-space experiences', () => {
  it('pairs a sample-space selection with an explicit probability explanation', () => {
    render(
      <SampleSpaceBoardLab dims={[2, 2]} event={{ reduce: 'sum', cmp: 'eq', value: 3 }} mode="target" />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'outcome 1,2' }));
    fireEvent.click(screen.getByRole('button', { name: 'outcome 2,1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText(/2 of 4 outcomes selected; probability 1\/2/i)).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /favourable outcomes ÷ total outcomes/i }));
    expect(screen.getByText(/every cell is equally likely/i)).not.toBeNull();
  });

  it('ships a useful counting-tree default and requires path tracing', () => {
    render(<CountingTreeLab />);
    expect(screen.getByRole('group', { name: /counting tree with 4 paths/i })).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'A1' }));
    expect(screen.getByText(/path 1 of 4/i)).not.toBeNull();
    expect(screen.getByText(/selected path A1/i)).not.toBeNull();
  });

  it('uses command buttons for combination workflow and announces progress', () => {
    render(<CombinationStudioLab />);
    expect(screen.getByRole('button', { name: 'Add a variable' }).getAttribute('aria-pressed')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /make this one/i }));
    expect(screen.getByText(/1 of 6 combinations discovered/i)).not.toBeNull();
    expect((screen.getByRole('button', { name: /already made/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('rejects incoherent authored configurations', () => {
    expect(sampleSpaceManifest.schema.safeParse({ dims: [2, 2], outcomes: ['H', 'T'] }).success).toBe(false);
    expect(sampleSpaceManifest.schema.safeParse({ dims: [2], faces: [[1, 2, 3]] }).success).toBe(false);
    expect(countingTreeManifest.schema.safeParse({ pool: ['A', 'B'], draws: 3 }).success).toBe(false);
    expect(
      countingTreeManifest.schema.safeParse({ stages: [{ branches: [{ label: 'only' }] }] }).success,
    ).toBe(false);
    expect(
      combinationStudioManifest.schema.safeParse({
        categories: [{ id: 'colour', label: 'Colour', options: [] }],
      }).success,
    ).toBe(false);
  });

  it('keeps the repeated-arrangement result hidden until a direct numeric commitment', () => {
    render(<ArrangementsLab word="AAB" />);
    expect(screen.getByText('Commit an estimate')).not.toBeNull();
    fireEvent.change(screen.getByLabelText(/how many distinct rows/i), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText(/correct: 3 distinct arrangements/i)).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /swapping identical copies/i }));
    expect(screen.getByText(/actually indistinguishable/i)).not.toBeNull();
  });

  it('makes grouped selection prediction precede computed evidence and resets authored state', () => {
    render(<SelectionLab />);
    expect(screen.getByText('Commit an estimate')).not.toBeNull();
    fireEvent.change(screen.getByLabelText(/how many of the 120 possible draws match/i), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText(/correct: 30 favourable selections/i)).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /increase total draw size/i }));
    expect(screen.getByText(/must total exactly 4/i)).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText(/how many of the 120 possible draws match/i)).not.toBeNull();
  });

  it('rejects unsafe or mismatched arrangement and selection authoring', () => {
    expect(
      arrangementsManifest.schema.safeParse({ word: 'AAB', items: [{ label: 'A', count: 2 }] }).success,
    ).toBe(false);
    expect(
      arrangementsManifest.schema.safeParse({
        items: [
          { label: 'A', count: 8 },
          { label: 'B', count: 8 },
          { label: 'C', count: 8 },
        ],
      }).success,
    ).toBe(false);
    expect(selectionManifest.schema.safeParse({ want: [2, 1] }).success).toBe(false);
    expect(
      selectionManifest.schema.safeParse({
        groups: [
          { label: 'red', count: 5 },
          { label: 'blue', count: 3 },
        ],
        draw: 3,
        want: [3, 1],
      }).success,
    ).toBe(false);
  });

  it('requires a counting estimate before slot evidence is revealed', () => {
    render(<CountingSlotsLab />);
    expect(screen.getByText('Commit an estimate')).not.toBeNull();
    expect((screen.getByRole('button', { name: 'Fill next slot' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/how many ways are possible/i), { target: { value: '24' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText(/correct: 24 ways/i)).not.toBeNull();
    expect((screen.getByRole('button', { name: 'Fill next slot' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fill next slot' }));
    expect(screen.getByText(/1 of 3 slots are filled/i)).not.toBeNull();
  });

  it('uses accessible sample-space outcomes and transfer reasoning', () => {
    render(<OutcomeBuilderLab stages={['coin', 'coin']} />);
    fireEvent.click(screen.getByRole('button', { name: 'outcome H, H' }));
    expect(screen.getByText(/1 of 4 outcomes selected/i)).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /multiplied by 6/i }));
    expect(screen.getByText(/branches into six new outcomes/i)).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Add coin' }).getAttribute('aria-pressed')).toBeNull();
  });

  it('rejects incoherent slot and sample-space authoring', () => {
    expect(countingSlotsManifest.schema.safeParse({ items: ['A', 'A'], slots: 1 }).success).toBe(false);
    expect(countingSlotsManifest.schema.safeParse({ items: ['A', 'B'], slots: 3 }).success).toBe(false);
    expect(countingSlotsManifest.schema.safeParse({ mode: 'choose', replacement: true }).success).toBe(false);
    expect(countingSlotsManifest.schema.safeParse({ slots: 3, positions: ['first'] }).success).toBe(false);
    expect(outcomeBuilderManifest.schema.safeParse({ stages: [] }).success).toBe(false);
    expect(outcomeBuilderManifest.schema.safeParse({ maxOutcomes: 3 }).success).toBe(false);
  });
});
