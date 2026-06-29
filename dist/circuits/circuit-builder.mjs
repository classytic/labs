'use client';

import { clamp, num } from "../core/util.mjs";
import { Chip, Slider } from "../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../kit/frame.mjs";
import { BulbBox, CellBox, ResistorBox, SwitchBox } from "../kit/diagram.mjs";
import { useEffect, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Dot, Segment, Stage, useFrameLoop, useInView } from "@classytic/stage";
import { solveDC } from "@classytic/stage/circuit";

//#region src/circuits/circuit-builder.tsx
/**
* CircuitBuilder, a circuit you BUILD and PLAY with, not a walkthrough.
*
* A creator declares the components in a series loop (battery + any mix of
* resistors, bulbs, switches); the learner flips switches, tunes the battery, and
* watches conventional current flow around the loop while bulbs glow in proportion
* to the power through them. Open any switch → the loop breaks, current stops, the
* bulb goes dark.
*
* Now on the @classytic/stage engine (SVG): the schematic + flowing-current dots
* are primitives (accessible, themed); switches toggle via real buttons (keyboard-
* operable) instead of canvas hit-testing.
*
* (Single series loop, the canonical "flashlight" circuit. Parallel topologies
* are a future extension of the same model.)
*/
const DEFAULT = [{
	type: "switch",
	closed: false,
	label: "switch"
}, {
	type: "bulb",
	ohms: 12,
	label: "bulb"
}];
const VIEW = {
	xMin: 0,
	xMax: 100,
	yMin: 0,
	yMax: 60
};
const L = 12, R = 92, TOP = 46, BOT = 12;
/** Position along the rectangular loop perimeter at fraction u∈[0,1). */
function onPerimeter(u) {
	const pts = [
		{
			x: L,
			y: TOP
		},
		{
			x: R,
			y: TOP
		},
		{
			x: R,
			y: BOT
		},
		{
			x: L,
			y: BOT
		},
		{
			x: L,
			y: TOP
		}
	];
	const segLen = (p, q) => Math.hypot(q.x - p.x, q.y - p.y);
	let total = 0;
	for (let s = 0; s < 4; s++) total += segLen(pts[s], pts[s + 1]);
	let d = u * total;
	for (let s = 0; s < 4; s++) {
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
	return pts[0];
}
function CircuitBuilder({ battery, components, title = "Build a circuit", height = 320 } = {}) {
	const comps = components && components.length ? components : DEFAULT;
	const [emf, setEmf] = useState(clamp(num(battery, 6), 1, 24));
	const [closed, setClosed] = useState(() => Object.fromEntries(comps.map((c, i) => [i, c.type === "switch" ? c.closed !== false : true])));
	const [t, setT] = useState(0);
	const { ref: viewRef, inView } = useInView();
	useEffect(() => {
		setEmf(clamp(num(battery, 6), 1, 24));
	}, [battery]);
	useEffect(() => {
		setClosed(Object.fromEntries(comps.map((c, i) => [i, c.type === "switch" ? c.closed !== false : true])));
	}, [comps.map((c) => c.type + ("ohms" in c && c.ohms || "")).join("|")]);
	const allClosed = comps.every((c, i) => c.type !== "switch" || closed[i]);
	const totalR = comps.reduce((s, c) => s + ("ohms" in c ? c.ohms : 0), 0);
	const current = (() => {
		if (!allClosed) return 0;
		const elems = [{
			kind: "V",
			n1: 1,
			n2: 0,
			value: emf,
			id: "b"
		}];
		let prev = 1;
		let node = 2;
		const withR = comps.filter((c) => "ohms" in c);
		withR.forEach((c, idx) => {
			const nb = idx === withR.length - 1 ? 0 : node++;
			elems.push({
				kind: "R",
				n1: prev,
				n2: nb,
				value: Math.max(.5, c.ohms)
			});
			prev = nb;
		});
		return Math.abs(solveDC(elems).current["b"] ?? 0);
	})();
	useFrameLoop((f) => setT((v) => v + f.dtMs / 1e3), { running: current > 1e-4 && inView });
	const n = comps.length;
	const segW = (R - L) / n;
	const cyMid = 58 / 2;
	const speed = clamp(current * .18, .03, .5);
	const N_DOTS = 28;
	const switches = comps.map((c, i) => ({
		c,
		i
	})).filter((x) => x.c.type === "switch");
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		children: /* @__PURE__ */ jsxs(Stage, {
			view: VIEW,
			height,
			preserveAspect: false,
			ariaLabel: `Series circuit, ${emf}V battery, ${(current * 1e3).toFixed(0)} mA${allClosed ? "" : ", open, no current"}`,
			children: [
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: L,
						y: BOT
					},
					to: {
						x: R,
						y: BOT
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 2.5
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: R,
						y: BOT
					},
					to: {
						x: R,
						y: TOP
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 2.5
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: L,
						y: BOT
					},
					to: {
						x: L,
						y: cyMid - 6
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 2.5
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: L,
						y: 35
					},
					to: {
						x: L,
						y: TOP
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 2.5
				}),
				/* @__PURE__ */ jsx(CellBox, {
					center: {
						x: L,
						y: cyMid
					},
					half: 6,
					orient: "v",
					live: current > 1e-4,
					label: `${emf.toFixed(0)} V`
				}),
				comps.map((c, i) => {
					const cx = L + (i + .5) * segW;
					const half = Math.min(segW * .28, 10);
					const leftX = i === 0 ? L : L + i * segW;
					const rightX = i === n - 1 ? R : L + (i + 1) * segW;
					const label = c.label ?? c.type;
					const wires = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Segment, {
						from: {
							x: leftX,
							y: TOP
						},
						to: {
							x: cx - half,
							y: TOP
						},
						color: "var(--stage-fg)",
						opacity: .5,
						weight: 2.5
					}), /* @__PURE__ */ jsx(Segment, {
						from: {
							x: cx + half,
							y: TOP
						},
						to: {
							x: rightX,
							y: TOP
						},
						color: "var(--stage-fg)",
						opacity: .5,
						weight: 2.5
					})] });
					const energized = current > 1e-4;
					if (c.type === "resistor") return /* @__PURE__ */ jsxs("g", { children: [wires, /* @__PURE__ */ jsx(ResistorBox, {
						center: {
							x: cx,
							y: TOP
						},
						w: 2 * half,
						h: 7,
						live: energized,
						label: `${label} ${c.ohms}Ω`
					})] }, i);
					if (c.type === "bulb") {
						const bright = clamp(current * 1.2, 0, 1) * (c.ohms / Math.max(totalR, 1));
						return /* @__PURE__ */ jsxs("g", { children: [wires, /* @__PURE__ */ jsx(BulbBox, {
							center: {
								x: cx,
								y: TOP
							},
							half,
							live: energized,
							brightness: bright,
							label
						})] }, i);
					}
					const open = !closed[i];
					return /* @__PURE__ */ jsxs("g", { children: [wires, /* @__PURE__ */ jsx(SwitchBox, {
						center: {
							x: cx,
							y: TOP
						},
						half,
						live: energized && !open,
						closed: !open,
						label
					})] }, i);
				}),
				current > 1e-4 && Array.from({ length: N_DOTS }, (_, k) => {
					const p = onPerimeter((t * speed + k / N_DOTS) % 1);
					return /* @__PURE__ */ jsx(Dot, {
						x: p.x,
						y: p.y,
						r: 3,
						color: "var(--stage-accent)"
					}, `f-${k}`);
				})
			]
		})
	});
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
		label: "battery",
		value: `${emf} V`,
		children: /* @__PURE__ */ jsx(Slider, {
			value: emf,
			min: 1,
			max: 24,
			step: 1,
			onChange: setEmf,
			ariaLabel: "battery voltage",
			style: { width: 120 }
		})
	}), switches.map(({ c, i }) => /* @__PURE__ */ jsxs(Chip, {
		selected: !!closed[i],
		onClick: () => setClosed((s) => ({
			...s,
			[i]: !s[i]
		})),
		children: [
			c.label ?? "switch",
			": ",
			closed[i] ? "closed" : "open"
		]
	}, i))] });
	const aside = /* @__PURE__ */ jsx(Callout, {
		tone: "result",
		children: /* @__PURE__ */ jsxs("span", {
			style: {
				display: "grid",
				gap: 4,
				fontVariantNumeric: "tabular-nums"
			},
			children: [
				/* @__PURE__ */ jsx("span", { children: allClosed ? "closed" : "open, no current" }),
				/* @__PURE__ */ jsxs("span", { children: [
					"R ",
					totalR.toFixed(0),
					" Ω"
				] }),
				/* @__PURE__ */ jsxs("span", { children: [
					"I ",
					(current * 1e3).toFixed(0),
					" mA"
				] })
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: switches.length ? "Flip a switch to open/close it. Tune the battery and watch the current, and the bulb." : "Tune the battery and watch the current flow.",
		aside,
		controls,
		children: figure
	});
}

//#endregion
export { CircuitBuilder };