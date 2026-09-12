import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DictationLab } from '../../../src/language/dictation/preset.js';
import { ListeningLab } from '../../../src/language/listening/preset.js';
import dictationManifest from '../../../src/domains/language/dictation/manifest.js';
import listeningManifest from '../../../src/domains/language/listening/manifest.js';
import type { Deck } from '../../../src/language/deck.js';

const deck: Deck = {
  termLang: 'en-US',
  transLang: 'bn-BD',
  items: [
    { term: 'water', translation: 'পানি', audioUrl: '/water.mp3' },
    { term: 'river', translation: 'নদী', audioUrl: '/river.mp3' },
  ],
};

describe('language listening experiences', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'Audio',
      class {
        play = vi.fn(() => Promise.resolve());
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('gates dictation entry on an actual listening action and uses contextual progression', () => {
    render(<DictationLab deck={deck} />);
    const input = screen.getByRole('textbox', { name: 'Your answer' });
    expect(input.hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
    expect(input.hasAttribute('disabled')).toBe(false);
    fireEvent.change(input, { target: { value: 'Water!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('1 of 2 complete')).not.toBeNull();
    expect(screen.getByRole('button', { name: /next item/i })).not.toBeNull();
  });

  it('prevents visual guessing before audio in listen-and-choose mode', () => {
    render(<ListeningLab deck={deck} choices={2} />);
    const answer = screen.getByRole('radio', { name: 'water' });
    expect(answer.hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Play audio' }));
    expect(answer.hasAttribute('disabled')).toBe(false);
    fireEvent.click(answer);
    expect(screen.getByText('1 of 2 complete')).not.toBeNull();
  });

  it('rejects empty, singleton, and unbounded practice decks', () => {
    expect(
      dictationManifest.schema.safeParse({ deck: { termLang: 'en', transLang: 'bn', items: [] } }).success,
    ).toBe(false);
    expect(
      listeningManifest.schema.safeParse({
        deck: { termLang: 'en', transLang: 'bn', items: [deck.items[0]] },
      }).success,
    ).toBe(false);
    expect(
      listeningManifest.schema.safeParse({
        deck: { ...deck, items: Array.from({ length: 41 }, () => deck.items[0]) },
      }).success,
    ).toBe(false);
  });
});
