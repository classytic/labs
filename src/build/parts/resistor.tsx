'use client';

/** Resistor: an ohmic element. `ohms` sets its resistance; current = V across it / ohms. */

import { ResistorGlyph } from '../../kit/electronics.js';
import type { PartDef } from '../contract.js';
import { term2, render2, num, ohmLabel } from './shared.js';

export const RESISTOR: PartDef = {
  kind: 'resistor', label: 'Resistor', pins: ['a', 'b'], defaultProps: { ohms: 1000, maxPower: 0.5 },
  controls: [
    { key: 'ohms', label: 'Resistance', unit: 'Ω', min: 1, max: 100000, step: 10 },
    { key: 'maxPower', label: 'Power rating', unit: 'W', min: 0, max: 50, step: 0.05 },
  ],
  terminalAt: term2,
  toElems: (i, n) => [{ kind: 'R', n1: n('a'), n2: n('b'), value: num(i.props?.ohms, 1000) }],
  render: (i, s) => render2(i, ohmLabel(num(i.props?.ohms, 1000)), (cx, cy, h, l) => <ResistorGlyph cx={cx} cy={cy} half={h} live={s.live} label={l} />),
};
