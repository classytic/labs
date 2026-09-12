'use client';

/** Listening authoring — options-mode chooser + the deck editor (word/meaning/icon/audio rows). */
import type { ReactNode } from 'react';
import {
  ConfigPanel,
  ConfigRow,
  ChipToggle,
  TextField,
  RowsEditor,
  TagsField,
} from '../../../blocks/authoring.js';
import { coerceDeck } from '../shared.js';

export default function ListeningAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const deck = coerceDeck(value.deck);
  return (
    <ConfigPanel>
      <ConfigRow label="options show">
        {(['word', 'meaning', 'picture'] as const).map((m) => (
          <ChipToggle key={m} active={value.mode === m} onClick={() => onChange({ mode: m })}>
            {m}
          </ChipToggle>
        ))}
      </ConfigRow>
      <ConfigRow label="term language">
        <TextField
          value={deck.termLang}
          onChange={(v) => onChange({ deck: { ...deck, termLang: v } })}
          placeholder="en-US"
        />
      </ConfigRow>
      <ConfigRow label="deck">
        <RowsEditor
          rows={deck.items}
          onChange={(v) => onChange({ deck: { ...deck, items: v } })}
          columns={[
            { key: 'term', label: 'word', grow: true },
            { key: 'translation', label: 'meaning', grow: true },
            { key: 'icon', label: 'icon', type: 'icon' },
            { key: 'audioUrl', label: 'audio url', grow: true },
          ]}
          newRow={() => ({ term: '', translation: '' })}
          addLabel="word"
        />
      </ConfigRow>
      <ConfigRow label="objectives">
        <TagsField
          value={(value.objectives as string[]) ?? []}
          onChange={(v) => onChange({ objectives: v })}
          placeholder="comma-separated goals"
        />
      </ConfigRow>
    </ConfigPanel>
  );
}
