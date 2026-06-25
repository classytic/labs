/**
 * Challenge scaffold — the shared predict/classify/explain activity (kit/pedagogy).
 * Verified through the reference lab (ReactionProfile): a correct pick reveals the
 * "why" and flags the choice; a wrong pick is marked and the right answer shown.
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent, within } from '@testing-library/react';
import { ReactionProfile } from '../dist/chem/index.mjs';

/** The choice button (scoped to the challenge card — "exothermic" also appears in the aside). */
const choice = (card: HTMLElement, text: string): HTMLElement =>
  within(card).getAllByText(text).map((n) => n.closest('.lab-choice')).find(Boolean) as HTMLElement;

describe('ChallengeCard predict/classify', () => {
  it('renders the challenge with choices and no feedback until answered', () => {
    const { container } = render(<ReactionProfile />);
    const card = container.querySelector('.lab-challenge') as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.querySelectorAll('.lab-choice').length).toBe(5); // 2 + 3 choices
    expect(card.querySelector('.lab-pill')).toBeNull(); // no feedback before a pick
  });

  it('a correct pick marks the choice and reveals the explanation', () => {
    const { container } = render(<ReactionProfile />);
    const card = container.querySelector('.lab-challenge') as HTMLElement;
    fireEvent.click(choice(card, 'exothermic'));
    expect(choice(card, 'exothermic').getAttribute('data-tone')).toBe('correct');
    const q = choice(card, 'exothermic').closest('.lab-challenge-q') as HTMLElement;
    expect(within(q).getByText(/Energy is released/)).toBeTruthy();
  });

  it('a wrong pick is flagged and the correct answer is still highlighted', () => {
    const { container } = render(<ReactionProfile />);
    const card = container.querySelector('.lab-challenge') as HTMLElement;
    fireEvent.click(choice(card, 'endothermic'));
    expect(choice(card, 'endothermic').getAttribute('data-tone')).toBe('wrong');
    expect(choice(card, 'exothermic').getAttribute('data-tone')).toBe('correct');
    const q = choice(card, 'endothermic').closest('.lab-challenge-q') as HTMLElement;
    expect(within(q).getByText(/Not yet/)).toBeTruthy();
  });
});
