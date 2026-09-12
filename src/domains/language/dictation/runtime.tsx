'use client';

/** Dictation runtime — adapter: coerce the deck, then render the hear-and-type lab. */
import type { ReactNode } from 'react';
import { DictationLab } from '../../../language/dictation/index.js';
import { coerceDeck } from '../shared.js';

export default function Dictation(a: Record<string, unknown>): ReactNode {
  return (
    <DictationLab
      deck={coerceDeck(a.deck)}
      showMeaning={a.showMeaning as boolean | undefined}
      objectives={a.objectives as string[] | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
