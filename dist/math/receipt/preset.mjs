'use client';

import { LabFrame } from "../../kit/frame.mjs";
import { Blank, SlotTray, useSlotFill } from "../../kit/slot-fill.mjs";
import { ReceiptScene } from "../../kit/receipt.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/math/receipt/preset.tsx
/**
* ReceiptLab, "complete the receipt totals", multiplicative + additive reasoning grounded
* in a real bill. The learner reads qty × unit price per line and tap-fills the total items
* and total cost from a tile tray (with the classic "summed the prices, forgot the quantity"
* distractors); a correct fill reveals the totals on the receipt itself.
*
* Pure composition of existing primitives: <ReceiptScene> (the concrete twin) + the inline
* slot engine (`useSlotFill` + `Blank` + `SlotTray`). It is also the seed of the percentage
* family, swap the "total" question for "apply a 20% discount" on the same scene.
*/
const DEFAULT_ITEMS = [{
	qty: 6,
	name: "Pineapples",
	unit: 5
}, {
	qty: 3,
	name: "Mangoes",
	unit: 2
}];
function ReceiptLab(props = {}) {
	const { store = "Half Foods", items = DEFAULT_ITEMS, currency = "$", ask = {
		items: true,
		cost: true
	}, distractors = [], title = "Complete the receipt totals", prompt = "Each line is the quantity times the price each. Work out the totals.", activity = "receipt-totals" } = props;
	const totalItems = items.reduce((s, it) => s + it.qty, 0);
	const totalCost = items.reduce((s, it) => s + it.qty * it.unit, 0);
	const sumUnit = items.reduce((s, it) => s + it.unit, 0);
	const money = (n) => `${currency}${Math.round(n * 100) / 100}`;
	const slots = [];
	if (ask.items !== false) slots.push({
		id: "items",
		answer: totalItems
	});
	if (ask.cost !== false) slots.push({
		id: "cost",
		answer: money(totalCost)
	});
	const itemPool = new Set([
		totalItems,
		totalItems * 2,
		totalCost
	]);
	const costPool = new Set([
		money(totalCost),
		money(sumUnit),
		money(Math.round(totalCost * .5))
	]);
	const tiles = Array.from(new Set([
		...ask.items !== false ? itemPool : [],
		...ask.cost !== false ? costPool : [],
		...distractors
	]));
	const [revealed, setRevealed] = useState({
		items: false,
		cost: false
	});
	const fill = useSlotFill(slots, tiles, activity, () => setRevealed({
		items: true,
		cost: true
	}));
	const figure = /* @__PURE__ */ jsx("div", {
		style: {
			display: "flex",
			justifyContent: "center"
		},
		children: /* @__PURE__ */ jsx(ReceiptScene, {
			store,
			items,
			currency,
			revealItems: revealed.items || fill.filled.items != null,
			revealCost: revealed.cost || fill.filled.cost != null
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		footer: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 14,
				justifyItems: "center",
				marginTop: 4
			},
			children: [
				/* @__PURE__ */ jsxs("p", {
					style: {
						margin: 0,
						fontWeight: 700,
						fontSize: 16,
						lineHeight: 1.9,
						textAlign: "center"
					},
					children: [ask.items !== false && /* @__PURE__ */ jsxs(Fragment$1, { children: [
						"A total of ",
						/* @__PURE__ */ jsx(Blank, {
							fill,
							id: "items"
						}),
						" items were purchased.",
						" "
					] }), ask.cost !== false && /* @__PURE__ */ jsxs(Fragment$1, { children: [
						"The total cost was ",
						/* @__PURE__ */ jsx(Blank, {
							fill,
							id: "cost",
							width: 64
						}),
						"."
					] })]
				}),
				/* @__PURE__ */ jsx(SlotTray, { fill }),
				fill.solved && /* @__PURE__ */ jsx("p", {
					role: "status",
					style: {
						margin: 0,
						color: "var(--stage-good)",
						fontWeight: 700
					},
					children: "✓ Receipt complete."
				})
			]
		}),
		children: figure
	});
}

//#endregion
export { ReceiptLab };