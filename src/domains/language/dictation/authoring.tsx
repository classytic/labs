'use client';

/** Dictation authoring — term language + show-meaning toggle + the deck editor (word/meaning/audio). */
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, ChipToggle, TextField, RowsEditor } from '../../../blocks/authoring.js';
import { coerceDeck } from '../shared.js';

export default function DictationAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const deck = coerceDeck(value.deck);
  return (
    <ConfigPanel>
      <ConfigRow label="term language">
        <TextField
          value={deck.termLang}
          onChange={(v) => onChange({ deck: { ...deck, termLang: v } })}
          placeholder="en-US"
        />
      </ConfigRow>
      <ConfigRow label="show meaning">
        <ChipToggle
          active={!!value.showMeaning}
          onClick={() => onChange({ showMeaning: !value.showMeaning })}
        >
          on
        </ChipToggle>
      </ConfigRow>
      <ConfigRow label="deck">
        <RowsEditor
          rows={deck.items}
          onChange={(v) => onChange({ deck: { ...deck, items: v } })}
          columns={[
            { key: 'term', label: 'word/phrase', grow: true },
            { key: 'translation', label: 'meaning', grow: true },
            { key: 'audioUrl', label: 'audio url', grow: true },
          ]}
          newRow={() => ({ term: '', translation: '' })}
          addLabel="word"
        />
      </ConfigRow>
    </ConfigPanel>
  );
}
