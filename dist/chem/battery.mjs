'use client';

import { clamp, num } from "../core/util.mjs";
import { Tex as Tex$1 } from "../core/tex.mjs";
import { Slider } from "../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../kit/frame.mjs";
import { ResistorBox } from "../kit/diagram.mjs";
import { PlayWrap, usePlayGate } from "../kit/play.mjs";
import { useEffect, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, Polygon, Segment, Stage, useFrameLoop } from "@classytic/stage";

//#region src/chem/battery.tsx
/**
* Battery, a galvanic (voltaic) cell. Two half-cells: at the anode a metal is
* oxidized and releases electrons; they flow through the external wire to the
* cathode, where ions are reduced. Watch the electrons stream, see the
* half-reactions and the cell EMF.
*
* Now on the @classytic/stage engine (SVG schematic + flowing electrons,
* accessible, themed).
*/
const VIEW = {
	xMin: 0,
	xMax: 100,
	yMin: 0,
	yMax: 60
};
const LX = 26, RX = 74, BBOT = 6, BTOP = 30, ETOP = 44, WIRE = 53;
function rect(cx, halfW, y0, y1) {
	return [
		{
			x: cx - halfW,
			y: y0
		},
		{
			x: cx + halfW,
			y: y0
		},
		{
			x: cx + halfW,
			y: y1
		},
		{
			x: cx - halfW,
			y: y1
		}
	];
}
/** Electron position along the external wire path at fraction u∈[0,1). */
function onWire(u) {
	const pts = [
		{
			x: LX,
			y: ETOP
		},
		{
			x: LX,
			y: WIRE
		},
		{
			x: RX,
			y: WIRE
		},
		{
			x: RX,
			y: ETOP
		}
	];
	const segLen = (p, q) => Math.hypot(q.x - p.x, q.y - p.y);
	let total = 0;
	for (let s = 0; s < 3; s++) total += segLen(pts[s], pts[s + 1]);
	let d = u * total;
	for (let s = 0; s < 3; s++) {
		const p = pts[s], q = pts[s + 1], ln = segLen(p, q);
		if (d <= ln) {
			const k = d / ln;
			return {
				x: p.x + (q.x - p.x) * k,
				y: p.y + (q.y - p.y) * k
			};
		}
		d -= ln;
	}
	return pts[3];
}
function Battery({ emf, title = "Galvanic cell: electrons on the move", height = 320 } = {}) {
	const [E, setE] = useState(clamp(num(emf, 1.1), .1, 5));
	const [load, setLoad] = useState(10);
	const gate = usePlayGate();
	const [t, setT] = useState(0);
	useEffect(() => {
		setE(clamp(num(emf, 1.1), .1, 5));
	}, [emf]);
	const current = E / load;
	useFrameLoop((f) => setT((v) => v + f.dtMs / 1e3), { running: gate.running });
	const N_E = 6;
	const speed = clamp(current * .12, .02, .4);
	const figure = /* @__PURE__ */ jsx(PlayWrap, {
		gate,
		children: /* @__PURE__ */ jsxs(Stage, {
			view: VIEW,
			height,
			preserveAspect: false,
			ariaLabel: `Galvanic cell, ${E.toFixed(2)} V, ${(current * 1e3).toFixed(0)} mA`,
			children: [
				/* @__PURE__ */ jsx(Polygon, {
					points: rect(LX, 16, BBOT, BTOP),
					color: "var(--stage-fg)",
					fill: "var(--stage-accent)",
					fillOpacity: .16,
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Polygon, {
					points: rect(RX, 16, BBOT, BTOP),
					color: "var(--stage-fg)",
					fill: "var(--stage-accent-2)",
					fillOpacity: .16,
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: LX - 16,
						y: BTOP - 1.2
					},
					to: {
						x: 42,
						y: BTOP - 1.2
					},
					color: "var(--stage-accent)",
					opacity: .7,
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: RX - 16,
						y: BTOP - 1.2
					},
					to: {
						x: 90,
						y: BTOP - 1.2
					},
					color: "var(--stage-accent-2)",
					opacity: .7,
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Label, {
					x: LX,
					y: BBOT,
					text: "Zn²⁺",
					color: "var(--stage-fg)",
					size: 11,
					dy: -8
				}),
				/* @__PURE__ */ jsx(Label, {
					x: RX,
					y: BBOT,
					text: "Cu²⁺",
					color: "var(--stage-fg)",
					size: 11,
					dy: -8
				}),
				/* @__PURE__ */ jsx(Polygon, {
					points: rect(LX, 1.4, 16, ETOP),
					color: "none",
					fill: "var(--stage-fg)",
					fillOpacity: .6,
					weight: 0
				}),
				/* @__PURE__ */ jsx(Polygon, {
					points: rect(RX, 1.4, 16, ETOP),
					color: "none",
					fill: "var(--stage-fg)",
					fillOpacity: .6,
					weight: 0
				}),
				/* @__PURE__ */ jsx(Label, {
					x: LX,
					y: ETOP,
					text: "Zn (–) anode",
					color: "var(--stage-fg)",
					size: 11,
					dy: -22
				}),
				/* @__PURE__ */ jsx(Label, {
					x: RX,
					y: ETOP,
					text: "Cu (+) cathode",
					color: "var(--stage-fg)",
					size: 11,
					dy: -22
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: LX,
						y: ETOP
					},
					to: {
						x: LX,
						y: WIRE
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 2
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: LX,
						y: WIRE
					},
					to: {
						x: RX,
						y: WIRE
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 2
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: RX,
						y: WIRE
					},
					to: {
						x: RX,
						y: ETOP
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 2
				}),
				/* @__PURE__ */ jsx(ResistorBox, {
					center: {
						x: 50,
						y: WIRE
					},
					w: 14,
					h: 6,
					color: "var(--stage-good)",
					label: `${load}Ω`
				}),
				/* @__PURE__ */ jsx(Label, {
					x: 50,
					y: WIRE,
					text: "e⁻ →",
					color: "var(--stage-accent)",
					size: 12,
					dy: -16
				}),
				Array.from({ length: N_E }, (_, k) => {
					const p = onWire((t * speed + k / N_E) % 1);
					return /* @__PURE__ */ jsx(Dot, {
						x: p.x,
						y: p.y,
						r: 3.2,
						color: "var(--stage-accent)"
					}, `e-${k}`);
				})
			]
		})
	});
	const controls = /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
		label: "load",
		value: `${load} Ω`,
		children: /* @__PURE__ */ jsx(Slider, {
			value: load,
			min: 2,
			max: 50,
			step: 1,
			onChange: (v) => setLoad(Math.round(v)),
			ariaLabel: "external load",
			style: { width: 120 }
		})
	}) });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: "Electrons leave the zinc anode, do work in the load, and arrive at the copper cathode.",
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "grid",
					gap: 4,
					fontVariantNumeric: "tabular-nums"
				},
				children: [/* @__PURE__ */ jsxs("span", { children: [
					"EMF ",
					E.toFixed(2),
					" V"
				] }), /* @__PURE__ */ jsxs("span", { children: [
					"I ",
					(current * 1e3).toFixed(0),
					" mA"
				] })]
			})
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 6,
				padding: "8px 2px 0",
				fontSize: 14
			},
			children: [/* @__PURE__ */ jsx(Tex$1, { tex: "\\text{anode: } Zn \\to Zn^{2+} + 2e^-" }), /* @__PURE__ */ jsx(Tex$1, { tex: "\\text{cathode: } Cu^{2+} + 2e^- \\to Cu" })]
		})] }),
		controls,
		children: figure
	});
}

//#endregion
export { Battery };