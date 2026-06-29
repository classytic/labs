'use client';

/** Capacitor: stores charge. Open at DC (no element here); the transient solver gives it dynamics. */

import { CapacitorGlyph } from '../../kit/electronics.js';
import type { PartDef } from '../contract.js';
import { term2, render2, labelOf } from './shared.js';

export const CAPACITOR: PartDef = {
  kind: 'capacitor', label: 'Capacitor', pins: ['a', 'b'], defaultProps: { farads: 1e-5 },
  terminalAt: term2,
  toElems: () => [], // open at DC
  render: (i, s) => render2(i, labelOf(i), (cx, cy, h, l) => <CapacitorGlyph cx={cx} cy={cy} half={h} live={s.live} label={l} />),
};
