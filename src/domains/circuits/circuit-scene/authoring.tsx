'use client';

/** Circuit-scene authoring — a custom editor (loaded only in the CMS editor chunk): the drag/wire
 *  CircuitEditor canvas plus a title field. Writes the built doc back to the block attributes. */
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, TextField } from '../../../blocks/authoring.js';
import { CircuitEditor } from '../../../build/CircuitEditor.js';
import { type CircuitDoc } from '../../../build/contract.js';

const EMPTY_DOC: CircuitDoc = { parts: [], nodes: [], size: { w: 560, h: 300 } };

export default function CircuitSceneAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const doc = (value.doc as unknown as CircuitDoc | undefined) ?? EMPTY_DOC;
  return (
    <div>
      <ConfigPanel>
        <ConfigRow label="Title">
          <TextField
            value={(value.title as string) ?? ''}
            onChange={(v) => onChange({ title: v })}
            placeholder="Build a circuit"
            className="flex-1"
          />
        </ConfigRow>
      </ConfigPanel>
      <CircuitEditor value={doc} onChange={(d) => onChange({ doc: d as never })} />
    </div>
  );
}
