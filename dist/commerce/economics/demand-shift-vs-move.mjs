'use client';

import { clamp } from "../../core/util.mjs";
import { Chip, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { demandQ, equilibrium } from "./core.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Axes, Dot, Label, MovableDot, Segment, Stage } from "@classytic/stage";

//#region src/commerce/economics/demand-shift-vs-move.tsx
/**
* DemandShiftVsMoveLab, shift the curve vs move along it.
*
* The #1 micro misconception. Dragging the PRICE slider slides a dot ALONG a
* fixed demand curve, a change in QUANTITY demanded (the curve never moves).
* Clicking a non-price TRIBE factor (Tastes, Related-good prices, Income, Buyers,
* Expectations) translates the WHOLE curve, a change in DEMAND, and the
* equilibrium moves along supply to a new P* and Q*. A predict-then-check asks
* for the P/Q direction before the reveal. The decision rule: only the good's OWN
* price (the axis variable) moves you along; anything else shifts the curve.
*
* Reuses the shared econ core (equilibrium / demandQ). Tokenized; reduced-motion safe.
*/
const DEMAND0 = {
	intercept: 9,
	slope: .8
};
const SUPPLY0 = {
	intercept: 1,
	slope: .7
};
const SHIFTERS = [
	{
		label: "Incomes rise",
		target: "demand",
		delta: 2
	},
	{
		label: "Substitute gets cheaper",
		target: "demand",
		delta: -2
	},
	{
		label: "Tastes favour it",
		target: "demand",
		delta: 1.5
	},
	{
		label: "More buyers",
		target: "demand",
		delta: 1
	}
];
function DemandShiftVsMoveLab({ demand = DEMAND0, supply = SUPPLY0, shifters = SHIFTERS, askPrediction = true, priceMax = 11, qtyMax = 13, title = "Shift the curve, or move along it?", prompt = "Drag PRICE → move along (Δ quantity demanded). Click a TRIBE factor → the whole curve SHIFTS (Δ demand).", height = 320, objectives }) {
	const [dShift, setDShift] = useState(0);
	const [sShift, setSShift] = useState(0);
	const [movePrice, setMovePrice] = useState(6);
	const [last, setLast] = useState(null);
	const [ghost, setGhost] = useState(null);
	const [pending, setPending] = useState(null);
	const [verdict, setVerdict] = useState(null);
	const [solved, setSolved] = useState(false);
	useCheckpoint({
		solved,
		activity: "demand-shift-vs-move"
	});
	const d = {
		intercept: demand.intercept + dShift,
		slope: demand.slope
	};
	const s = {
		intercept: supply.intercept + sShift,
		slope: supply.slope
	};
	const eq = equilibrium(d, s);
	const moveQ = clamp(demandQ(d, movePrice), 0, qtyMax);
	const apply = (sh) => {
		const prevD = { ...d };
		if (sh.target === "demand") setDShift((v) => v + sh.delta);
		else setSShift((v) => v + sh.delta);
		setGhost(sh.target === "demand" ? prevD : null);
		setLast("shift");
	};
	const dirOf = (sh) => {
		if (sh.target === "demand") return sh.delta > 0 ? "up" : "down";
		return "indeterminate";
	};
	const clickShifter = (sh) => {
		setVerdict(null);
		if (askPrediction) setPending(sh);
		else apply(sh);
	};
	const predict = (guess) => {
		if (!pending) return;
		const truth = dirOf(pending);
		const ok = guess === truth;
		setVerdict(ok ? `✓ Right, ${pending.label} shifts demand ${pending.delta > 0 ? "right" : "left"}, so P* and Q* both go ${truth}.` : `Not quite, ${pending.label} shifts demand ${pending.delta > 0 ? "right" : "left"}: P* and Q* both go ${truth}.`);
		apply(pending);
		setPending(null);
		if (ok) setSolved(true);
	};
	const view = {
		xMin: -.9,
		xMax: qtyMax + .4,
		yMin: -.9,
		yMax: priceMax + .4
	};
	const lineEnds = (c, down) => down ? [{
		x: 0,
		y: c.intercept
	}, {
		x: c.intercept / c.slope,
		y: 0
	}] : [{
		x: 0,
		y: c.intercept
	}, {
		x: qtyMax,
		y: c.intercept + c.slope * qtyMax
	}];
	const [d0, d1] = lineEnds(d, true);
	const [s0, s1] = lineEnds(s, false);
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
			ariaLabel: `Supply and demand; equilibrium price ${eq.p.toFixed(1)}, quantity ${eq.q.toFixed(1)}`,
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
				ghost && /* @__PURE__ */ jsx(Segment, {
					from: lineEnds(ghost, true)[0],
					to: lineEnds(ghost, true)[1],
					color: "var(--stage-accent)",
					weight: 1.5,
					dashed: true,
					opacity: .4
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: d0,
					to: d1,
					color: "var(--stage-accent)",
					weight: 2.5
				}),
				/* @__PURE__ */ jsx(Label, {
					x: d1.x * .5,
					y: d0.y * .5,
					text: "Demand",
					color: "var(--stage-accent)",
					size: 11,
					dx: 14
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: s0,
					to: s1,
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
				/* @__PURE__ */ jsx(Dot, {
					x: eq.q,
					y: eq.p,
					r: 6,
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
						y: movePrice
					},
					to: {
						x: moveQ,
						y: movePrice
					},
					color: "var(--stage-fg)",
					weight: 1,
					dashed: true,
					opacity: .4
				}),
				/* @__PURE__ */ jsx(MovableDot, {
					value: {
						x: .35,
						y: movePrice
					},
					onMove: (p) => {
						setMovePrice(clamp(p.y, .4, priceMax - .4));
						setLast("move");
					},
					constrain: "vertical",
					range: {
						min: .4,
						max: priceMax - .4
					},
					color: "var(--stage-fg)",
					ariaLabel: "own price (moves along the demand curve)"
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: moveQ,
					y: movePrice,
					r: 5,
					color: "var(--stage-fg)"
				})
			]
		})
	}), /* @__PURE__ */ jsx(LiveRegion, { children: verdict ?? (last === "move" ? "Movement along the demand curve: a change in quantity demanded." : last === "shift" ? `Demand shifted; new equilibrium price ${eq.p.toFixed(1)}, quantity ${eq.q.toFixed(1)}.` : "Drag the price or pick a factor.") })] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsx(ControlBar, { children: pending ? /* @__PURE__ */ jsx(Field, {
			label: `“${pending.label}” → P* and Q* will go`,
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "flex",
					flexWrap: "wrap",
					gap: 8
				},
				children: [
					/* @__PURE__ */ jsx(Chip, {
						selected: false,
						onClick: () => predict("up"),
						children: "both UP"
					}),
					/* @__PURE__ */ jsx(Chip, {
						selected: false,
						onClick: () => predict("down"),
						children: "both DOWN"
					}),
					/* @__PURE__ */ jsx(Chip, {
						selected: false,
						onClick: () => predict("indeterminate"),
						children: "indeterminate"
					})
				]
			})
		}) : /* @__PURE__ */ jsx(Field, {
			label: "TRIBE factor",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "flex",
					flexWrap: "wrap",
					gap: 8
				},
				children: [shifters.map((sh) => /* @__PURE__ */ jsx(Chip, {
					selected: false,
					onClick: () => clickShifter(sh),
					children: sh.label
				}, sh.label)), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "lab-chip",
					onClick: () => {
						setDShift(0);
						setSShift(0);
						setGhost(null);
						setLast(null);
						setVerdict(null);
						setSolved(false);
					},
					children: "reset"
				})]
			})
		}) }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			last === "move" && /* @__PURE__ */ jsx(StatusPill, {
				ok: false,
				children: "MOVEMENT along the curve, Δ quantity demanded (own price changed)"
			}),
			last === "shift" && /* @__PURE__ */ jsx(StatusPill, {
				ok: true,
				children: "SHIFT of the whole curve, Δ demand (a TRIBE factor)"
			}),
			!last && /* @__PURE__ */ jsx("p", {
				className: "lab-prompt",
				children: "Drag the price, or click a factor."
			}),
			verdict && /* @__PURE__ */ jsx(StatusPill, {
				ok: verdict.startsWith("✓"),
				children: verdict
			})
		] }),
		children: figure
	});
}

//#endregion
export { DemandShiftVsMoveLab };