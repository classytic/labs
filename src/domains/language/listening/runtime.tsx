'use client';

/** Listening runtime — adapter: coerce the deck, then render the hear-and-choose lab. */
import type { ReactNode } from 'react';
import { ListeningLab } from '../../../language/listening/index.js';
import { coerceDeck, type ListenMode } from '../shared.js';

export default function Listening(a: Record<string, unknown>): ReactNode {
  return (
    <ListeningLab
      deck={coerceDeck(a.deck)}
      mode={a.mode as ListenMode}
      choices={a.choices as number | undefined}
      objectives={a.objectives as string[] | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
