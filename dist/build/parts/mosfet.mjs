'use client';

import { MosfetGlyph } from "../../kit/electronics.mjs";
import { num } from "./shared.mjs";
import { jsx } from "react/jsx-runtime";

//#region src/build/parts/mosfet.tsx
const MOS_HALF = 34, GATE_OFF = 37;
const mosTerminal = (i, pin) => {
	const { x, y } = i.at;
	return pin === "d" ? {
		x,
		y: y - MOS_HALF
	} : pin === "s" ? {
		x,
		y: y + MOS_HALF
	} : {
		x: x - GATE_OFF,
		y
	};
};
const mosDef = (kind, pmos) => ({
	kind,
	label: pmos ? "PMOS" : "NMOS",
	pins: [
		"d",
		"s",
		"g"
	],
	defaultProps: {
		vth: 2,
		k: .5,
		maxPower: .5,
		maxVoltage: 20
	},
	controls: [
		{
			key: "vth",
			label: "Threshold",
			unit: "V",
			min: .5,
			max: 5,
			step: .1
		},
		{
			key: "k",
			label: "Gain k",
			min: .1,
			max: 2,
			step: .1
		},
		{
			key: "maxPower",
			label: "Power rating",
			unit: "W",
			min: 0,
			max: 50,
			step: .1
		},
		{
			key: "maxVoltage",
			label: "Breakdown V",
			unit: "V",
			min: 0,
			max: 100,
			step: 1
		}
	],
	terminalAt: mosTerminal,
	toElems: (i, n) => [{
		kind: "M",
		pmos,
		n1: n("d"),
		n2: n("s"),
		n3: n("g"),
		value: 0,
		vth: num(i.props?.vth, 2),
		k: num(i.props?.k, .5),
		id: i.id
	}],
	render: (i, s) => /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx(MosfetGlyph, {
		cx: i.at.x + 9,
		cy: i.at.y,
		half: MOS_HALF,
		pmos,
		on: s.live,
		live: s.live,
		label: i.props?.label
	}) }, i.id)
});
const NMOS = mosDef("nmos", false);
const PMOS = mosDef("pmos", true);

//#endregion
export { NMOS, PMOS };