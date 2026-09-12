'use client';

/** Triangle-trig authoring — angle/leg/framing + labels + which handles drag + a graded question. */
import type { ReactNode } from 'react';
import {
  ConfigPanel,
  ConfigRow,
  ChipToggle,
  TextField,
  NumField,
  SelectField,
} from '../../../blocks/authoring.js';
import { AskEditor, type AskShape } from '../authoring-kit.js';

export default function TriangleTrigAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const a = value as {
    angleDeg?: number;
    leg?: number;
    legKind?: string;
    mode?: string;
    labels?: Record<string, string | undefined>;
    drive?: ('angle' | 'leg')[];
    title?: string;
  };
  const drive = (Array.isArray(a.drive) ? a.drive : ['angle']) as ('angle' | 'leg')[];
  const labels = a.labels ?? {};
  const ask = value.ask as AskShape | undefined;
  const toggleDrive = (k: 'angle' | 'leg'): void =>
    onChange({ drive: drive.includes(k) ? drive.filter((d) => d !== k) : [...drive, k] });
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField
          value={a.title ?? ''}
          placeholder="Angle of depression…"
          onChange={(v) => onChange({ title: v })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="Angle θ (°)">
        <NumField value={a.angleDeg ?? 31} onChange={(v) => onChange({ angleDeg: v })} />
      </ConfigRow>
      <ConfigRow label="Given leg">
        <NumField value={a.leg ?? 15} onChange={(v) => onChange({ leg: v })} />
        <SelectField
          value={a.legKind ?? 'opposite'}
          options={['opposite', 'adjacent']}
          onChange={(v) => onChange({ legKind: v })}
        />
      </ConfigRow>
      <ConfigRow label="Framing">
        <SelectField
          value={a.mode ?? 'depression'}
          options={['depression', 'elevation', 'plain']}
          onChange={(v) => onChange({ mode: v })}
        />
      </ConfigRow>
      <ConfigRow label="Labels">
        <TextField
          value={labels.opposite ?? ''}
          placeholder="opposite"
          onChange={(v) => onChange({ labels: { ...labels, opposite: v } })}
          className="w-24"
        />
        <TextField
          value={labels.adjacent ?? ''}
          placeholder="adjacent"
          onChange={(v) => onChange({ labels: { ...labels, adjacent: v } })}
          className="w-24"
        />
      </ConfigRow>
      <ConfigRow label="Draggable">
        <ChipToggle active={drive.includes('angle')} onClick={() => toggleDrive('angle')}>
          angle
        </ChipToggle>
        <ChipToggle active={drive.includes('leg')} onClick={() => toggleDrive('leg')}>
          given leg
        </ChipToggle>
      </ConfigRow>
      <AskEditor ask={ask} onChange={(x) => onChange({ ask: x })} />
    </ConfigPanel>
  );
}
