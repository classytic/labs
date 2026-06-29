'use client';

import { clamp } from "../../core/util.mjs";
import { Chip, Slider, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { demandQ, pointElasticity } from "./core.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Axes, Dot, Label, MovableDot, Polygon, Segment, Stage } from "@classytic/stage";

//#region src/commerce/economics/elasticity-revenue.tsx
/**
* ElasticityRevenueLab, the stretch test: elasticity is NOT slope.
*
* Rotate one demand line about a pivot from steep (inelastic, few substitutes,
* e.g. insulin) to flat (elastic, many substitutes, e.g. one water brand). Drag
* the price down the line and the total-revenue rectangle (P×Q) grows on the
* elastic upper half and shrinks on the inelastic lower half, the revenue
* see-saw. The point-elasticity pill flips ELASTIC → UNIT → INELASTIC down a
* SINGLE straight line, killing the "slope = elasticity" error.
*
* Reuses the shared econ core (pointElasticity / demandQ). Tokenized; reduced-motion safe.
*/
const PRESETS = [
	{
		label: "💉 insulin (few substitutes)",
		slope: 2.2
	},
	{
		label: "🛒 typical good",
		slope: .8
	},
	{
		label: "💧 one water brand (many substitutes)",
		slope: .28
	}
];
function ElasticityRevenueLab({ pivot = {
	p: 5,
	q: 5
}, priceMax = 11, qtyMax = 13, anchorPresets = PRESETS, title = "The stretch test: elasticity is not slope", prompt = "Rotate the curve (substitutes), then drag the price: watch the revenue box + the elasticity flip.", height = 320, objectives }) {
	const [b, setB] = useState(.8);
	const curve = {
		intercept: pivot.p + b * pivot.q,
		slope: b
	};
	const [price, setPrice] = useState(pivot.p + 1.5);
	const q = clamp(demandQ(curve, price), 0, qtyMax);
	const revenue = price * q;
	const E = pointElasticity(curve, price);
	const kind = Math.abs(E - 1) < .06 ? "unit" : E > 1 ? "elastic" : "inelastic";
	const kindColor = kind === "elastic" ? "var(--stage-good)" : kind === "unit" ? "var(--stage-warn)" : "var(--stage-danger)";
	const view = {
		xMin: -.9,
		xMax: qtyMax + .4,
		yMin: -.9,
		yMax: priceMax + .4
	};
	const qAtP0 = clamp(curve.intercept / b, 0, qtyMax * 1.3);
	const pAtQ0 = clamp(curve.intercept, 0, priceMax * 1.3);
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs(Stage, {
			view,
			height,
			preserveAspect: false,
			ariaLabel: `Demand elasticity ${E.toFixed(2)} (${kind}); revenue ${revenue.toFixed(1)}`,
			children: [
				/* @__PURE__ */ jsx(Axes, { ticks: false }),
				/* @__PURE__ */ jsx(Label, {
					x: qtyMax / 2,
					y: -.6,
					text: "Quantity →",
					color: "var(--stage-muted)",
					size: 11
				}),
				/* @__PURE__ */ jsx(Label, {
					x: -.6,
					y: priceMax / 2,
					text: "Price",
					color: "var(--stage-muted)",
					size: 11
				}),
				/* @__PURE__ */ jsx(Polygon, {
					points: [
						{
							x: 0,
							y: 0
						},
						{
							x: q,
							y: 0
						},
						{
							x: q,
							y: price
						},
						{
							x: 0,
							y: price
						}
					],
					color: kindColor,
					fill: kindColor,
					fillOpacity: .16,
					weight: 0
				}),
				/* @__PURE__ */ jsx(Label, {
					x: q / 2,
					y: price / 2,
					text: `revenue ${revenue.toFixed(1)}`,
					color: kindColor,
					size: 11
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: pAtQ0
					},
					to: {
						x: qAtP0,
						y: pAtQ0 > 0 ? 0 : pAtQ0
					},
					color: "var(--stage-accent)",
					weight: 2.5
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: pivot.q,
					y: pivot.p,
					r: 4,
					color: "var(--stage-muted)"
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: price
					},
					to: {
						x: q,
						y: price
					},
					color: "var(--stage-fg)",
					weight: 1,
					dashed: true,
					opacity: .45
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: q,
						y: 0
					},
					to: {
						x: q,
						y: price
					},
					color: "var(--stage-fg)",
					weight: 1,
					dashed: true,
					opacity: .45
				}),
				/* @__PURE__ */ jsx(MovableDot, {
					value: {
						x: .35,
						y: price
					},
					onMove: (pt) => setPrice(clamp(pt.y, .4, priceMax - .4)),
					constrain: "vertical",
					range: {
						min: .4,
						max: priceMax - .4
					},
					color: "var(--stage-fg)",
					ariaLabel: "price"
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: q,
					y: price,
					r: 5,
					color: "var(--stage-accent)"
				})
			]
		})
	}), /* @__PURE__ */ jsx(LiveRegion, { children: `At price ${price.toFixed(1)}, quantity ${q.toFixed(1)}, revenue ${revenue.toFixed(1)}. Elasticity ${E === Infinity ? "infinite" : E.toFixed(2)}, ${kind}.` })] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "steep ↔ flat",
				children: /* @__PURE__ */ jsx(Slider, {
					value: b,
					min: .2,
					max: 2.4,
					step: .05,
					onChange: setB,
					ariaLabel: "rotate the demand curve (substitutes)"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "substitutes",
				children: /* @__PURE__ */ jsx("span", {
					style: {
						display: "flex",
						flexWrap: "wrap",
						gap: 8
					},
					children: anchorPresets.map((a) => /* @__PURE__ */ jsx(Chip, {
						selected: Math.abs(b - a.slope) < .03,
						onClick: () => setB(a.slope),
						children: a.label
					}, a.label))
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "price",
				value: price.toFixed(1),
				children: /* @__PURE__ */ jsx("span", {})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "Q",
				value: /* @__PURE__ */ jsx("span", {
					style: { color: "var(--stage-accent)" },
					children: q.toFixed(1)
				}),
				children: /* @__PURE__ */ jsx("span", {})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "revenue",
				value: revenue.toFixed(1),
				children: /* @__PURE__ */ jsx("span", {})
			})
		] }),
		footer: /* @__PURE__ */ jsxs(StatusPill, {
			ok: kind === "elastic",
			children: [
				"|E| ",
				E === Infinity ? "∞" : E.toFixed(2),
				" · ",
				kind.toUpperCase()
			]
		}),
		children: figure
	});
}

//#endregion
export { ElasticityRevenueLab };