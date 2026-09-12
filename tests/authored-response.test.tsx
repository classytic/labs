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
    const left = view.getByText('Left');
    left.focus();
    fireEvent.keyDown(left, { key: 'ArrowRight' });
    expect(onRespond).toHaveBeenCalledWith({ questionId: 'c', response: 'right', correct: true });
    expect(document.activeElement).toBe(view.getByText('Right'));
  });
});
