/**
 * The one thing a printed worked example cannot do.
 *
 * `Derivation` already showed a solution one line at a time. A learner clicking Next until the
 * answer appears is reading a solution, not writing one, so with an `answer` the stepping stops
 * one line short and the final line has to be produced. Everything else a concept-book example
 * carries (the problem, where it came from, the given quantities, a second method) is prose and
 * lives in the MDX around the block.
 */
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Derivation } from '../src/math/derivation.js';

const STEPS = [
  { tex: 'u + v\\cos\\alpha = 0', note: 'zero drift' },
  { tex: '\\cos\\alpha = -\\tfrac{1}{2}' },
  { tex: 't = 4.62' },
];

describe('derivation with a withheld last line', () => {
  it('steps normally and reveals everything when nothing is graded', () => {
    const view = render(<Derivation steps={STEPS} />);
    fireEvent.click(view.getByRole('button', { name: 'Next →' }));
    fireEvent.click(view.getByRole('button', { name: 'Next →' }));
    expect(view.getByText('step 3 / 3')).toBeTruthy();
    expect((view.getByRole('button', { name: 'Next →' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('stops one line short and asks for the last line', () => {
    const view = render(<Derivation steps={STEPS} answer={{ kind: 'number', value: 4.62 }} unit="min" />);
    fireEvent.click(view.getByRole('button', { name: 'Next →' }));
    expect(view.getByText('step 2 / 3')).toBeTruthy();
    // Next is spent: the third line is the learner's to produce.
    expect((view.getByRole('button', { name: 'Next →' }) as HTMLButtonElement).disabled).toBe(true);
    expect(view.getByText('The last line is yours. What does it come to?')).toBeTruthy();

    fireEvent.change(view.getByLabelText('Final line'), { target: { value: '4.62' } });
    fireEvent.click(view.getByRole('button', { name: 'Check' }));
    expect(view.getByText('step 3 / 3')).toBeTruthy();
    expect(view.queryByLabelText('Final line')).toBeNull();
  });

  it('says so when the answer is wrong, and opens a way out after two tries', () => {
    const view = render(<Derivation steps={STEPS} answer={{ kind: 'number', value: 4.62 }} />);
    fireEvent.click(view.getByRole('button', { name: 'Next →' }));
    const input = view.getByLabelText('Final line');
    fireEvent.change(input, { target: { value: '9' } });
    fireEvent.click(view.getByRole('button', { name: 'Check' }));
    expect(view.getByText(/Read the line above again/)).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Show me' })).toBeNull();

    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.click(view.getByRole('button', { name: 'Check' }));
    fireEvent.click(view.getByRole('button', { name: 'Show me' }));
    expect(view.getByText('step 3 / 3')).toBeTruthy();
  });

  it('ignores grading for a print/review render, which is meant to show everything', () => {
    const view = render(<Derivation steps={STEPS} showAll answer={{ kind: 'number', value: 4.62 }} />);
    expect(view.getByText('Complete derivation')).toBeTruthy();
    expect(view.queryByLabelText('Final line')).toBeNull();
  });
});

describe('derivation panel', () => {
  it('does not repeat a line’s reason in the panel below it', () => {
    // The reason belongs beside its line, where it can be compared with the line above. Printing
    // the latest one again at the foot said the same sentence twice and read as new information.
    const view = render(<Derivation steps={[{ tex: 'a = b', note: 'the only reason here' }]} />);
    // The screen-reader live region announces it too, which is correct and invisible; count only
    // what a sighted learner sees.
    const visible = view.getAllByText(/the only reason here/).filter((el) => !el.closest('.lab-sr-only'));
    expect(visible).toHaveLength(1);
    expect(visible[0]!.closest('.lab-activity-feedback')).toBeNull();
    expect(view.getByText(/Compare each line with the one before it/)).toBeTruthy();
  });
});

describe('the runtime adapter, not just the component', () => {
  it('forwards the graded answer, so the last line is withheld in the app too', async () => {
    // This is the seam the unit tests above cannot see. They render <Derivation> directly; the
    // app renders it through this adapter, which once passed only `steps` and `title`. A lesson
    // authoring `answer` had it accepted by the schema, validated by check:props, and then
    // dropped here, so every learner simply read the answer they were meant to produce.
    const { default: DerivationRuntime } = await import('../src/domains/math/derivation/runtime.js');
    const view = render(
      <DerivationRuntime steps={STEPS} answer={{ kind: 'number', value: 4.62 }} unit="min" />,
    );
    fireEvent.click(view.getByRole('button', { name: 'Next →' }));
    expect(view.getByText('step 2 / 3')).toBeTruthy();
    expect(view.getByLabelText('Final line')).toBeTruthy();
  });
});
