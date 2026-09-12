'use client';

/** Word-match authoring — the deck editor (languages + word/meaning/icon rows). */
import type { ReactNode } from 'react';
import {
  ConfigPanel,
  ConfigRow,
  ChipToggle,
  TextField,
  RowsEditor,
  PedagogyRows,
} from '../../../blocks/authoring.js';
import { coerceDeck } from '../shared.js';

export default function WordMatchAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const deck = coerceDeck(value.deck);
  return (
    <ConfigPanel>
      <ConfigRow label="languages">
        <TextField
          value={deck.termLang}
          onChange={(v) => onChange({ deck: { ...deck, termLang: v } })}
          placeholder="en-US"
        />
        <TextField
          value={deck.transLang}
          onChange={(v) => onChange({ deck: { ...deck, transLang: v } })}
          placeholder="bn-BD"
        />
      </ConfigRow>
      <PedagogyRows
        objectives={value.objectives as string[] | undefined}
        hints={value.hints as string[] | undefined}
        onObjectives={(v) => onChange({ objectives: v })}
        onHints={(v) => onChange({ hints: v })}
      />
      <ConfigRow label="show">
        <ChipToggle
          active={value.show === 'icon'}
          onClick={() => onChange({ show: value.show === 'icon' ? 'translation' : 'icon' })}
        >
          pictures
        </ChipToggle>
      </ConfigRow>
      <ConfigRow label="words">
        <RowsEditor
          rows={deck.items}
          onChange={(items) => onChange({ deck: { ...deck, items } })}
          columns={[
            { key: 'term', label: 'word', grow: true },
            { key: 'translation', label: 'meaning', grow: true },
            { key: 'icon', label: 'icon', type: 'icon' },
            { key: 'transliteration', label: 'rom.' },
          ]}
          newRow={() => ({ term: '', translation: '' })}
          addLabel="word"
        />
      </ConfigRow>
    </ConfigPanel>
  );
}
