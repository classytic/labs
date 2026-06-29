'use client';

import { clamp } from "../../core/util.mjs";
import { Slider, StatusPill } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Axes, Dot, Label, Polygon, Segment, Stage } from "@classytic/stage";

//#region src/biology/enzyme-rate/preset.tsx
/**
* EnzymeRateLab, the optimum, then the cliff: enzymes denature.
*
* Drag temperature: the rate climbs to an optimum (more kinetic energy → more
* successful enzyme–substrate collisions) then CRASHES as the lock-and-key active
* site is mangled, and crucially, cooling back down does NOT restore it
* (thermal denaturation is irreversible). The bell is BUILT from plotted dots as
* you sweep, never pre-drawn. pH mode shows the same optimum but reversibly; a
* "fresh enzyme" reset is the only way back from a denatured run.
*
* Reuses core/util + kit/controls; tokenized; reduced-motion safe (no autoplay , 
* the learner drags). The collision-theory vs denaturation split → a MathDerivation.
*/
const CLIFF = 16;
/** A lock-and-key enzyme glyph; `denat` 0 (intact) → 1 (mangled active site). */
function Enzyme({ denat }) {
	const d = clamp(denat, 0, 1);
	const body = d > .05 ? "var(--stage-danger)" : "var(--stage-accent)";
	const edge = `color-mix(in oklab, ${body} 60%, black)`;
	const splay = d * 14;
	const notch = `M ${40 - splay} 26 L 52 ${48 + d * 8} L 64 ${30 - splay * .5} L 76 ${48 + d * 6} L ${88 + splay} 26`;
	const keySeated = d < .25;
	return /* @__PURE__ */ jsxs("svg", {
		width: 150,
		height: 120,
		viewBox: "0 0 130 120",
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ jsx("path", {
				d: "M 18 30 Q 14 70 30 96 Q 64 110 98 96 Q 114 70 110 30 Z",
				fill: `color-mix(in oklab, ${body} 22%, var(--stage-bg))`,
				stroke: edge,
				strokeWidth: 2
			}),
			/* @__PURE__ */ jsx("path", {
				d: notch,
				fill: "var(--stage-bg)",
				stroke: edge,
				strokeWidth: 2.5,
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ jsx("g", {
				transform: keySeated ? "translate(52 8)" : `translate(58 -8) rotate(${18 + d * 14} 12 14)`,
				children: /* @__PURE__ */ jsx("path", {
					d: "M 0 18 L 12 0 L 24 18 Z",
					fill: keySeated ? "var(--stage-good)" : "var(--stage-warn)",
					stroke: "color-mix(in oklab, var(--stage-fg) 40%, transparent)",
					strokeWidth: 1
				})
			}),
			/* @__PURE__ */ jsx("text", {
				x: 64,
				y: 114,
				fill: "var(--stage-muted)",
				fontSize: 10,
				fontWeight: 700,
				textAnchor: "middle",
				children: d > .4 ? "DENATURED" : keySeated ? "substrate fits" : "binding…"
			})
		]
	});
}
function EnzymeRateLab({ factor = "temperature", optimum = 40, factorMin = 0, factorMax = 80, title = "The optimum, then the cliff: enzymes denature", prompt = "Drag the temperature. Past the optimum the enzyme denatures, and cooling back down won’t fix it.", height = 240, objectives }) {
	const reversible = factor === "pH";
	const [f, setF] = useState(reversible ? optimum - 2 : factorMin + 5);
	const peak = useRef(f);
	const pts = useRef(/* @__PURE__ */ new Map());
	const [, setTick] = useState(0);
	useCheckpoint({
		solved: Math.abs(f - optimum) < 1.5,
		activity: "enzyme-rate"
	});
	const denatFrom = (x) => clamp((x - optimum) / CLIFF, 0, 1);
	const denat = reversible ? denatFrom(f) : denatFrom(peak.current);
	const rate = clamp(clamp(f / optimum, 0, 1) * (1 - denat), 0, 1);
	pts.current.set(Math.round(f), rate);
	const onF = (v) => {
		setF(v);
		if (!reversible && v > peak.current) peak.current = v;
		setTick((t) => t + 1 & 65535);
	};
	const reset = () => {
		pts.current = /* @__PURE__ */ new Map();
		peak.current = factorMin + 5;
		setF(factorMin + 5);
		setTick((t) => t + 1 & 65535);
	};
	const view = {
		xMin: factorMin - (factorMax - factorMin) * .06,
		xMax: factorMax + 1,
		yMin: -.12,
		yMax: 1.12
	};
	const unit = reversible ? "" : " °C";
	const points = [...pts.current.entries()].sort((a, b) => a[0] - b[0]);
	const state = denat > .5 ? "denatured" : Math.abs(f - optimum) < 2 ? "optimum" : f < optimum ? "climbing" : "falling";
	const figure = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			gap: 12,
			flexWrap: "wrap",
			alignItems: "center",
			borderRadius: 14,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			padding: 12
		},
		children: [/* @__PURE__ */ jsx(Enzyme, { denat }), /* @__PURE__ */ jsx("div", {
			style: {
				flex: 1,
				minWidth: 240
			},
			children: /* @__PURE__ */ jsxs(Stage, {
				view,
				height,
				preserveAspect: false,
				ariaLabel: `Enzyme rate vs ${factor}; ${state}`,
				children: [
					/* @__PURE__ */ jsx(Axes, { ticks: false }),
					/* @__PURE__ */ jsx(Label, {
						x: (factorMin + factorMax) / 2,
						y: -.08,
						text: reversible ? "pH →" : "temperature →",
						color: "var(--stage-muted)",
						size: 11
					}),
					/* @__PURE__ */ jsx(Label, {
						x: factorMin,
						y: .55,
						text: "rate",
						color: "var(--stage-muted)",
						size: 11,
						dx: -6
					}),
					!reversible && /* @__PURE__ */ jsx(Polygon, {
						points: [
							{
								x: optimum + CLIFF,
								y: 0
							},
							{
								x: factorMax,
								y: 0
							},
							{
								x: factorMax,
								y: 1.1
							},
							{
								x: optimum + CLIFF,
								y: 1.1
							}
						],
						color: "var(--stage-danger)",
						fill: "var(--stage-danger)",
						fillOpacity: .08,
						weight: 0
					}),
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: optimum,
							y: 0
						},
						to: {
							x: optimum,
							y: 1.1
						},
						color: "var(--stage-good)",
						weight: 1,
						dashed: true,
						opacity: .5
					}),
					/* @__PURE__ */ jsx(Label, {
						x: optimum,
						y: 1.1,
						text: "optimum",
						color: "var(--stage-good)",
						size: 10,
						dy: -4
					}),
					points.map(([x, y]) => /* @__PURE__ */ jsx(Dot, {
						x,
						y,
						r: 3,
						color: "var(--stage-accent)",
						opacity: .85
					}, x)),
					/* @__PURE__ */ jsx(Dot, {
						x: f,
						y: rate,
						r: 6,
						color: denat > .5 ? "var(--stage-danger)" : "var(--stage-good)"
					})
				]
			})
		})]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Callout, {
			tone: state === "optimum" ? "result" : "info",
			children: [/* @__PURE__ */ jsxs("div", {
				style: {
					fontVariantNumeric: "tabular-nums",
					fontWeight: 600
				},
				children: [
					reversible ? "pH" : "temperature",
					" ",
					f.toFixed(0),
					unit,
					" · rate ",
					(rate * 100).toFixed(0)
				]
			}), /* @__PURE__ */ jsx(StatusPill, {
				ok: state === "optimum",
				children: state === "optimum" ? "at the optimum ✓" : state === "denatured" ? "denatured, no recovery" : state === "falling" ? reversible ? "past optimum" : "denaturing…" : "climbing (more collisions)"
			})]
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: reversible ? "pH" : "temperature",
			value: `${f.toFixed(0)}${unit}`,
			children: /* @__PURE__ */ jsx(Slider, {
				value: f,
				min: factorMin,
				max: factorMax,
				step: 1,
				onChange: onF,
				ariaLabel: reversible ? "pH" : "temperature"
			})
		}), /* @__PURE__ */ jsx("button", {
			type: "button",
			className: "lab-chip",
			onClick: reset,
			children: "↺ fresh enzyme"
		})] }),
		footer: /* @__PURE__ */ jsx(LiveRegion, { children: `${reversible ? "pH" : "Temperature"} ${f.toFixed(0)}, rate ${(rate * 100).toFixed(0)}. ${state}.` }),
		children: figure
	});
}

//#endregion
export { EnzymeRateLab };