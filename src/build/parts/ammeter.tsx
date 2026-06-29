'use client';

/** Ammeter: an ideal 0 V branch that reads the current through it (mA). Drop it in series. */

import { AmmeterGlyph } from '../../kit/electronics.js';
import type { PartDef } from '../contract.js';
import { term2, render2 } from './shared.js';

export const AMMETER: PartDef = {
  kind: 'ammeter', label: 'Ammeter', pins: ['a', 'b'], defaultProps: {},
  terminalAt: term2,
  toElems: (i, n) => [{ kind: 'V', n1: n('a'), n2: n('b'), value: 0, id: i.id }],
  render: (i, s) => render2(i, undefined, (cx, cy, h) => <AmmeterGlyph cx={cx} cy={cy} half={h} live={s.live} reading={`${(Math.abs(s.i) * 1000).toFixed(Math.abs(s.i) >= 0.0995 ? 0 : 1)} mA`} />),
};
