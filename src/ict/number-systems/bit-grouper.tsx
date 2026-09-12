'use client';

/**
 * BitGrouper, slice a byte into nibbles and read the hex.
 *
 * A strip of tappable bits that auto-slices into groups of k FROM THE RIGHT
 * (4 for hex, 3 for octal), translating each group to a hex/octal digit live ,
 * the "group the bits" trick made physical. Flip between hex and octal to watch
 * the SAME bits re-slice and the leftmost group pad with zeros; in octal the top
 * group of a byte never exceeds 3 (greyed), which is exactly why hex won.
 */

import { useState, type CSSProperties, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { Segmented } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { BitCell, digitChar } from './wheel.js';

export interface BitGrouperProps {
  width?: number;
  groupSize?: number;
  /** Group sizes offered as chips (4 = hex, 3 = octal). */
  groupings?: number[];
  start?: number;
  /** Pose "build this value", reports via the learner seam when matched. */
  target?: { value: number; base: 16 | 8 | 2 };
  showColor?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

interface Group {
  digit: number;
  cells: { pos: number; bit: number }[];
  full: boolean;
}

function sliceFromRight(value: number, width: number, k: number): Group[] {
  const nGroups = Math.ceil(width / k);
  const groups: Group[] = [];
  for (let g = nGroups - 1; g >= 0; g--) {
    // leftmost group first
    const startPos = g * k;
    const bitsInGroup = Math.min(k, width - startPos);
    let digit = 0;
    const cells: { pos: number; bit: number }[] = [];
    for (let b = bitsInGroup - 1; b >= 0; b--) {
      // MSB → LSB within the group
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
  width = 8,
  groupSize = 4,
  groupings = [4, 3],
  start = 0,
  target,
  showColor = false,
  title = 'Bit grouper',
  prompt = 'Tap the bits. Group from the right: 4 per hex digit, 3 per octal digit.',
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
  const swatch = `rgb(${value & 0xff}, ${
    (value >> 3) & 0xff || value & 0xff
  }, ${(value >> 5) & 0xff || value & 0xff})`;

  const figure = (
    <>
      <div className="ict-number-scene">
        <div className="ict-bit-groups">
          {groups.map((g, gi) => (
            <div key={gi} className="ict-bit-group">
              <div className="ict-bit-group-cells" data-partial={!g.full || undefined}>
                {g.cells.map((c) => (
                  <BitCell
                    key={c.pos}
                    on={c.bit === 1}
                    onTap={() => toggle(c.pos)}
                    ariaLabel={`bit ${c.pos}, ${c.bit ? 'on' : 'off'}`}
                  />
                ))}
              </div>
              <div className="ict-group-digit" data-partial={!g.full || undefined}>
                {digitChar(g.digit)}
              </div>
            </div>
          ))}
        </div>

        <p className="ict-number-equation">
          0b{bitStr} = {prefix}
          {digitStr} = {value}
        </p>
        {showColor && (
          <figure className="ict-color-preview">
            <span
              className="ict-color-swatch"
              style={{ '--ict-swatch': swatch } as CSSProperties}
              aria-label="the bits as a colour swatch"
            />
            <figcaption>
              RGB preview <span>{swatch}</span>
            </figcaption>
          </figure>
        )}
      </div>
      <Activity.LiveRegion>{`${prefix}${digitStr}, decimal ${value}`}</Activity.LiveRegion>
    </>
  );

  const controls = (
    <div className="lab-activity-inspector-section">
      <Field label="group by">
        <Segmented
          ariaLabel="group by"
          value={String(k)}
          onChange={(v) => setK(Number(v))}
          options={groupings.map((gs) => ({
            value: String(gs),
            label: gs === 4 ? '4 → hex' : gs === 3 ? '3 → octal' : String(gs),
          }))}
        />
      </Field>
      {radix === 8 && hasPartial && (
        <p className="ict-number-note">
          The partial octal group has only {width % k} bits, so it cannot exceed {(1 << (width % k)) - 1}. A
          byte maps more evenly to two hexadecimal digits.
        </p>
      )}
    </div>
  );

  const targetLabel =
    target == null
      ? undefined
      : `${target.base === 16 ? '0x' : target.base === 8 ? '0o' : '0b'}${target.value.toString(target.base).toUpperCase()}`;

  return (
    <Activity.Root className="ict-number-activity">
      <Activity.Header>
        <Activity.Heading eyebrow="Number systems" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          {prefix}
          {digitStr}
        </strong>
        <span>{bitStr}</span>
        <span>decimal {value}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Interactive binary grouping model">{figure}</Activity.Canvas>
        <Activity.Inspector label="Grouping and notation">{controls}</Activity.Inspector>
      </Activity.Workspace>
      {targetLabel && (
        <Activity.Feedback>
          <span>{solved ? 'Complete' : 'Goal'}</span>
          <p>{solved ? 'The bits match the target.' : `Build ${targetLabel}.`}</p>
        </Activity.Feedback>
      )}
    </Activity.Root>
  );
}
