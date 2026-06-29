'use client';

/**
 * Junction node: a free connection point (one pin, no element = a perfect conductor). Every
 * wire touching it shares one electrical net, so it is how parallel branches, bridges and
 * ladders are built. The editor only ever creates one ON a wire (a tap), and prunes any that
 * fall below two connections, so junctions never float as clutter.
 */

import { JunctionDot } from '../../kit/electronics.js';
import type { PartDef } from '../contract.js';

export const NODE: PartDef = {
  kind: 'node', label: 'Node (junction)', pins: ['j'], defaultProps: {},
  terminalAt: (i) => ({ x: i.at.x, y: i.at.y }),
  toElems: () => [],
  render: (i, s) => <JunctionDot key={i.id} x={i.at.x} y={i.at.y} live={s.live} r={5} />,
};
