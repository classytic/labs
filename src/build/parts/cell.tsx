'use client';

/** Battery / cell: an ideal voltage source. `volts` sets its EMF; it drives the loop current. */

import { CellGlyph } from '../../kit/electronics.js';
import type { PartDef } from '../contract.js';
import { term2, render2, num } from './shared.js';

export const CELL: PartDef = {
  kind: 'cell', label: 'Battery', pins: ['a', 'b'], defaultProps: { volts: 5 },
  controls: [{ key: 'volts', label: 'Voltage', unit: 'V', min: 0, max: 24, step: 0.5 }],
  terminalAt: term2,
  toElems: (i, n) => [{ kind: 'V', n1: n('a'), n2: n('b'), value: num(i.props?.volts, 5), id: i.id }],
  render: (i, s) => render2(i, `${num(i.props?.volts, 5)} V`, (cx, cy, h, l) => <CellGlyph cx={cx} cy={cy} half={h} live={s.live} label={l} />),
};
