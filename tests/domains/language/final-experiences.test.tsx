import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReadingLab } from '../../../src/language/reading/preset.js';
import { SentenceBuilderLab } from '../../../src/language/sentence-builder/preset.js';
import { TransformLab } from '../../../src/language/transform/preset.js';
import { WordMatchLab } from '../../../src/language/word-match/preset.js';
import { DictationLab } from '../../../src/language/dictation/preset.js';
import readingManifest from '../../../src/domains/language/reading/manifest.js';
import sentenceManifest from '../../../src/domains/language/sentence-builder/manifest.js';
import transformManifest from '../../../src/domains/language/transform/manifest.js';
import wordMatchManifest from '../../../src/domains/language/word-match/manifest.js';

describe('final language experiences', () => {
  it('keeps reading answers evidence-led and non-revealing after a wrong choice', () => {
    render(
      <ReadingLab
        passage="Mina carries a blue umbrella."
        questions={[
          {
            q: 'What colour is the umbrella?',
            options: ['red', 'blue'],
            answer: 'blue',
            explain: 'The passage calls it blue.',
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'red' }));
    expect(screen.getByText(/revisit the evidence/i)).not.toBeNull();
    expect(screen.queryByText(/the passage calls it blue/i)).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'blue' }));
    expect(screen.getByText(/the passage calls it blue/i)).not.toBeNull();
  });

  it('builds and checks a sentence with reversible keyboard-native tiles', () => {
    render(<SentenceBuilderLab tiles={[{ text: 'She' }, { text: 'reads' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'She, tap to place' }));
    fireEvent.click(screen.getByRole('button', { name: 'reads, tap to place' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('✓ Correct word order')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'She, tap to remove' }));
    expect(screen.getByRole('button', { name: 'She, tap to place' })).not.toBeNull();
  });

  it('makes the changed word visible after a correct transformation', () => {
    render(
      <TransformLab
        from={[{ text: 'You' }, { text: 'go' }]}
        to={[{ text: 'Do' }, { text: 'you' }, { text: 'go' }]}
        note="Questions introduce do-support."
      />,
    );
    for (const word of ['Do', 'you', 'go'])
      fireEvent.click(screen.getByRole('button', { name: `${word}, tap to place` }));
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Questions introduce do-support.')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Do, tap to remove' }).getAttribute('data-sel')).toBe('true');
  });

  it('announces both mismatches and successful vocabulary pairs', () => {
    render(
      <WordMatchLab
        deck={{
          termLang: 'en',
          transLang: 'bn',
          items: [
            { term: 'water', translation: 'পানি' },
            { term: 'book', translation: 'বই' },
          ],
        }}
        count={2}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'water' }));
    fireEvent.click(screen.getByRole('button', { name: 'বই' }));
    expect(screen.getByText('Those do not match. Try another pair.')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'water' }));
    fireEvent.click(screen.getByRole('button', { name: 'পানি' }));
    expect(screen.getByText('Matched water.')).not.toBeNull();
  });

  it('preserves RTL input and does not submit an unfinished IME composition', () => {
    const RealAudio = globalThis.Audio;
    class TestAudio {
      play(): Promise<void> {
        return Promise.resolve();
      }
    }
    Object.defineProperty(globalThis, 'Audio', { configurable: true, value: TestAudio });
    try {
      render(
        <DictationLab
          deck={{
            termLang: 'ar',
            transLang: 'en',
            items: [{ term: 'ماء', translation: 'water', audioUrl: '/water.mp3' }],
          }}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
      const input = screen.getByRole('textbox');
      expect(input.getAttribute('dir')).toBe('rtl');
      expect(input.getAttribute('lang')).toBe('ar');
      fireEvent.change(input, { target: { value: 'ماء' } });
      fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
      expect(screen.queryByText('✓ ماء')).toBeNull();
      fireEvent.keyDown(input, { key: 'Enter', isComposing: false });
      expect(screen.getByText('✓ ماء')).not.toBeNull();
    } finally {
      Object.defineProperty(globalThis, 'Audio', { configurable: true, value: RealAudio });
    }
  });

  it('rejects authoring that would create blank, ambiguous, or undersized activities', () => {
    expect(
      readingManifest.schema.safeParse({
        passage: 'Text',
        questions: [{ q: 'Question?', options: ['same', 'same'], answer: 'missing' }],
      }).success,
    ).toBe(false);
    expect(sentenceManifest.schema.safeParse({ tiles: [{ text: 'Only' }] }).success).toBe(false);
    expect(sentenceManifest.schema.safeParse({ tiles: [{ text: 'Valid' }, { text: ' ' }] }).success).toBe(
      false,
    );
    expect(transformManifest.schema.safeParse({ from: [], to: [{ text: 'Go' }] }).success).toBe(false);
    expect(
      wordMatchManifest.schema.safeParse({
        deck: { termLang: 'en', transLang: 'bn', items: [{ term: 'one', translation: 'এক' }] },
      }).success,
    ).toBe(false);
  });
});
