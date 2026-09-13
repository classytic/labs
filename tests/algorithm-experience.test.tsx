import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GraphAlgorithmLab } from '../src/algorithms/GraphAlgorithmLab.js';
import { GridPathLab } from '../src/algorithms/GridPathLab.js';
import { TreeQuestLab } from '../src/algorithms/TreeQuestLab.js';
import { HeapQuestLab } from '../src/algorithms/HeapQuestLab.js';
import { SortingLab } from '../src/algorithms/SortingLab.js';

describe('algorithm learning experience', () => {
  it('pauses Dijkstra at a meaningful frontier choice', () => {
    render(<GraphAlgorithmLab algorithm="dijkstra" />);
    const next = screen.getByRole('button', { name: 'Next step' });

    for (let index = 0; index < 12 && !screen.queryByLabelText('Predict the next node'); index++) {
      fireEvent.click(next);
    }

    expect(screen.getByLabelText('Predict the next node')).toBeTruthy();
    expect((next as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: /C · 2/ }));
    expect(screen.getByText(/Correct—C is selected next/)).toBeTruthy();
    expect((next as HTMLButtonElement).disabled).toBe(false);
  });

  it('frames the DP table as a route mission and explains reused state', () => {
    render(<GridPathLab rows={2} cols={2} />);
    expect(screen.getByText('Start')).toBeTruthy();
    expect(screen.getByText('Goal')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next step' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect((screen.getByRole('button', { name: 'Next step' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText(/two already-solved subproblems/i)).toBeTruthy();
  });

  it('transfers the DP recurrence when legal moves change', () => {
    render(<GridPathLab rows={2} cols={2} />);
    const next = screen.getByRole('button', { name: 'Next step' });
    fireEvent.click(next);
    fireEvent.click(next);
    fireEvent.click(screen.getByRole('radio', { name: '2' }));
    fireEvent.click(next);
    expect(screen.getByText('Transfer')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    expect(screen.getByText(/allowed transitions determine/)).toBeTruthy();
  });

  it('ends a trace with a concise transfer question', () => {
    render(
      <GraphAlgorithmLab
        algorithm="bfs"
        graph={{
          nodes: [
            { id: 'A', x: 20, y: 50 },
            { id: 'B', x: 80, y: 50 },
          ],
          edges: [{ id: 'ab', from: 'A', to: 'B' }],
        }}
        source="A"
        target="B"
      />,
    );

    const next = screen.getByRole('button', { name: 'Next step' });
    for (let index = 0; index < 12 && !screen.queryByText('Transfer'); index++) fireEvent.click(next);

    expect(screen.getByText('Transfer')).toBeTruthy();
    expect(screen.getByText(/neighbour order changes/)).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    expect(screen.getByText(/traversal order depends on neighbour order/)).toBeTruthy();
  });

  it('gives tree traces concise event interpretation in the shared feedback slot', () => {
    const { container } = render(<TreeQuestLab operation="avl-insert" values={[30, 10]} target={20} />);
    expect(container.querySelector('.lab-activity-feedback')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Next step' })).toBeTruthy();
  });

  it('ends a tree trace by transferring the invariant', () => {
    render(<TreeQuestLab operation="search" values={[8, 3, 10]} target={10} predict={false} />);
    const next = screen.getByRole('button', { name: 'Next step' });
    for (let index = 0; index < 16 && !screen.queryByText('Transfer'); index++) fireEvent.click(next);
    expect(screen.getByText('Transfer')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    expect(screen.getByText(/sorted insertion sequence can create a chain/)).toBeTruthy();
  });

  it('distinguishes heap order from full sorting after the trace', () => {
    render(<HeapQuestLab values={[3, 1, 2]} kind="min" operation="build" predict={false} />);
    const next = screen.getByRole('button', { name: 'Next step' });
    for (let index = 0; index < 20 && !screen.queryByText('Transfer'); index++) fireEvent.click(next);
    expect(screen.getByText('Transfer')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'No' }));
    expect(screen.getByText(/parent–child priority, not global sorted order/)).toBeTruthy();
  });

  it('supports keyboard trace navigation while focus stays inside the activity', () => {
    render(<SortingLab values={[2, 1]} predict={false} showCosts={false} />);
    const next = screen.getByRole('button', { name: 'Next step' });
    next.focus();

    fireEvent.keyDown(window, { key: 'ArrowRight' });

    expect(screen.getByText('2/4')).toBeTruthy();
  });
});
