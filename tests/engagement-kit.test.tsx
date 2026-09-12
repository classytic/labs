/**
 * Engagement kit — the primitives that make the learning loop the DEFAULT:
 *   PredictGate : lab soft-locked until the learner commits a prediction
 *   Celebrate   : one-shot confetti on the success paths (via ChallengeCard)
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ChallengeCard, PredictGate, useChallenge } from '../dist/kit/index.mjs';
import type { ChallengeQuestion } from '../dist/kit/index.mjs';

const QUESTIONS: ChallengeQuestion[] = [
  {
    id: 'q1',
    prompt: 'What happens?',
    choices: [
      { value: 'up', label: 'Goes up' },
      { value: 'down', label: 'Goes down' },
    ],
    answer: 'up',
  },
];

describe('PredictGate', () => {
  it('locks the lab until the learner commits, then unlocks (right or wrong)', () => {
    const { container, getByText } = render(
      <PredictGate questions={QUESTIONS} activity="test.predict">
        <div data-testid="the-lab">figure</div>
      </PredictGate>,
    );
    const body = container.querySelector('.lab-predict-body') as HTMLElement;
    expect(body.getAttribute('data-locked')).not.toBeNull();
    expect(container.querySelector('.lab-predict-lock')).not.toBeNull();
    expect(container.querySelector('[data-testid="the-lab"]')).toBeNull();
    expect(getByText('Choose an answer above, then explore the model.')).toBeTruthy();

    // Committing a WRONG answer still unlocks: the pedagogy is commit → explore.
    fireEvent.click(getByText('Goes down'));
    expect(body.getAttribute('data-locked')).toBeNull();
    expect(container.querySelector('.lab-predict-lock')).toBeNull();
    expect(container.querySelector('[data-testid="the-lab"]')).not.toBeNull();
  });

  it('fires confetti on a correct pick (celebration wired into ChallengeCard)', () => {
    const { container, getByText } = render(
      <PredictGate questions={QUESTIONS} activity="test.predict">
        <div />
      </PredictGate>,
    );
    expect(container.querySelector('.lab-confetti')).toBeNull();
    fireEvent.click(getByText('Goes up'));
    expect(container.querySelector('.lab-confetti')).not.toBeNull();
    expect(container.querySelector('.lab-pop')).not.toBeNull();
  });

  it('lock=false shows questions without gating', () => {
    const { container } = render(
      <PredictGate questions={QUESTIONS} activity="t" lock={false}>
        <div />
      </PredictGate>,
    );
    expect(container.querySelector('.lab-predict-body')!.getAttribute('data-locked')).toBeNull();
  });
});

function ChallengeHarness(): ReactNode {
  const questions: ChallengeQuestion[] = [
    {
      id: 'cause',
      prompt: 'What caused the change?',
      choices: [
        {
          value: 'cost',
          label: 'Higher cost',
          feedback: 'Cost changes supply, not demand. Look at which curve moved.',
        },
        { value: 'income', label: 'Higher income' },
      ],
      answer: 'income',
      explain: 'Income changes willingness to buy at every price.',
    },
  ];
  const state = useChallenge(questions);
  return <ChallengeCard questions={questions} state={state} />;
}

describe('ChallengeCard feedback', () => {
  it('supports APG arrow-key selection inside a radio group', () => {
    const { getByText } = render(<ChallengeHarness />);
    const first = getByText('Higher cost');
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(getByText('Higher income').getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(getByText('Higher income'));
  });

  it('does not reveal the correct option after a wrong attempt and gives authored coaching', () => {
    const { container, getByText } = render(<ChallengeHarness />);
    fireEvent.click(getByText('Higher cost'));
    expect(getByText('Cost changes supply, not demand. Look at which curve moved.')).toBeTruthy();
    expect(getByText('Higher cost').getAttribute('data-tone')).toBe('wrong');
    expect(getByText('Higher income').getAttribute('data-tone')).toBeNull();
  });

  it('reveals the explanation only after the correct answer', () => {
    const { getByText } = render(<ChallengeHarness />);
    fireEvent.click(getByText('Higher income'));
    expect(getByText(/Income changes willingness/)).toBeTruthy();
    expect(getByText('Higher income').getAttribute('data-tone')).toBe('correct');
  });
});
