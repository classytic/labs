'use client';

import { Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { Tag } from "../../kit/electronics.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { inBox, rand, recombine, stepCarriers, tweenOpacity, useCarrierSim } from "../../kit/carrier-engine.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { solveDC } from "@classytic/stage/circuit";

//#region src/circuits/semiconductor/preset.tsx
/**
* MosfetInsideLab — what actually happens INSIDE an NMOS as you turn the gate.
*
* A cross-section of the device: a p-type substrate (holes, +), two n+ wells for the
* source and drain (electrons, −), a metal gate over a thin oxide. Turn the gate
* voltage: below threshold the gate just pushes holes away and opens a bare depletion
* region (no path). Past threshold the surface INVERTS, electrons pulled up from the
* body form a thin n-channel that bridges source to drain, and with a drain voltage
* those electrons drift across, the conventional current. The channel on/off and the
* drain current are the real engine solve (the same MOSFET model as the schematic lab),
* so the inside view and the circuit always agree.
*/
const W = 560, H = 320;
const DEV = {
	x: 40,
	y: 86,
	w: 480,
	h: 200
};
const WELL_W = 96, WELL_TOP = 110, WELL_BOT = 250;
const SRC_X = DEV.x + 18, DRN_X = DEV.x + DEV.w - 18 - WELL_W;
const CHAN_X0 = SRC_X + WELL_W, CHAN_X1 = DRN_X;
const CHAN_Y = 116;
const OX_Y = WELL_TOP - 12, OX_H = 8;
const GATE_Y = OX_Y - 16, GATE_H = 14;
const GATE_X0 = CHAN_X0 - 12, GATE_X1 = CHAN_X1 + 12;
const ELEC = "var(--stage-semi-n, oklch(0.62 0.18 250))";
const HOLE = "var(--stage-semi-p, oklch(0.6 0.19 25))";
const N_FILL = "color-mix(in oklab, var(--stage-semi-n, oklch(0.62 0.18 250)) 18%, var(--stage-bg))";
const P_FILL = "color-mix(in oklab, var(--stage-semi-p, oklch(0.6 0.19 25)) 12%, var(--stage-bg))";
const METAL = "var(--stage-metal)";
const OXIDE = "color-mix(in oklab, var(--stage-metal) 28%, var(--stage-bg))";
const MUTED = "var(--stage-muted)";
const hash = (i, s) => {
	let x = (Math.imul(i + 1, 73856093) ^ Math.imul(s + 1, 19349663)) >>> 0;
	x ^= x >>> 13;
	x = Math.imul(x, 1274126177) >>> 0;
	x ^= x >>> 16;
	return x % 1e5 / 1e5;
};
const px = (n) => Math.round(n);
function Electron({ x, y, o = 1 }) {
	const cx = px(x), cy = px(y);
	return /* @__PURE__ */ jsxs("g", {
		style: { pointerEvents: "none" },
		opacity: o,
		children: [/* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r: 4.5,
			fill: ELEC
		}), /* @__PURE__ */ jsx("line", {
			x1: cx - 2,
			y1: cy,
			x2: cx + 2,
			y2: cy,
			stroke: "var(--stage-bg)",
			strokeWidth: 1.4,
			strokeLinecap: "round"
		})]
	});
}
function Hole({ x, y, o = 1 }) {
	const cx = px(x), cy = px(y);
	return /* @__PURE__ */ jsxs("g", {
		style: { pointerEvents: "none" },
		opacity: o,
		children: [
			/* @__PURE__ */ jsx("circle", {
				cx,
				cy,
				r: 4.5,
				fill: "none",
				stroke: HOLE,
				strokeWidth: 1.6
			}),
			/* @__PURE__ */ jsx("line", {
				x1: cx - 2,
				y1: cy,
				x2: cx + 2,
				y2: cy,
				stroke: HOLE,
				strokeWidth: 1.4,
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: cx,
				y1: cy - 2,
				x2: cx,
				y2: cy + 2,
				stroke: HOLE,
				strokeWidth: 1.4,
				strokeLinecap: "round"
			})
		]
	});
}
/** a spread spawn point that is also the carrier's HOME (so it jiggles there, not wanders off). */
const sited = (b, seed) => {
	const p = inBox(b, seed);
	return {
		x: p.x,
		y: p.y,
		hx: p.x,
		hy: p.y
	};
};
/** draw an engine carrier pool as electron / hole glyphs (positions in-bounds, opacity tweened). */
const renderCarriers = (cs) => cs.filter((c) => (c.o ?? 1) > .02).map((c) => c.t === "e" ? /* @__PURE__ */ jsx(Electron, {
	x: c.x,
	y: c.y,
	o: c.o ?? 1
}, c.id) : /* @__PURE__ */ jsx(Hole, {
	x: c.x,
	y: c.y,
	o: c.o ?? 1
}, c.id));
function MosfetInsideLab({ pmos = false, vth = 1.5, k = .02, title = pmos ? "Inside the PMOS: the p-channel mirror" : "Inside the transistor: building the channel", prompt = pmos ? "The mirror of the NMOS: an n-type substrate, p+ source and drain, holes as the carriers. Pull the gate BELOW the source and holes are drawn up to invert the surface into a p-channel; the source-drain voltage then drifts them across." : "Turn the gate voltage. Below the threshold it only clears a depletion region, no path. Past it, electrons are pulled up to invert the surface into an n-channel, and the drain voltage drifts them across as current.", ask, activity = pmos ? "pmos-inside" : "mosfet-inside" } = {}) {
	const [Vg, setVg] = useState(0);
	const [Vd, setVd] = useState(2);
	const VDD = 5;
	const sol = solveDC(pmos ? [
		{
			kind: "V",
			n1: 1,
			n2: 0,
			value: VDD
		},
		{
			kind: "V",
			n1: 3,
			n2: 0,
			value: VDD - Vg
		},
		{
			kind: "V",
			n1: 2,
			n2: 0,
			value: VDD - Vd
		},
		{
			kind: "M",
			pmos: true,
			n1: 2,
			n2: 1,
			n3: 3,
			value: 0,
			vth,
			k,
			id: "q"
		}
	] : [
		{
			kind: "V",
			n1: 3,
			n2: 0,
			value: Vg
		},
		{
			kind: "V",
			n1: 2,
			n2: 0,
			value: Vd
		},
		{
			kind: "M",
			n1: 2,
			n2: 0,
			n3: 3,
			value: 0,
			vth,
			k,
			id: "q"
		}
	]);
	const Id = Math.abs(sol.current["q"] ?? 0) * 1e3;
	const subFill = pmos ? N_FILL : P_FILL, wellFill = pmos ? P_FILL : N_FILL;
	const wellStroke = pmos ? HOLE : ELEC, chanColor = pmos ? HOLE : ELEC;
	const subLabel = pmos ? "n-type substrate (electrons, −)" : "p-type substrate (holes, +)";
	const wellType = pmos ? "p+" : "n+";
	const carrierWord = pmos ? "holes" : "electrons";
	const chanWord = pmos ? "p-channel" : "n-channel";
	const wcT = pmos ? "h" : "e";
	const scT = pmos ? "e" : "h";
	const on = Vg >= vth && Id > .02;
	const inv = Math.max(0, Math.min(1, (Vg - vth) / 2.5));
	const depl = Math.max(0, Math.min(1, Vg / vth));
	const deplDepth = depl * 40;
	const DEV_BOT = DEV.y + DEV.h;
	const speed = Math.max(.4, Math.min(2.4, Id / 1.2));
	const nChan = on ? Math.max(2, Math.round(inv * 9)) : 0;
	const colBox = () => ({
		x: CHAN_X0 + 12,
		y: 132 + deplDepth,
		w: CHAN_X1 - CHAN_X0 - 24,
		h: Math.max(8, WELL_BOT - CHAN_Y - 26 - deplDepth)
	});
	const resident = useCarrierSim(() => {
		const wL = {
			x: SRC_X + 8,
			y: 122,
			w: WELL_W - 16,
			h: WELL_BOT - WELL_TOP - 40
		};
		const wR = {
			x: DRN_X + 8,
			y: 122,
			w: WELL_W - 16,
			h: WELL_BOT - WELL_TOP - 40
		};
		const sb = {
			x: DEV.x + 16,
			y: 256,
			w: DEV.w - 32,
			h: DEV_BOT - WELL_BOT - 16
		};
		const col = colBox();
		const out = [];
		for (let i = 0; i < 7; i++) out.push({
			id: i,
			t: wcT,
			o: 1,
			box: wL,
			...sited(wL, i * 7 + 1)
		});
		for (let i = 0; i < 7; i++) out.push({
			id: 10 + i,
			t: wcT,
			o: 1,
			box: wR,
			...sited(wR, i * 7 + 3)
		});
		for (let i = 0; i < 7; i++) out.push({
			id: 20 + i,
			t: scT,
			o: 1,
			box: sb,
			...sited(sb, i * 7 + 5)
		});
		for (let i = 0; i < 4; i++) out.push({
			id: 30 + i,
			t: scT,
			o: 1,
			box: col,
			...sited(col, i * 7 + 9)
		});
		return out;
	}, (cs, step) => {
		const col = colBox();
		return stepCarriers(cs.map((c) => c.id >= 30 && c.id < 40 ? {
			...c,
			box: col,
			hy: Math.max(col.y + 4, Math.min(col.y + col.h - 4, c.hy ?? col.y + col.h / 2))
		} : c), step, {
			x: DEV.x,
			y: DEV.y,
			w: DEV.w,
			h: DEV.h
		}, {
			jitter: .9,
			speed: .7,
			damp: .85,
			spring: .05
		});
	}, true, `${pmos}`);
	const MAX_CHAN = 9;
	const chanBox = {
		x: CHAN_X0 + 4,
		y: CHAN_Y - 5,
		w: CHAN_X1 - CHAN_X0 - 8,
		h: 12
	};
	const channel = useCarrierSim(() => Array.from({ length: MAX_CHAN }, (_, i) => ({
		id: 200 + i,
		t: wcT,
		slot: i,
		o: 0,
		box: chanBox,
		...inBox(chanBox, 100 + i)
	})), (cs, step) => tweenOpacity(stepCarriers(cs, step, chanBox, {
		drift: {
			x: .9,
			y: 0
		},
		jitter: .2,
		speed: Math.max(.5, speed),
		signed: false,
		damp: .9
	}), nChan), true, `${pmos}`);
	const scene = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			width: "100%",
			role: "img",
			"aria-label": `${pmos ? "PMOS" : "NMOS"} cross-section, gate drive ${Vg.toFixed(1)} volts, channel ${on ? "formed" : "absent"}`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: DEV.x,
					y: DEV.y,
					width: DEV.w,
					height: DEV.h,
					rx: 10,
					fill: subFill,
					stroke: METAL,
					strokeWidth: 1
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: DEV.x + DEV.w / 2,
					y: 272,
					text: subLabel,
					color: MUTED,
					size: 11,
					weight: 500
				}),
				/* @__PURE__ */ jsx("rect", {
					x: SRC_X,
					y: WELL_TOP,
					width: WELL_W,
					height: WELL_BOT - WELL_TOP,
					rx: 6,
					fill: wellFill,
					stroke: wellStroke,
					strokeWidth: 1.2
				}),
				/* @__PURE__ */ jsx("rect", {
					x: DRN_X,
					y: WELL_TOP,
					width: WELL_W,
					height: WELL_BOT - WELL_TOP,
					rx: 6,
					fill: wellFill,
					stroke: wellStroke,
					strokeWidth: 1.2
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: SRC_X + WELL_W / 2,
					y: WELL_BOT - 8,
					text: `${wellType} source`,
					color: wellStroke,
					size: 11,
					weight: 700
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: DRN_X + WELL_W / 2,
					y: WELL_BOT - 8,
					text: `${wellType} drain`,
					color: wellStroke,
					size: 11,
					weight: 700
				}),
				depl > .02 && !on && /* @__PURE__ */ jsx("rect", {
					x: GATE_X0,
					y: CHAN_Y,
					width: GATE_X1 - GATE_X0,
					height: 6 + deplDepth,
					fill: "color-mix(in oklab, var(--stage-bg) 70%, transparent)",
					stroke: MUTED,
					strokeWidth: .8,
					strokeDasharray: "3 3"
				}),
				inv > .02 && /* @__PURE__ */ jsx("rect", {
					x: CHAN_X0,
					y: CHAN_Y - 4,
					width: CHAN_X1 - CHAN_X0,
					height: 10,
					rx: 3,
					fill: `color-mix(in oklab, ${chanColor} ${Math.round(20 + inv * 50)}%, transparent)`
				}),
				/* @__PURE__ */ jsx("rect", {
					x: GATE_X0,
					y: OX_Y,
					width: GATE_X1 - GATE_X0,
					height: OX_H,
					fill: OXIDE,
					stroke: METAL,
					strokeWidth: .6
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: GATE_X1 + 6,
					y: 106,
					text: "oxide",
					color: MUTED,
					size: 9.5,
					weight: 500,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx("rect", {
					x: GATE_X0,
					y: GATE_Y,
					width: GATE_X1 - GATE_X0,
					height: GATE_H,
					rx: 2,
					fill: METAL
				}),
				/* @__PURE__ */ jsx(Lead, {
					x: SRC_X + WELL_W / 2,
					y1: WELL_TOP,
					y2: DEV.y - 16,
					label: "S",
					sub: pmos ? `${VDD} V` : "0 V",
					color: MUTED
				}),
				/* @__PURE__ */ jsx(Lead, {
					x: DRN_X + WELL_W / 2,
					y1: WELL_TOP,
					y2: DEV.y - 16,
					label: "D",
					sub: `${(pmos ? VDD - Vd : Vd).toFixed(1)} V`,
					color: on ? wellStroke : MUTED
				}),
				/* @__PURE__ */ jsx(Lead, {
					x: (GATE_X0 + GATE_X1) / 2,
					y1: GATE_Y,
					y2: DEV.y - 16,
					label: "G",
					sub: `${(pmos ? VDD - Vg : Vg).toFixed(1)} V`,
					color: on ? "var(--stage-good)" : wellStroke
				}),
				renderCarriers(resident),
				renderCarriers(channel)
			]
		})
	});
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
		label: pmos ? "source-gate drive" : "gate voltage Vg",
		value: `${Vg.toFixed(1)} V`,
		children: /* @__PURE__ */ jsx(Slider, {
			value: Vg,
			min: 0,
			max: 5,
			step: .1,
			onChange: setVg,
			ariaLabel: "gate drive"
		})
	}), /* @__PURE__ */ jsx(Field, {
		label: pmos ? "source-drain drive" : "drain voltage Vd",
		value: `${Vd.toFixed(1)} V`,
		children: /* @__PURE__ */ jsx(Slider, {
			value: Vd,
			min: 0,
			max: 5,
			step: .1,
			onChange: setVd,
			ariaLabel: "drain drive"
		})
	})] });
	const stage = !inv ? "off" : !on ? "depleting" : "on";
	const aside = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: 10
		},
		children: [/* @__PURE__ */ jsx("div", {
			className: "lab-pill",
			"data-state": on ? "ok" : "no",
			role: "status",
			style: { alignSelf: "flex-start" },
			children: stage === "off" ? "✗ gate not yet past threshold, no channel" : stage === "depleting" ? "… depletion only, still no path" : `✓ channel formed, ${carrierWord} drift S→D`
		}), /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					display: "grid",
					gap: 6,
					fontVariantNumeric: "tabular-nums",
					fontSize: 13
				},
				children: [
					/* @__PURE__ */ jsxs("span", { children: [
						"gate drive = ",
						/* @__PURE__ */ jsxs("strong", { children: [Vg.toFixed(1), " V"] }),
						" (threshold V",
						/* @__PURE__ */ jsx("sub", { children: "th" }),
						" = ",
						vth,
						" V)"
					] }),
					/* @__PURE__ */ jsxs("span", { children: [
						"drain current I",
						/* @__PURE__ */ jsx("sub", { children: "d" }),
						" = ",
						/* @__PURE__ */ jsx("strong", { children: Math.abs(Id) < .01 ? "≈ 0" : Id.toFixed(2) + " mA" })
					] }),
					/* @__PURE__ */ jsx("span", {
						style: { color: MUTED },
						children: on ? `past threshold the surface inverts: a ${chanWord} of ${carrierWord} bridges source and drain` : `below threshold the gate only opens a depletion region: the ${wellType} wells stay isolated`
					})
				]
			})
		})]
	});
	useCheckpoint({
		solved: on,
		activity: `semiconductor:${activity}`
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls,
		aside,
		footer: ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : void 0,
		children: scene
	});
}
const PJ = {
	x: 44,
	y: 96,
	w: 472,
	h: 150,
	junc: 280
};
const PJ_BOT = PJ.y + PJ.h;
/** A fixed (immobile) ionised dopant core left behind in the depletion region. */
function Ion({ x, y, sign }) {
	const col = sign === "+" ? ELEC : HOLE;
	const cx = px(x), cy = px(y);
	return /* @__PURE__ */ jsxs("g", {
		style: { pointerEvents: "none" },
		children: [/* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r: 6,
			fill: "none",
			stroke: col,
			strokeWidth: 1,
			strokeDasharray: "2 1.5"
		}), /* @__PURE__ */ jsx("text", {
			x: cx,
			y: cy,
			fill: col,
			fontSize: 9,
			fontWeight: 700,
			textAnchor: "middle",
			dominantBaseline: "central",
			children: sign
		})]
	});
}
function PnJunctionLab({ title = "Inside the diode: the PN junction", prompt = "An n-region (free electrons) meets a p-region (free holes). Where they touch, carriers recombine and leave a depletion region of fixed ions with a built-in field. Bias it: forward narrows the barrier and current floods across; reverse widens it and it blocks.", ask, activity = "pn-junction" } = {}) {
	const [bias, setBias] = useState(0);
	const Id = (solveDC([
		{
			kind: "V",
			n1: 1,
			n2: 0,
			value: bias
		},
		{
			kind: "R",
			n1: 1,
			n2: 2,
			value: 40
		},
		{
			kind: "D",
			n1: 2,
			n2: 0,
			value: 0,
			id: "d"
		}
	]).current["d"] ?? 0) * 1e3;
	const forward = bias > .05 && Id > .2;
	const reverse = bias < -.02;
	const w = Math.max(7, 24 - (forward ? Math.min(15, Id / 6) : 0) + (reverse ? Math.min(40, -bias * 16) : 0));
	const dL = PJ.junc - w, dR = PJ.junc + w;
	const speed = Math.max(.5, Math.min(2.2, Id / 12));
	const bounds = {
		x: PJ.x,
		y: PJ.y,
		w: PJ.w,
		h: PJ.h
	};
	const nBox = (right) => ({
		x: PJ.x + 8,
		y: PJ.y + 10,
		w: Math.max(10, right - PJ.x - 12),
		h: PJ.h - 20
	});
	const pBox = (left) => ({
		x: left + 4,
		y: PJ.y + 10,
		w: Math.max(10, PJ.x + PJ.w - left - 12),
		h: PJ.h - 20
	});
	const nHome = {
		x: PJ.x + 12,
		y: PJ.y + 12,
		w: PJ.junc - 70 - (PJ.x + 12),
		h: PJ.h - 24
	};
	const pHome = {
		x: PJ.junc + 70,
		y: PJ.y + 12,
		w: PJ.x + PJ.w - (PJ.junc + 70) - 12,
		h: PJ.h - 24
	};
	const carriers = useCarrierSim(() => {
		const out = [];
		for (let i = 0; i < 10; i++) out.push({
			id: i,
			t: "e",
			...sited(nHome, i * 5 + 1)
		});
		for (let i = 0; i < 10; i++) out.push({
			id: 100 + i,
			t: "h",
			...sited(pHome, i * 5 + 3)
		});
		return out;
	}, (cs, step) => {
		const eBox = nBox(forward ? PJ.junc + 10 : dL);
		const hBox = pBox(forward ? PJ.junc - 10 : dR);
		const boxed = cs.map((c) => ({
			...c,
			box: c.t === "e" ? eBox : hBox
		}));
		if (forward) return recombine(stepCarriers(boxed, step, bounds, {
			drift: {
				x: .9,
				y: 0
			},
			jitter: .45,
			speed,
			damp: .9
		}), 12, step, (c) => c.t === "e" ? sited(nHome, c.id * 7 + step) : sited(pHome, c.id * 7 + step));
		return stepCarriers(boxed, step, bounds, {
			jitter: .7,
			speed: .7,
			damp: .85,
			spring: .05
		});
	}, true, "pn");
	const ions = [];
	for (let i = 0; i < 5; i++) {
		const y = PJ.y + 26 + i * (PJ.h - 40) / 4;
		if (dL - 14 > PJ.x) ions.push(/* @__PURE__ */ jsx(Ion, {
			x: (PJ.x + dL) / 2 + (hash(i, 7) - .5) * (dL - PJ.x - 20),
			y,
			sign: "+"
		}, `in${i}`));
		if (dR + 14 < PJ.x + PJ.w) ions.push(/* @__PURE__ */ jsx(Ion, {
			x: (dR + PJ.x + PJ.w) / 2 + (hash(i, 8) - .5) * (PJ.x + PJ.w - dR - 20),
			y,
			sign: "−"
		}, `ip${i}`));
	}
	const scene = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} 300`,
			width: "100%",
			role: "img",
			"aria-label": `PN junction, ${forward ? "forward biased, conducting" : reverse ? "reverse biased, blocking" : "unbiased"}`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: PJ.x,
					y: PJ.y,
					width: PJ.junc - PJ.x,
					height: PJ.h,
					fill: N_FILL,
					stroke: ELEC,
					strokeWidth: 1
				}),
				/* @__PURE__ */ jsx("rect", {
					x: PJ.junc,
					y: PJ.y,
					width: PJ.x + PJ.w - PJ.junc,
					height: PJ.h,
					fill: P_FILL,
					stroke: HOLE,
					strokeWidth: 1
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: (PJ.x + dL) / 2,
					y: PJ.y - 8,
					text: "n-type (electrons −)",
					color: ELEC,
					size: 12,
					weight: 700
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: (dR + PJ.x + PJ.w) / 2,
					y: PJ.y - 8,
					text: "p-type (holes +)",
					color: HOLE,
					size: 12,
					weight: 700
				}),
				/* @__PURE__ */ jsx("rect", {
					x: dL,
					y: PJ.y,
					width: 2 * w,
					height: PJ.h,
					fill: "color-mix(in oklab, var(--stage-bg) 66%, transparent)",
					stroke: "var(--stage-muted)",
					strokeWidth: .8,
					strokeDasharray: "3 3"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: PJ.junc,
					y: PJ_BOT + 16,
					text: "depletion region (fixed ions, built-in field)",
					color: MUTED,
					size: 10,
					weight: 500
				}),
				w > 9 && /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
					x1: dL + 4,
					y1: PJ.y + PJ.h / 2,
					x2: dR - 4,
					y2: PJ.y + PJ.h / 2,
					stroke: "var(--stage-muted)",
					strokeWidth: 1.4,
					markerEnd: "url(#stage-arrow)"
				}), /* @__PURE__ */ jsx(Tag, {
					x: PJ.junc,
					y: PJ.y + PJ.h / 2 - 6,
					text: "E",
					color: MUTED,
					size: 9,
					weight: 500
				})] }),
				ions,
				renderCarriers(carriers)
			]
		})
	});
	const controls = /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
		label: "bias voltage",
		value: `${bias.toFixed(2)} V`,
		children: /* @__PURE__ */ jsx(Slider, {
			value: bias,
			min: -3,
			max: .9,
			step: .05,
			onChange: setBias,
			ariaLabel: "bias voltage"
		})
	}) });
	const aside = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: 10
		},
		children: [/* @__PURE__ */ jsx("div", {
			className: "lab-pill",
			"data-state": forward ? "ok" : "no",
			role: "status",
			style: { alignSelf: "flex-start" },
			children: forward ? "✓ forward: barrier thin, carriers flood across" : reverse ? "✗ reverse: barrier wide, it blocks" : "— no bias: equilibrium barrier"
		}), /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					display: "grid",
					gap: 6,
					fontVariantNumeric: "tabular-nums",
					fontSize: 13
				},
				children: [
					/* @__PURE__ */ jsxs("span", { children: ["bias = ", /* @__PURE__ */ jsxs("strong", { children: [bias.toFixed(2), " V"] })] }),
					/* @__PURE__ */ jsxs("span", { children: ["diode current = ", /* @__PURE__ */ jsx("strong", { children: Math.abs(Id) < .05 ? "≈ 0" : Id.toFixed(1) + " mA" })] }),
					/* @__PURE__ */ jsx("span", {
						style: { color: MUTED },
						children: forward ? "past ~0.6 V the barrier collapses: electrons and holes pour across and recombine" : "the depletion region is a carrier-free barrier; reverse bias only widens it"
					})
				]
			})
		})]
	});
	useCheckpoint({
		solved: forward,
		activity: `semiconductor:${activity}`
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls,
		aside,
		footer: ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : void 0,
		children: scene
	});
}
const LAT = {
	x0: 96,
	y0: 96,
	dx: 116,
	dy: 78,
	cols: 4,
	rows: 3
};
const atomAt = (c, r) => ({
	x: LAT.x0 + c * LAT.dx,
	y: LAT.y0 + r * LAT.dy
});
const DOPE_C = 2, DOPE_R = 1;
const C_DONOR = "var(--stage-good, oklch(0.7 0.15 150))";
const C_ACCEPTOR = "var(--stage-warn, oklch(0.78 0.15 75))";
function SiAtom({ x, y, label, fill, stroke }) {
	return /* @__PURE__ */ jsxs("g", {
		style: { pointerEvents: "none" },
		children: [/* @__PURE__ */ jsx("circle", {
			cx: px(x),
			cy: px(y),
			r: 17,
			fill,
			stroke,
			strokeWidth: 1.5
		}), /* @__PURE__ */ jsx("text", {
			x: px(x),
			y: px(y),
			fill: stroke,
			fontSize: 11,
			fontWeight: 700,
			textAnchor: "middle",
			dominantBaseline: "central",
			children: label
		})]
	});
}
/** the shared electron pair on a covalent bond (two small dots offset across the bond). */
function Bond({ a, b, broken }) {
	const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
	const horiz = Math.abs(b.x - a.x) > Math.abs(b.y - a.y);
	const ox = horiz ? 0 : 4, oy = horiz ? 4 : 0;
	const dot = "var(--stage-muted)";
	return /* @__PURE__ */ jsxs("g", {
		style: { pointerEvents: "none" },
		children: [
			/* @__PURE__ */ jsx("line", {
				x1: px(a.x),
				y1: px(a.y),
				x2: px(b.x),
				y2: px(b.y),
				stroke: "var(--stage-grid)",
				strokeWidth: 1.4
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: px(mx - ox),
				cy: px(my - oy),
				r: 2.6,
				fill: dot
			}),
			!broken && /* @__PURE__ */ jsx("circle", {
				cx: px(mx + ox),
				cy: px(my + oy),
				r: 2.6,
				fill: dot
			})
		]
	});
}
function SiliconLatticeLab({ mode: mode0 = "intrinsic", temperature: temp0 = .2, lockDoping = false, showTemperature = true, title = "What is a semiconductor? Silicon and doping", prompt = "Pure silicon: every atom shares its four outer electrons in covalent bonds, so almost none are free, a poor conductor. Dope it: a donor atom brings a spare electron (n-type), an acceptor leaves a hole (p-type). Those carriers are what carry current. Heat also frees pairs.", ask, activity = "silicon-lattice" } = {}) {
	const [mode, setMode] = useState(mode0);
	const [temp, setTemp] = useState(temp0);
	const nPairs = Math.round(temp * 4);
	const dopeAtom = atomAt(DOPE_C, DOPE_R);
	const dopeRight = atomAt(3, DOPE_R);
	const elecStart = {
		x: dopeAtom.x + 22,
		y: dopeAtom.y - 26
	};
	const holeStart = {
		x: (dopeAtom.x + dopeRight.x) / 2,
		y: dopeAtom.y
	};
	const LAT_BOUNDS = {
		x: LAT.x0 - 26,
		y: LAT.y0 - 4,
		w: (LAT.cols - 1) * LAT.dx + 52,
		h: (LAT.rows - 1) * LAT.dy + 30
	};
	const MAX_PAIRS = 4;
	const carriers = useCarrierSim(() => {
		const out = [];
		if (mode === "n") out.push({
			id: 0,
			t: "e",
			o: 1,
			x: elecStart.x,
			y: elecStart.y,
			hx: elecStart.x,
			hy: elecStart.y
		});
		if (mode === "p") out.push({
			id: 1,
			t: "h",
			o: 1,
			x: holeStart.x,
			y: holeStart.y,
			hx: holeStart.x,
			hy: holeStart.y
		});
		for (let i = 0; i < MAX_PAIRS; i++) {
			out.push({
				id: 10 + i,
				t: "e",
				slot: i,
				o: 0,
				...sited(LAT_BOUNDS, 70 + i)
			});
			out.push({
				id: 30 + i,
				t: "h",
				slot: i,
				o: 0,
				...sited(LAT_BOUNDS, 90 + i)
			});
		}
		return out;
	}, (cs, step) => tweenOpacity(stepCarriers(cs, step, LAT_BOUNDS, {
		jitter: 1.3,
		speed: .85,
		damp: .85,
		spring: .05
	}), nPairs), true, `${mode}`);
	const atoms = [];
	const bonds = [];
	for (let r = 0; r < LAT.rows; r++) for (let c = 0; c < LAT.cols; c++) {
		const p = atomAt(c, r);
		const isDope = mode !== "intrinsic" && c === DOPE_C && r === DOPE_R;
		const fill = isDope ? mode === "n" ? `color-mix(in oklab, ${C_DONOR} 22%, var(--stage-bg))` : `color-mix(in oklab, ${C_ACCEPTOR} 24%, var(--stage-bg))` : "color-mix(in oklab, var(--stage-semi-n, oklch(0.62 0.18 250)) 14%, var(--stage-bg))";
		const stroke = isDope ? mode === "n" ? C_DONOR : C_ACCEPTOR : ELEC;
		atoms.push(/* @__PURE__ */ jsx(SiAtom, {
			x: p.x,
			y: p.y,
			label: isDope ? mode === "n" ? "+5" : "+3" : "+4",
			fill,
			stroke
		}, `a${c}-${r}`));
		if (c < LAT.cols - 1) {
			const q = atomAt(c + 1, r);
			const acc = mode === "p" && c === DOPE_C && r === DOPE_R;
			bonds.push(/* @__PURE__ */ jsx(Bond, {
				a: p,
				b: q,
				broken: acc
			}, `bh${c}-${r}`));
		}
		if (r < LAT.rows - 1) bonds.push(/* @__PURE__ */ jsx(Bond, {
			a: p,
			b: atomAt(c, r + 1)
		}, `bv${c}-${r}`));
	}
	const scene = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} 320`,
			width: "100%",
			role: "img",
			"aria-label": `silicon lattice, ${mode === "intrinsic" ? "pure" : mode === "n" ? "n-type doped" : "p-type doped"}`,
			children: [
				bonds,
				atoms,
				renderCarriers(carriers)
			]
		})
	});
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [!lockDoping && /* @__PURE__ */ jsx(Field, {
		label: "doping",
		children: /* @__PURE__ */ jsx("div", {
			style: {
				display: "flex",
				gap: 6
			},
			children: [
				"intrinsic",
				"n",
				"p"
			].map((m) => /* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => setMode(m),
				className: "lab-chip",
				"data-active": mode === m,
				style: {
					padding: "5px 10px",
					fontSize: 12,
					fontWeight: 600,
					borderRadius: 8,
					cursor: "pointer",
					border: "1px solid var(--stage-grid)",
					background: mode === m ? "var(--stage-accent)" : "transparent",
					color: mode === m ? "var(--stage-bg)" : "var(--stage-fg)"
				},
				children: m === "intrinsic" ? "pure Si" : m === "n" ? "n-type (donor)" : "p-type (acceptor)"
			}, m))
		})
	}), showTemperature && /* @__PURE__ */ jsx(Field, {
		label: "temperature",
		value: temp < .33 ? "cool" : temp < .66 ? "warm" : "hot",
		children: /* @__PURE__ */ jsx(Slider, {
			value: temp,
			min: 0,
			max: 1,
			step: .05,
			onChange: setTemp,
			ariaLabel: "temperature"
		})
	})] });
	const aside = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: 10
		},
		children: [/* @__PURE__ */ jsx("div", {
			className: "lab-pill",
			"data-state": mode === "intrinsic" && nPairs === 0 ? "no" : "ok",
			role: "status",
			style: { alignSelf: "flex-start" },
			children: mode === "intrinsic" ? nPairs > 0 ? "~ weak intrinsic conduction (heat frees pairs)" : "✗ pure Si: bonds full, poor conductor" : mode === "n" ? "✓ n-type: spare electrons carry current" : "✓ p-type: holes carry current"
		}), /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					display: "grid",
					gap: 6,
					fontSize: 13
				},
				children: [/* @__PURE__ */ jsxs("span", { children: ["majority carriers: ", /* @__PURE__ */ jsx("strong", { children: mode === "n" ? "free electrons (−)" : mode === "p" ? "holes (+)" : nPairs > 0 ? "thermal electron–hole pairs" : "almost none" })] }), /* @__PURE__ */ jsx("span", {
					style: { color: MUTED },
					children: mode === "intrinsic" ? "each Si (+4) shares 4 electrons in bonds, so few are free; heating breaks bonds and frees pairs" : mode === "n" ? "the donor (+5) has one electron too many for the bonds: it roams free and carries charge" : "the acceptor (+3) is one electron short, leaving a hole in a bond that moves like a positive carrier"
				})]
			})
		})]
	});
	useCheckpoint({
		solved: mode === "intrinsic" ? nPairs > 0 : true,
		activity: `semiconductor:${activity}:${mode}`
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls,
		aside,
		footer: ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : void 0,
		children: scene
	});
}
const CD = {
	x: 70,
	y: 100,
	w: 420,
	h: 120
};
const CD_MID = CD.y + CD.h / 2;
function ConductionLab({ title = "Why current flows: electrons drifting in a field", prompt = "A conductor is a sea of free electrons in fixed positive ion cores. With no voltage they only jiggle thermally, fast but going nowhere, so no current. Apply a voltage and the field gives every electron a slow DRIFT on top of that jiggle: that net drift is the current. Double the voltage, double the field, double the drift: current ∝ voltage is Ohm's law, from the inside.", ask, activity = "conduction" } = {}) {
	const [volts, setVolts] = useState(0);
	const I = volts / 50 * 1e3;
	const E = volts / 1;
	const flowing = volts > .02;
	const vDriftPx = .34 * E;
	const barBox = {
		x: CD.x + 10,
		y: CD.y + 12,
		w: CD.w - 20,
		h: CD.h - 24
	};
	const electrons = useCarrierSim(() => Array.from({ length: 14 }, (_, i) => ({
		id: i,
		t: "e",
		o: 1,
		box: barBox,
		...sited(barBox, i * 7 + 1)
	})), (cs, step) => {
		return stepCarriers(cs.map((c) => {
			let hx = (c.hx ?? c.x) + vDriftPx;
			let x = c.x;
			if (hx > barBox.x + barBox.w - 4) {
				hx = barBox.x + 4;
				x = hx;
			}
			return {
				...c,
				hx,
				x
			};
		}), step, barBox, {
			jitter: 1.1,
			speed: .9,
			damp: .82,
			spring: .06
		});
	}, true, "conduction");
	const ions = [];
	for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) ions.push(/* @__PURE__ */ jsx(Ion, {
		x: CD.x + 44 + c * 66,
		y: CD.y + 30 + r * 30,
		sign: "+"
	}, `ion${r}-${c}`));
	const scene = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} 300`,
			width: "100%",
			role: "img",
			"aria-label": `conductor, ${flowing ? "voltage applied, electrons drift, current flows" : "no voltage, no current"}`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: CD.x,
					y: CD.y,
					width: CD.w,
					height: CD.h,
					rx: 8,
					fill: "color-mix(in oklab, var(--stage-metal) 16%, var(--stage-bg))",
					stroke: "var(--stage-metal)",
					strokeWidth: 1
				}),
				/* @__PURE__ */ jsx(Lead, {
					x: CD.x,
					y1: CD_MID,
					y2: CD.y - 18,
					label: "−",
					sub: "0 V",
					color: MUTED
				}),
				/* @__PURE__ */ jsx(Lead, {
					x: CD.x + CD.w,
					y1: CD_MID,
					y2: CD.y - 18,
					label: "+",
					sub: `${volts.toFixed(1)} V`,
					color: flowing ? "var(--stage-good)" : MUTED
				}),
				flowing && /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
					x1: CD.x + CD.w / 2 + 30,
					y1: CD.y - 6,
					x2: CD.x + CD.w / 2 - 30,
					y2: CD.y - 6,
					stroke: "var(--stage-muted)",
					strokeWidth: 1.4,
					markerEnd: "url(#stage-arrow)"
				}), /* @__PURE__ */ jsx(Tag, {
					x: CD.x + CD.w / 2,
					y: CD.y - 12,
					text: "field E",
					color: MUTED,
					size: 10,
					weight: 500
				})] }),
				/* @__PURE__ */ jsx(Tag, {
					x: CD.x + CD.w / 2,
					y: CD.y + CD.h + 18,
					text: "conductor: free electrons (−) in fixed + ion cores",
					color: MUTED,
					size: 11,
					weight: 500
				}),
				ions,
				renderCarriers(electrons)
			]
		})
	});
	const controls = /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
		label: "applied voltage",
		value: `${volts.toFixed(1)} V`,
		children: /* @__PURE__ */ jsx(Slider, {
			value: volts,
			min: 0,
			max: 5,
			step: .1,
			onChange: setVolts,
			ariaLabel: "applied voltage"
		})
	}) });
	const aside = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: 10
		},
		children: [/* @__PURE__ */ jsx("div", {
			className: "lab-pill",
			"data-state": flowing ? "ok" : "no",
			role: "status",
			style: { alignSelf: "flex-start" },
			children: flowing ? "✓ electrons drift → current flows" : "✗ no field: electrons jiggle, no net flow"
		}), /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					display: "grid",
					gap: 6,
					fontVariantNumeric: "tabular-nums",
					fontSize: 13
				},
				children: [
					/* @__PURE__ */ jsxs("span", { children: [
						"field E = V/L = ",
						/* @__PURE__ */ jsx("strong", { children: E.toFixed(1) }),
						" (∝ voltage)"
					] }),
					/* @__PURE__ */ jsxs("span", { children: [
						"drift velocity v = μE = ",
						/* @__PURE__ */ jsx("strong", { children: vDriftPx.toFixed(2) }),
						" (a slow bias on fast jiggle)"
					] }),
					/* @__PURE__ */ jsxs("span", { children: ["current I = V/R = ", /* @__PURE__ */ jsx("strong", { children: I < .05 ? "≈ 0" : I.toFixed(1) + " mA" })] }),
					/* @__PURE__ */ jsx("span", {
						style: { color: MUTED },
						children: "current ∝ voltage: that proportionality IS Ohm's law. Collisions with the ion cores limit the drift, that is the resistance R."
					})
				]
			})
		})]
	});
	useCheckpoint({
		solved: flowing,
		activity: `semiconductor:${activity}`
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls,
		aside,
		footer: ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : void 0,
		children: scene
	});
}
const HB = {
	x: 80,
	y: 100,
	w: 400,
	h: 128
};
const HB_MID = HB.y + HB.h / 2;
function HallEffectLab({ title = "The Hall effect: are the carriers electrons or holes?", prompt = "Push a current through a strip in a magnetic field. The field bends the moving carriers sideways, so charge piles up on one edge until a transverse Hall voltage builds. Electrons and holes carrying the SAME current bend to the same edge, but leave OPPOSITE charge there, so the Hall voltage's sign tells you which carrier a material has. This is how carrier type is actually measured.", ask, activity = "hall-effect" } = {}) {
	const [holes, setHoles] = useState(false);
	const [bField, setBField] = useState(.6);
	const reduceB = Math.abs(bField) < .05;
	const VH = bField * (holes ? 1 : -1);
	const carrierT = holes ? "h" : "e";
	const topEdge = bField >= 0;
	const box = {
		x: HB.x + 8,
		y: HB.y + 10,
		w: HB.w - 16,
		h: HB.h - 20
	};
	const carriers = useCarrierSim(() => Array.from({ length: 16 }, (_, i) => ({
		id: i,
		t: carrierT,
		o: 1,
		box,
		...sited(box, i * 7 + 1)
	})), (cs, step) => {
		const driftX = (holes ? 1 : -1) * 1.1;
		const edgeY = topEdge ? box.y + 14 : box.y + box.h - 14;
		const defl = Math.min(.85, Math.abs(bField));
		return stepCarriers(cs.map((c) => {
			let hx = (c.hx ?? c.x) + driftX;
			if (hx > box.x + box.w - 4) hx = box.x + 4;
			if (hx < box.x + 4) hx = box.x + box.w - 4;
			const hy = inBox(box, c.id * 7 + 1).y + (edgeY - (box.y + box.h / 2)) * defl;
			return {
				...c,
				hx,
				hy
			};
		}), step, box, {
			jitter: .9,
			speed: .9,
			damp: .82,
			spring: .06
		});
	}, true, `${holes}`);
	const bSyms = [];
	for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
		const x = HB.x + 34 + c * 56, y = HB.y + 26 + r * 38;
		bSyms.push(bField >= 0 ? /* @__PURE__ */ jsxs("g", {
			style: { pointerEvents: "none" },
			opacity: reduceB ? .12 : .3,
			children: [/* @__PURE__ */ jsx("line", {
				x1: x - 3,
				y1: y - 3,
				x2: x + 3,
				y2: y + 3,
				stroke: "var(--stage-muted)",
				strokeWidth: 1
			}), /* @__PURE__ */ jsx("line", {
				x1: x - 3,
				y1: y + 3,
				x2: x + 3,
				y2: y - 3,
				stroke: "var(--stage-muted)",
				strokeWidth: 1
			})]
		}, `b${r}-${c}`) : /* @__PURE__ */ jsx("circle", {
			cx: x,
			cy: y,
			r: 1.6,
			fill: "var(--stage-muted)",
			opacity: .3
		}, `b${r}-${c}`));
	}
	const edgeCharge = (top) => {
		if (reduceB) return null;
		const sign = top === topEdge ? holes ? "+" : "−" : holes ? "−" : "+";
		const col = sign === "+" ? HOLE : ELEC;
		const y = top ? HB.y - 4 : HB.y + HB.h + 12;
		return /* @__PURE__ */ jsx(Tag, {
			x: HB.x + HB.w / 2,
			y,
			text: `${sign} ${sign} ${sign} ${sign} ${sign}`,
			color: col,
			size: 13,
			weight: 700
		});
	};
	const scene = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} 300`,
			width: "100%",
			role: "img",
			"aria-label": `Hall bar, ${holes ? "holes" : "electrons"}, field ${bField >= 0 ? "into" : "out of"} page`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: HB.x,
					y: HB.y,
					width: HB.w,
					height: HB.h,
					rx: 8,
					fill: "color-mix(in oklab, var(--stage-metal) 12%, var(--stage-bg))",
					stroke: "var(--stage-metal)",
					strokeWidth: 1
				}),
				bSyms,
				/* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
					x1: HB.x - 36,
					y1: HB_MID,
					x2: HB.x - 6,
					y2: HB_MID,
					stroke: "var(--stage-good)",
					strokeWidth: 2,
					markerEnd: "url(#stage-arrow)"
				}), /* @__PURE__ */ jsx(Tag, {
					x: HB.x - 40,
					y: HB_MID - 6,
					text: "I",
					color: "var(--stage-good)",
					size: 11,
					weight: 700,
					anchor: "end"
				})] }),
				/* @__PURE__ */ jsx("line", {
					x1: HB.x + HB.w + 6,
					y1: HB_MID,
					x2: HB.x + HB.w + 30,
					y2: HB_MID,
					stroke: "var(--stage-good)",
					strokeWidth: 2,
					markerEnd: "url(#stage-arrow)"
				}),
				edgeCharge(true),
				edgeCharge(false),
				/* @__PURE__ */ jsx(Tag, {
					x: HB.x + HB.w / 2,
					y: HB.y + HB.h + 28,
					text: `B field ${bField >= 0 ? "into the page (×)" : "out of the page (•)"} · carriers: ${holes ? "holes (+)" : "electrons (−)"}`,
					color: MUTED,
					size: 10.5,
					weight: 500
				}),
				renderCarriers(carriers)
			]
		})
	});
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
		label: "carrier type",
		children: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				gap: 6
			},
			children: [/* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => setHoles(false),
				style: {
					padding: "5px 10px",
					fontSize: 12,
					fontWeight: 600,
					borderRadius: 8,
					cursor: "pointer",
					border: "1px solid var(--stage-grid)",
					background: !holes ? "var(--stage-accent)" : "transparent",
					color: !holes ? "var(--stage-bg)" : "var(--stage-fg)"
				},
				children: "electrons (n)"
			}), /* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => setHoles(true),
				style: {
					padding: "5px 10px",
					fontSize: 12,
					fontWeight: 600,
					borderRadius: 8,
					cursor: "pointer",
					border: "1px solid var(--stage-grid)",
					background: holes ? "var(--stage-accent)" : "transparent",
					color: holes ? "var(--stage-bg)" : "var(--stage-fg)"
				},
				children: "holes (p)"
			})]
		})
	}), /* @__PURE__ */ jsx(Field, {
		label: "magnetic field",
		value: reduceB ? "off" : bField >= 0 ? "into page" : "out of page",
		children: /* @__PURE__ */ jsx(Slider, {
			value: bField,
			min: -1,
			max: 1,
			step: .05,
			onChange: setBField,
			ariaLabel: "magnetic field"
		})
	})] });
	const aside = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: 10
		},
		children: [/* @__PURE__ */ jsx("div", {
			className: "lab-pill",
			"data-state": reduceB ? "no" : "ok",
			role: "status",
			style: { alignSelf: "flex-start" },
			children: reduceB ? "— no field: carriers go straight, no Hall voltage" : `✓ carriers bend, ${holes ? "holes" : "electrons"} pile on one edge`
		}), /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					display: "grid",
					gap: 6,
					fontVariantNumeric: "tabular-nums",
					fontSize: 13
				},
				children: [/* @__PURE__ */ jsxs("span", { children: [
					"Hall voltage V",
					/* @__PURE__ */ jsx("sub", { children: "H" }),
					" = ",
					/* @__PURE__ */ jsx("strong", { children: reduceB ? "≈ 0" : VH > 0 ? "+ (positive)" : "− (negative)" })
				] }), /* @__PURE__ */ jsxs("span", {
					style: { color: MUTED },
					children: [
						"both carriers bend to the same edge, but electrons leave it negative and holes leave it positive. So V",
						/* @__PURE__ */ jsx("sub", { children: "H" }),
						" < 0 ⇒ ",
						/* @__PURE__ */ jsx("strong", { children: "electrons (n-type)" }),
						"; V",
						/* @__PURE__ */ jsx("sub", { children: "H" }),
						" > 0 ⇒ ",
						/* @__PURE__ */ jsx("strong", { children: "holes (p-type)" }),
						". That sign is how a material's carrier type is measured."
					]
				})]
			})
		})]
	});
	useCheckpoint({
		solved: !reduceB,
		activity: `semiconductor:${activity}`
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls,
		aside,
		footer: ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : void 0,
		children: scene
	});
}
const BJ = {
	y: 100,
	h: 132
};
const BJ_EM = {
	x0: 46,
	x1: 176
};
const BJ_BASE = {
	x0: 176,
	x1: 232
};
const BJ_COL = {
	x0: 232,
	x1: 516
};
const BJ_BOT = BJ.y + BJ.h;
const BJ_MID = BJ.y + BJ.h / 2;
function BjtInsideLab({ pnp = false, beta = 100, title = pnp ? "Inside the PNP: base current steers the rest" : "Inside the NPN: base current steers the rest", prompt = "Forward-bias the base-emitter junction. Carriers pour from the emitter into the THIN base, but only a sliver recombine there (the small base current): the rest are swept across into the collector. A tiny base current controls a much larger collector current.", ask, activity = pnp ? "pnp-bjt" : "npn-bjt" } = {}) {
	const [vbe, setVbe] = useState(0);
	const Ic = Math.min(50, (vbe > 0 ? 2e-14 * (Math.exp(Math.min(vbe / .02585, 40)) - 1) : 0) * 1e3);
	const Ib = Ic / beta;
	const on = Ic > .05;
	const speed = Math.max(.5, Math.min(2.6, Ic / 10));
	const emFill = pnp ? P_FILL : N_FILL, baseFill = pnp ? N_FILL : P_FILL;
	const emStroke = pnp ? HOLE : ELEC, baseStroke = pnp ? ELEC : HOLE;
	const emType = pnp ? "p" : "n", baseType = pnp ? "n" : "p";
	const mT = pnp ? "h" : "e";
	const bT = pnp ? "e" : "h";
	const nStream = on ? Math.max(3, Math.round(3 + Math.min(9, Ic / 4))) : 0;
	const emBox = {
		x: BJ_EM.x0 + 10,
		y: BJ.y + 12,
		w: BJ_EM.x1 - BJ_EM.x0 - 26,
		h: BJ.h - 24
	};
	const colBox = {
		x: BJ_COL.x0 + 20,
		y: BJ.y + 12,
		w: BJ_COL.x1 - BJ_COL.x0 - 40,
		h: BJ.h - 24
	};
	const baseBox = {
		x: BJ_BASE.x0 + 8,
		y: BJ.y + 14,
		w: BJ_BASE.x1 - BJ_BASE.x0 - 16,
		h: BJ.h - 28
	};
	const streamBox = {
		x: BJ_EM.x1 - 26,
		y: BJ_MID - BJ.h * .26,
		w: BJ_COL.x0 + 86 - (BJ_EM.x1 - 26),
		h: BJ.h * .52
	};
	const resident = useCarrierSim(() => {
		const out = [];
		for (let i = 0; i < 5; i++) out.push({
			id: i,
			t: mT,
			o: 1,
			box: emBox,
			...sited(emBox, i * 7 + 1)
		});
		for (let i = 0; i < 7; i++) out.push({
			id: 20 + i,
			t: mT,
			o: 1,
			box: colBox,
			...sited(colBox, i * 7 + 3)
		});
		for (let i = 0; i < 3; i++) out.push({
			id: 40 + i,
			t: bT,
			o: 1,
			box: baseBox,
			...sited(baseBox, i * 7 + 5)
		});
		return out;
	}, (cs, step) => stepCarriers(cs, step, {
		x: BJ_EM.x0,
		y: BJ.y,
		w: BJ_COL.x1 - BJ_EM.x0,
		h: BJ.h
	}, {
		jitter: .85,
		speed: .65,
		damp: .85,
		spring: .05
	}), true, `${pnp}`);
	const MAX_STREAM = 12;
	const stream = useCarrierSim(() => Array.from({ length: MAX_STREAM }, (_, i) => ({
		id: 300 + i,
		t: mT,
		slot: i,
		o: 0,
		box: streamBox,
		...inBox(streamBox, 200 + i)
	})), (cs, step) => {
		return tweenOpacity(stepCarriers(cs, step, streamBox, {
			drift: {
				x: 1,
				y: 0
			},
			jitter: .3,
			speed: Math.max(.6, speed),
			signed: false,
			damp: .9
		}).map((c) => c.x > streamBox.x + streamBox.w - 6 ? {
			...c,
			x: streamBox.x + 4,
			y: streamBox.y + 4 + rand(c.id, step) * (streamBox.h - 8)
		} : c), nStream);
	}, true, `${pnp}`);
	const scene = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} 300`,
			width: "100%",
			role: "img",
			"aria-label": `${pnp ? "PNP" : "NPN"} transistor, ${on ? "forward active, conducting" : "off"}`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: BJ_EM.x0,
					y: BJ.y,
					width: BJ_EM.x1 - BJ_EM.x0,
					height: BJ.h,
					fill: emFill,
					stroke: emStroke,
					strokeWidth: 1
				}),
				/* @__PURE__ */ jsx("rect", {
					x: BJ_BASE.x0,
					y: BJ.y,
					width: BJ_BASE.x1 - BJ_BASE.x0,
					height: BJ.h,
					fill: baseFill,
					stroke: baseStroke,
					strokeWidth: 1
				}),
				/* @__PURE__ */ jsx("rect", {
					x: BJ_COL.x0,
					y: BJ.y,
					width: BJ_COL.x1 - BJ_COL.x0,
					height: BJ.h,
					fill: emFill,
					stroke: emStroke,
					strokeWidth: 1
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: (BJ_EM.x0 + BJ_EM.x1) / 2,
					y: BJ_BOT + 16,
					text: `emitter (${emType})`,
					color: emStroke,
					size: 11,
					weight: 600
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: (BJ_BASE.x0 + BJ_BASE.x1) / 2,
					y: BJ.y - 8,
					text: `base (${baseType}, thin)`,
					color: baseStroke,
					size: 10,
					weight: 700
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: (BJ_COL.x0 + BJ_COL.x1) / 2,
					y: BJ_BOT + 16,
					text: `collector (${emType})`,
					color: emStroke,
					size: 11,
					weight: 600
				}),
				/* @__PURE__ */ jsx(Lead, {
					x: (BJ_EM.x0 + BJ_EM.x1) / 2,
					y1: BJ.y,
					y2: BJ.y - 18,
					label: "E",
					sub: "",
					color: emStroke
				}),
				/* @__PURE__ */ jsx(Lead, {
					x: (BJ_BASE.x0 + BJ_BASE.x1) / 2,
					y1: BJ.y,
					y2: BJ.y - 40,
					label: "B",
					sub: `${vbe.toFixed(2)} V`,
					color: on ? "var(--stage-good)" : baseStroke
				}),
				/* @__PURE__ */ jsx(Lead, {
					x: (BJ_COL.x0 + BJ_COL.x1) / 2,
					y1: BJ.y,
					y2: BJ.y - 18,
					label: "C",
					sub: "",
					color: on ? emStroke : "var(--stage-muted)"
				}),
				renderCarriers(resident),
				renderCarriers(stream)
			]
		})
	});
	const controls = /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
		label: pnp ? "emitter-base drive" : "base-emitter Vbe",
		value: `${vbe.toFixed(2)} V`,
		children: /* @__PURE__ */ jsx(Slider, {
			value: vbe,
			min: 0,
			max: .8,
			step: .01,
			onChange: setVbe,
			ariaLabel: "base emitter voltage"
		})
	}) });
	const aside = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: 10
		},
		children: [/* @__PURE__ */ jsx("div", {
			className: "lab-pill",
			"data-state": on ? "ok" : "no",
			role: "status",
			style: { alignSelf: "flex-start" },
			children: on ? `✓ forward active: ${emType}→base→collector stream` : "✗ off: base junction not yet forward biased"
		}), /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					display: "grid",
					gap: 6,
					fontVariantNumeric: "tabular-nums",
					fontSize: 13
				},
				children: [
					/* @__PURE__ */ jsxs("span", { children: [
						"base current I",
						/* @__PURE__ */ jsx("sub", { children: "B" }),
						" = ",
						/* @__PURE__ */ jsx("strong", { children: Ib < .001 ? "≈ 0" : (Ib * 1e3).toFixed(1) + " µA" })
					] }),
					/* @__PURE__ */ jsxs("span", { children: [
						"collector current I",
						/* @__PURE__ */ jsx("sub", { children: "C" }),
						" = ",
						/* @__PURE__ */ jsx("strong", { children: Ic < .05 ? "≈ 0" : Ic.toFixed(1) + " mA" })
					] }),
					/* @__PURE__ */ jsxs("span", { children: [
						"gain β = I",
						/* @__PURE__ */ jsx("sub", { children: "C" }),
						"/I",
						/* @__PURE__ */ jsx("sub", { children: "B" }),
						" = ",
						/* @__PURE__ */ jsx("strong", { children: beta })
					] }),
					/* @__PURE__ */ jsxs("span", {
						style: { color: MUTED },
						children: [
							"the base is so thin that almost every carrier crosses to the collector: a tiny base current commands a ",
							beta,
							"× larger collector current"
						]
					})
				]
			})
		})]
	});
	useCheckpoint({
		solved: on,
		activity: `semiconductor:${activity}`
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls,
		aside,
		footer: ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : void 0,
		children: scene
	});
}
function Lead({ x, y1, y2, label, sub, color }) {
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx("line", {
			x1: x,
			y1,
			x2: x,
			y2: y2 + 8,
			stroke: "var(--stage-wire)",
			strokeWidth: 2,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: x,
			cy: y2 + 8,
			r: 2.6,
			fill: "var(--stage-metal)"
		}),
		/* @__PURE__ */ jsx(Tag, {
			x,
			y: y2 + 2,
			text: label,
			color,
			size: 12,
			weight: 700
		}),
		sub ? /* @__PURE__ */ jsx(Tag, {
			x,
			y: y2 - 10,
			text: sub,
			color,
			size: 10,
			weight: 500
		}) : null
	] });
}

//#endregion
export { BjtInsideLab, ConductionLab, HallEffectLab, MosfetInsideLab, PnJunctionLab, SiliconLatticeLab };