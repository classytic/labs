'use client';

/** Word-match runtime — adapter: coerce the deck (may arrive missing / malformed / as a JSON
 *  string), so WordMatchLab always gets a non-empty items array. */
import type { ReactNode } from 'react';
import { WordMatchLab } from '../../../language/word-match/index.js';
import { coerceDeck } from '../shared.js';

export default function WordMatch(a: Record<string, unknown>): ReactNode {
  return (
    <WordMatchLab
      deck={coerceDeck(a.deck)}
      count={a.count as number | undefined}
      show={a.show as 'translation' | 'icon' | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
      objectives={a.objectives as string[] | undefined}
      hints={a.hints as string[] | undefined}
    />
  );
}
