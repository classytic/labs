'use client';

/** Diode: one-way valve (Shockley model in the solver). Conducts a→b above ~0.7 V, blocks reverse. */

import { DiodeGlyph } from '../../kit/electronics.js';
import type { PartDef } from '../contract.js';
import { term2, render2, labelOf } from './shared.js';

export const DIODE: PartDef = {
  kind: 'diode', label: 'Diode', pins: ['a', 'b'], defaultProps: {},
  terminalAt: term2,
  toElems: (i, n) => [{ kind: 'D', n1: n('a'), n2: n('b'), value: 0, id: i.id }],
  render: (i, s) => render2(i, labelOf(i), (cx, cy, h, l) => <DiodeGlyph cx={cx} cy={cy} half={h} live={s.live} conducting={s.live} label={l} />),
};
