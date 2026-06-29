'use client';

import { clamp } from "../../core/util.mjs";
import { CheckButton, Slider, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { demandQ, equilibrium, supplyQ } from "./core.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Axes, Dot, Label, MovableDot, Polygon, Segment, Stage } from "@classytic/stage";

//#region src/commerce/economics/market-equilibrium.tsx
/**
* MarketEquilibriumLab, Marshall's scissors: where the market clears.
*
* Drag a horizontal PRICE line across a fixed demand line + supply line. At any
* non-equilibrium price the lab shades the HORIZONTAL gap between Qd and Qs , 
* amber SURPLUS above equilibrium (pressure pushes price down), red SHORTAGE
* below (pressure pushes price up), and the band collapses to nothing at the
* crossing, where a green pill reads "market clears, Qd = Qs". Shift sliders move
* either curve to watch BOTH P* and Q* move. Reuses the shared econ core +
* Stage primitives; tokenized; reduced-motion safe (no autoplay, the learner drags).
*
* The algebra (solve a−bQ = c+dQ for Q*) belongs in a paired MathDerivation.
*/
const DEMAND0 = {
	intercept: 9,
	slope: .8
};
const SUPPLY0 = {
	intercept: 1,
	slope: .7
};
function MarketEquilibriumLab({ demand = DEMAND0, supply = SUPPLY0, shiftControls = {
	demand: true,
	supply: true
}, priceMax = 10, qtyMax = 12, goodLabel = "the good", title = "Marshall's scissors: where the market clears", prompt = "Drag the price. Above equilibrium → surplus; below → shortage; the gap is Qs − Qd.", height = 320, objectives }) {
	const [dShift, setDShift] = useState(0);
	const [sShift, setSShift] = useState(0);
	const d = {
		intercept: demand.intercept + dShift,
		slope: demand.slope
	};
	const s = {
		intercept: supply.intercept + sShift,
		slope: supply.slope
	};
	const eq = equilibrium(d, s);
	const [price, setPrice] = useState(clamp(eq.p + 2, .4, priceMax - .4));
	const qd = demandQ(d, price);
	const qs = supplyQ(s, price);
	const gap = qs - qd;
	const cleared = Math.abs(gap) < .05;
	const state = cleared ? "cleared" : gap > 0 ? "surplus" : "shortage";
	useCheckpoint({
		solved: cleared,
		activity: "market-equilibrium"
	});
	const view = {
		xMin: -.8,
		xMax: qtyMax + .4,
		yMin: -.8,
		yMax: priceMax + .4
	};
	const dQatP0 = d.intercept / d.slope;
	const sPatQmax = s.intercept + s.slope * qtyMax;
	const bandColor = state === "surplus" ? "var(--stage-warn)" : "var(--stage-danger)";
	const lo = Math.min(qd, qs), hi = Math.max(qd, qs);
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
			ariaLabel: `Supply and demand; price ${price.toFixed(1)}, Qd ${qd.toFixed(1)}, Qs ${qs.toFixed(1)}, ${state}`,
			children: [
				/* @__PURE__ */ jsx(Axes, { ticks: false }),
				/* @__PURE__ */ jsx(Label, {
					x: qtyMax / 2,
					y: -.5,
					text: "Quantity →",
					color: "var(--stage-muted)",
					size: 11
				}),
				/* @__PURE__ */ jsx(Label, {
					x: -.5,
					y: priceMax / 2,
					text: "Price",
					color: "var(--stage-muted)",
					size: 11
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: d.intercept
					},
					to: {
						x: dQatP0,
						y: 0
					},
					color: "var(--stage-accent)",
					weight: 2.5
				}),
				/* @__PURE__ */ jsx(Label, {
					x: dQatP0 * .5,
					y: d.intercept * .5,
					text: "Demand",
					color: "var(--stage-accent)",
					size: 11,
					dx: 14
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: s.intercept
					},
					to: {
						x: qtyMax,
						y: sPatQmax
					},
					color: "var(--stage-accent-2)",
					weight: 2.5
				}),
				/* @__PURE__ */ jsx(Label, {
					x: qtyMax * .7,
					y: s.intercept + s.slope * qtyMax * .7,
					text: "Supply",
					color: "var(--stage-accent-2)",
					size: 11,
					dy: -12
				}),
				!cleared && /* @__PURE__ */ jsxs(Fragment$1, { children: [
					/* @__PURE__ */ jsx(Segment, {
						from: {
							x: lo,
							y: price
						},
						to: {
							x: hi,
							y: price
						},
						color: bandColor,
						weight: 9,
						opacity: .4
					}),
					/* @__PURE__ */ jsx(Label, {
						x: (lo + hi) / 2,
						y: price,
						text: state === "surplus" ? `SURPLUS ${gap.toFixed(1)}` : `SHORTAGE ${(-gap).toFixed(1)}`,
						color: bandColor,
						size: 11,
						dy: state === "surplus" ? -12 : 14
					}),
					/* @__PURE__ */ jsx(Polygon, {
						points: state === "surplus" ? [
							{
								x: hi + .5,
								y: price - .1
							},
							{
								x: hi + .9,
								y: price - .1
							},
							{
								x: hi + .7,
								y: price - .9
							}
						] : [
							{
								x: hi + .5,
								y: price + .1
							},
							{
								x: hi + .9,
								y: price + .1
							},
							{
								x: hi + .7,
								y: price + .9
							}
						],
						color: bandColor,
						fill: bandColor,
						fillOpacity: .8,
						weight: 0
					})
				] }),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: eq.q,
						y: 0
					},
					to: {
						x: eq.q,
						y: eq.p
					},
					color: "var(--stage-good)",
					weight: 1,
					dashed: true,
					opacity: .6
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: eq.p
					},
					to: {
						x: eq.q,
						y: eq.p
					},
					color: "var(--stage-good)",
					weight: 1,
					dashed: true,
					opacity: .6
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: eq.q,
					y: eq.p,
					r: cleared ? 8 : 5,
					color: "var(--stage-good)"
				}),
				/* @__PURE__ */ jsx(Label, {
					x: eq.q,
					y: eq.p,
					text: `P* ${eq.p.toFixed(1)}, Q* ${eq.q.toFixed(1)}`,
					color: "var(--stage-good)",
					size: 11,
					dx: 10,
					dy: -10
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: price
					},
					to: {
						x: qtyMax,
						y: price
					},
					color: "var(--stage-fg)",
					weight: 1.5,
					opacity: .5,
					dashed: true
				}),
				/* @__PURE__ */ jsx(MovableDot, {
					value: {
						x: .35,
						y: price
					},
					onMove: (p) => setPrice(clamp(p.y, .4, priceMax - .4)),
					constrain: "vertical",
					range: {
						min: .4,
						max: priceMax - .4
					},
					color: "var(--stage-fg)",
					ariaLabel: "price"
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: qd,
					y: price,
					r: 4,
					color: "var(--stage-accent)"
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: qs,
					y: price,
					r: 4,
					color: "var(--stage-accent-2)"
				})
			]
		})
	}), /* @__PURE__ */ jsx(LiveRegion, { children: `Price ${price.toFixed(1)} for ${goodLabel}. Quantity demanded ${qd.toFixed(1)}, supplied ${qs.toFixed(1)}. ${state}. Equilibrium price ${eq.p.toFixed(1)}, quantity ${eq.q.toFixed(1)}.` })] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			shiftControls.demand && /* @__PURE__ */ jsx(Field, {
				label: "shift demand",
				children: /* @__PURE__ */ jsx(Slider, {
					value: dShift,
					min: -4,
					max: 4,
					step: .5,
					onChange: setDShift,
					ariaLabel: "shift the demand curve"
				})
			}),
			shiftControls.supply && /* @__PURE__ */ jsx(Field, {
				label: "shift supply",
				children: /* @__PURE__ */ jsx(Slider, {
					value: sShift,
					min: -4,
					max: 4,
					step: .5,
					onChange: setSShift,
					ariaLabel: "shift the supply curve"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "price",
				value: price.toFixed(1),
				children: /* @__PURE__ */ jsx(CheckButton, {
					onClick: () => setPrice(clamp(eq.p, .4, priceMax - .4)),
					children: "Snap to equilibrium"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "Qd",
				value: /* @__PURE__ */ jsx("span", {
					style: { color: "var(--stage-accent)" },
					children: qd.toFixed(1)
				}),
				children: /* @__PURE__ */ jsx("span", {})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "Qs",
				value: /* @__PURE__ */ jsx("span", {
					style: { color: "var(--stage-accent-2)" },
					children: qs.toFixed(1)
				}),
				children: /* @__PURE__ */ jsx("span", {})
			})
		] }),
		footer: /* @__PURE__ */ jsx(StatusPill, {
			ok: cleared,
			children: state === "cleared" ? "Market clears · Qd = Qs ✓" : state === "surplus" ? "Surplus → price pressured DOWN" : "Shortage → price pressured UP"
		}),
		children: figure
	});
}

//#endregion
export { MarketEquilibriumLab };