import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { AuthoredResponse, evaluateAuthoredResponse } from '../src/kit/authored-response.js';

describe('portable authored responses', () => {
  it('evaluates numeric tolerance, accepted text, ordering, and reflection', () => {
    expect(
      evaluateAuthoredResponse({ kind: 'numeric', id: 'n', prompt: 'n?', answer: 10, tolerance: 0.2 }, 10.1),
    ).toBe(true);
    expect(
      evaluateAuthoredResponse(
        { kind: 'text', id: 't', prompt: 'layer?', answers: ['Transport'] },
        ' transport ',
      ),
    ).toBe(true);
    expect(
      evaluateAuthoredResponse(
        {
          kind: 'ordering',
          id: 'o',
          prompt: 'route?',
          items: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
          answer: ['a', 'b'],
        },
        ['a', 'b'],
      ),
    ).toBe(true);
    expect(
      evaluateAuthoredResponse({ kind: 'reflection', id: 'r', prompt: 'why?', rubric: ['Evidence'] }, '   '),
    ).toBe(false);
    expect(
      evaluateAuthoredResponse(
        { kind: 'reflection', id: 'r', prompt: 'why?', rubric: ['Evidence'] },
        'because',
      ),
    ).toBeNull();
  });

  it('does not submit an empty reflection as completed work', () => {
    const onRespond = vi.fn();
    const view = render(
      <AuthoredResponse
        question={{
          kind: 'reflection',
          id: 'r',
          prompt: 'What evidence changed?',
          rubric: ['Names the evidence'],
        }}
        onRespond={onRespond}
      />,
    );
    fireEvent.click(view.getByText('Save response'));
    expect(onRespond).not.toHaveBeenCalled();
    expect(view.getByLabelText('What evidence changed?').hasAttribute('required')).toBe(true);
  });

  it('renders and reports a numeric response consistently', () => {
    const onRespond = vi.fn();
    const view = render(
      <AuthoredResponse
        question={{
          kind: 'numeric',
          id: 'n',
          prompt: 'Final speed?',
          answer: 12,
          tolerance: 0.1,
          unit: 'm/s',
        }}
        onRespond={onRespond}
      />,
    );
    fireEvent.change(view.getByLabelText('Final speed?'), { target: { value: '12.05' } });
    fireEvent.click(view.getByText('Check'));
    expect(onRespond).toHaveBeenCalledWith({ questionId: 'n', response: 12.05, correct: true });
    expect(view.getByRole('status').textContent).toContain('Correct');
  });

  // The whole reason a lab beats an explainer: it can name the thinking behind the answer the
  // learner actually gave. `AuthoredChoice.feedback` existed in the type from the start and the
  // runtime never read it, so every wrong answer got one generic sentence the learner already
  // knew. Two distractors, two different sentences, is the contract.
  it('answers the distractor the learner picked, not "not yet"', () => {
    const question = {
      id: 'atwood',
      prompt: 'What sets the acceleration?',
      choices: [
        { value: 'total', label: 'The total mass', feedback: 'The total mass RESISTS the motion.' },
        { value: 'heavier', label: 'The heavier mass alone', feedback: 'The lighter one pulls back too.' },
        { value: 'difference', label: 'The difference in mass' },
      ],
      answer: 'difference',
      tryAgain: 'Not yet. Revisit the evidence and try again.',
    };
    // Unmounted between picks: render() appends to the same body, so a second copy would make
    // every query ambiguous.
    const pick = (label: string): string => {
      const view = render(<AuthoredResponse question={question} />);
      fireEvent.click(view.getByRole('radio', { name: label }));
      const said = view.getByRole('status').textContent ?? '';
      view.unmount();
      return said;
    };
    expect(pick('The total mass')).toContain('RESISTS');
    expect(pick('The heavier mass alone')).toContain('lighter one pulls back');
    // A distractor with nothing authored still falls back, so the field stays optional.
    expect(pick('The difference in mass')).not.toContain('RESISTS');
  });

  it('gives choice groups one keyboard tab stop and arrow navigation', () => {
    const onRespond = vi.fn();
    const view = render(
      <AuthoredResponse
        question={{
          id: 'c',
          prompt: 'Direction?',
          choices: [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ],
          answer: 'right',
        }}
        onRespond={onRespond}
      />,
    );
    const left = view.getByRole('radio', { name: 'Left' });
    left.focus();
    fireEvent.keyDown(left, { key: 'ArrowRight' });
    expect(onRespond).toHaveBeenCalledWith({ questionId: 'c', response: 'right', correct: true });
    expect(document.activeElement).toBe(view.getByRole('radio', { name: 'Right' }));
  });
});
