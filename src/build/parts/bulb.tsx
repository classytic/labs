'use client';

/** Lamp / bulb: a resistor that glows. `ohms` sets its resistance; brightness tracks |current|. */

import { BulbGlyph } from '../../kit/electronics.js';
import type { PartDef } from '../contract.js';
import { term2, render2, num, labelOf } from './shared.js';

export const BULB: PartDef = {
  kind: 'bulb', label: 'Lamp', pins: ['a', 'b'], defaultProps: { ohms: 100, maxPower: 2 },
  controls: [
    { key: 'ohms', label: 'Resistance', unit: 'Ω', min: 1, max: 10000, step: 10 },
    { key: 'maxPower', label: 'Power rating', unit: 'W', min: 0, max: 50, step: 0.1 },
  ],
  terminalAt: term2,
  toElems: (i, n) => [{ kind: 'R', n1: n('a'), n2: n('b'), value: num(i.props?.ohms, 100) }],
  render: (i, s) => render2(i, labelOf(i) ?? 'lamp', (cx, cy, h, l) => <BulbGlyph cx={cx} cy={cy} half={h} live={s.live} brightness={Math.max(0, Math.min(1, Math.abs(s.i) * 40))} label={l} />),
};
