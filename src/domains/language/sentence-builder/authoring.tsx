'use client';

/** Sentence-builder authoring — the tile editor (word / part-of-speech / gloss rows) + prompt. */
import type { ReactNode } from 'react';
import {
  ConfigPanel,
  ConfigRow,
  ChipToggle,
  TextField,
  RowsEditor,
  PedagogyRows,
} from '../../../blocks/authoring.js';
import { coerceArray, DEMO_SENTENCE, type SentenceTile } from '../shared.js';

export default function SentenceBuilderAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const tiles = coerceArray<SentenceTile>(value.tiles, DEMO_SENTENCE);
  return (
    <ConfigPanel>
      <ConfigRow label="prompt">
        <TextField
          value={(value.prompt as string) ?? ''}
          onChange={(v) => onChange({ prompt: v })}
          placeholder="meaning / L1 sentence"
        />
      </ConfigRow>
      <ConfigRow label="prompt dir">
        <ChipToggle
          active={value.promptDir === 'rtl'}
          onClick={() => onChange({ promptDir: value.promptDir === 'rtl' ? 'ltr' : 'rtl' })}
        >
          RTL
        </ChipToggle>
      </ConfigRow>
      <ConfigRow label="tiles">
        <RowsEditor
          rows={tiles}
          onChange={(v) => onChange({ tiles: v })}
          columns={[
            { key: 'text', label: 'word', grow: true },
            { key: 'pos', label: 'part', type: 'pos' },
            { key: 'gloss', label: 'gloss', grow: true },
          ]}
          newRow={() => ({ text: '', pos: 'other' as const })}
          addLabel="word"
        />
      </ConfigRow>
      <PedagogyRows
        objectives={value.objectives as string[] | undefined}
        hints={value.hints as string[] | undefined}
        onObjectives={(v) => onChange({ objectives: v })}
        onHints={(v) => onChange({ hints: v })}
      />
      <ConfigRow label="audio language">
        <TextField
          value={(value.lang as string) ?? ''}
          onChange={(v) => onChange({ lang: v || undefined })}
          placeholder="en-US (blank = no 🔊)"
        />
      </ConfigRow>
    </ConfigPanel>
  );
}
