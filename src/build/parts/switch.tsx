'use client';

/** Switch: closed = a 0 V short (conducts), open = no element (breaks the loop). Tap to toggle. */

import { SwitchGlyph } from '../../kit/electronics.js';
import type { PartDef } from '../contract.js';
import { term2, render2, labelOf } from './shared.js';

export const SWITCH: PartDef = {
  kind: 'switch', label: 'Switch', pins: ['a', 'b'], defaultProps: { closed: false },
  terminalAt: term2,
  toElems: (i, n) => (i.props?.closed ? [{ kind: 'V' as const, n1: n('a'), n2: n('b'), value: 0, id: i.id }] : []),
  render: (i, s) => render2(i, labelOf(i), (cx, cy, h, l) => <SwitchGlyph cx={cx} cy={cy} half={h} live={s.live} closed={!!i.props?.closed} label={l} />),
  tap: (i) => ({ closed: !i.props?.closed }),
};
