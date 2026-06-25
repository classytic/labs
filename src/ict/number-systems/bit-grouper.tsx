'use client';

/**
 * BitGrouper — slice a byte into nibbles and read the hex.
 *
 * A strip of tappable bits that auto-slices into groups of k FROM THE RIGHT
 * (4 for hex, 3 for octal), translating each group to a hex/octal digit live —
 * the "group the bits" trick made physical. Flip between hex and octal to watch
 * the SAME bits re-slice and the leftmost group pad with zeros; in octal the top
 * group of a byte never exceeds 3 (greyed), which is exactly why hex won.
 */

import { useState, type ReactNode } from 'react';
import { Chip, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { BitCell, digitChar } from './wheel.js';

export interface BitGrouperProps {
  width?: number;
  groupSize?: number;
  /** Group sizes offered as chips (4 = hex, 3 = octal). */
  groupings?: number[];
  start?: number;
  /** Pose "build this value" — reports via the learner seam when matched. */
  target?: { value: number; base: 16 | 8 | 2 };
  showColor?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

interface Group { digit: number; cells: { pos: number; bit: number }[]; full: boolean }

function sliceFromRight(value: number, width: number, k: number): Group[] {
  const nGroups = Math.ceil(width / k);
  const groups: Group[] = [];
  for (let g = nGroups - 1; g >= 0; g--) {           // leftmost group first
    const startPos = g * k;
    const bitsInGroup = Math.min(k, width - startPos);
    let digit = 0;
    const cells: { pos: number; bit: number }[] = [];
    for (let b = bitsInGroup - 1; b >= 0; b--) {       // MSB → LSB within the group
      const pos = startPos + b;
      const bit = (value >> pos) & 1;
      digit += bit << b;
      cells.push({ pos, bit });
    }
    groups.push({ digit, cells, full: bitsInGroup === k });
  }
  return groups;
}

export function BitGrouperLab({
  width = 8, groupSize = 4, groupings = [4, 3], start = 0, target, showColor = false,
  title = 'Bit grouper', prompt = 'Tap the bits. Group from the right — 4 per hex digit, 3 per octal digit.',
  objectives,
}: BitGrouperProps): ReactNode {
  const cap = (1 << width) - 1;
  const [value, setValue] = useState(Math.max(0, Math.min(cap, Math.floor(start))));
  const [k, setK] = useState(groupSize);
  const groups = sliceFromRight(value, width, k);
  const radix = k === 4 ? 16 : k === 3 ? 8 : 2;
  const prefix = radix === 16 ? '0x' : radix === 8 ? '0o' : '0b';
  const hasPartial = groups.some((g) => !g.full);

  const toggle = (pos: number): void => setValue((x) => x ^ (1 << pos));

  const solved = target != null && value === target.value;
  useCheckpoint({ solved, activity: 'bit-grouper' });

  const bitStr = value.toString(2).padStart(width, '0');
  const digitStr = groups.map((g) => digitChar(g.digit)).join('');
  const swatch = `rgb(${(value & 0xff)}, ${(value >> 3) & 0xff || (value & 0xff)}, ${(value >> 5) & 0xff || (value & 0xff)})`;

  const figure = (
    <>
      <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: '18px 14px' }}>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {groups.map((g, gi) => (
            <div key={gi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', gap: 5, padding: '6px', borderRadius: 9, background: g.full ? 'transparent' : 'color-mix(in oklab, var(--stage-muted) 14%, transparent)', border: '1px dashed var(--stage-grid)' }}>
                {g.cells.map((c) => <BitCell key={c.pos} on={c.bit === 1} onTap={() => toggle(c.pos)} ariaLabel={`bit ${c.pos}, ${c.bit ? 'on' : 'off'}`} />)}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: g.full ? 'var(--stage-accent)' : 'var(--stage-muted)', fontVariantNumeric: 'tabular-nums' }}>{digitChar(g.digit)}</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--stage-fg)' }}>
          0b{bitStr} = {prefix}{digitStr} = {value}
        </p>
        {radix === 8 && hasPartial && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--stage-muted)' }}>
            the greyed top octal group is only {width % k} bits — it never passes {(1 << (width % k)) - 1}, so octal wastes the top of a byte (why hex won)
          </p>
        )}
        {showColor && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
            <span style={{ width: 64, height: 24, borderRadius: 6, background: swatch, border: '1px solid var(--stage-grid)' }} aria-label="the bits as a colour swatch" />
          </div>
        )}
      </div>
      <LiveRegion>
        {`${prefix}${digitStr}, decimal ${value}`}
      </LiveRegion>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="group by">
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          {groupings.map((gs) => <Chip key={gs} selected={gs === k} onClick={() => setK(gs)}>{gs === 4 ? '4 → hex' : gs === 3 ? '3 → octal' : String(gs)}</Chip>)}
        </span>
      </Field>
    </ControlBar>
  );

  const footer = target != null ? (
    <StatusPill ok={solved}>{solved ? '✓ Matches the target' : `Build ${target.base === 16 ? '0x' : target.base === 8 ? '0o' : '0b'}${target.value.toString(target.base).toUpperCase()}`}</StatusPill>
  ) : undefined;

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
