'use client';

/**
 * MOSFET (NMOS + PMOS): a 3-terminal transistor (drain top, source bottom, gate left). The
 * gate voltage relative to source switches the drain-source channel on past `vth`; `k` sets the
 * transconductance. Both polarities share this module and differ only by the `pmos` flag.
 */

import type { Vec2 } from '@classytic/stage';
import { MosfetGlyph } from '../../kit/electronics.js';
import type { PartInstance, PartDef } from '../contract.js';
import { num } from './shared.js';

const MOS_HALF = 34, GATE_OFF = 37;

const mosTerminal = (i: PartInstance, pin: string): Vec2 => {
  const { x, y } = i.at;
  return pin === 'd' ? { x, y: y - MOS_HALF } : pin === 's' ? { x, y: y + MOS_HALF } : { x: x - GATE_OFF, y };
};

const mosDef = (kind: string, pmos: boolean): PartDef => ({
  kind, label: pmos ? 'PMOS' : 'NMOS', pins: ['d', 's', 'g'], defaultProps: { vth: 2, k: 0.5, maxPower: 0.5, maxVoltage: 20 },
  controls: [
    { key: 'vth', label: 'Threshold', unit: 'V', min: 0.5, max: 5, step: 0.1 },
    { key: 'k', label: 'Gain k', min: 0.1, max: 2, step: 0.1 },
    { key: 'maxPower', label: 'Power rating', unit: 'W', min: 0, max: 50, step: 0.1 },
    { key: 'maxVoltage', label: 'Breakdown V', unit: 'V', min: 0, max: 100, step: 1 },
  ],
  terminalAt: mosTerminal,
  toElems: (i, n) => [{ kind: 'M', pmos, n1: n('d'), n2: n('s'), n3: n('g'), value: 0, vth: num(i.props?.vth, 2), k: num(i.props?.k, 0.5), id: i.id }],
  render: (i, s) => <g key={i.id}><MosfetGlyph cx={i.at.x + 9} cy={i.at.y} half={MOS_HALF} pmos={pmos} on={s.live} live={s.live} label={i.props?.label as string} /></g>,
});

export const NMOS: PartDef = mosDef('nmos', false);
export const PMOS: PartDef = mosDef('pmos', true);
