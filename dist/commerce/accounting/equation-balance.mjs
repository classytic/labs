'use client';

import { clamp } from "../../core/util.mjs";
import { CheckButton, Chip, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { ScaleFrame } from "../../kit/scale.mjs";
import { CATEGORY_COLOR, equationParts, money } from "./core.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Circle, Label, Segment, Stage, StageAssetDefs } from "@classytic/stage";

//#region src/commerce/accounting/equation-balance.tsx
/**
* EquationBalanceLab, the balance sheet that must stay LEVEL.
*
* Apply each authored transaction one at a time; weights slide onto a two-pan
* scale (left = Assets, right = Liabilities + Equity) and the beam re-levels , 
* because every balanced entry changes both sides equally, "Assets = Liabilities
* + Equity" stops being a formula and becomes a felt constraint. A free-post mode
* lets the learner nudge ONE side and watch the books visibly tip (the #1
* misconception drill). Reuses the shared ScaleFrame; tokenized; reduced-motion safe.
*
* The A = L + E rearrangement (Equity = Assets − Liabilities) belongs in a paired
* MathDerivation, this lab only makes the constraint felt.
*/
const DEMO_ACCOUNTS = [
	{
		id: "cash",
		name: "Cash",
		category: "Asset"
	},
	{
		id: "equip",
		name: "Equipment",
		category: "Asset"
	},
	{
		id: "loan",
		name: "Bank loan",
		category: "Liability"
	},
	{
		id: "capital",
		name: "Capital",
		category: "Equity"
	}
];
const DEMO_TXNS = [
	{
		id: "t1",
		label: "Owner invests $10,000 cash",
		effects: [{
			account: "cash",
			delta: 1e4
		}, {
			account: "capital",
			delta: 1e4
		}]
	},
	{
		id: "t2",
		label: "Take a $5,000 bank loan",
		effects: [{
			account: "cash",
			delta: 5e3
		}, {
			account: "loan",
			delta: 5e3
		}]
	},
	{
		id: "t3",
		label: "Buy equipment for $3,000 cash",
		effects: [{
			account: "equip",
			delta: 3e3
		}, {
			account: "cash",
			delta: -3e3
		}]
	}
];
const VIEW = {
	xMin: -7,
	xMax: 7,
	yMin: -4.6,
	yMax: 5.2
};
const PIVOT = {
	x: 0,
	y: 1.2
};
const HB = 4.2, PAN_HANG = 1.35, PAN_R = 1.75, BASE_Y = -3.6;
function EquationBalanceLab({ accounts = DEMO_ACCOUNTS, transactions = DEMO_TXNS, freePost = false, start = 0, title = "The balance sheet that must stay level", prompt = "Apply each transaction, Assets must always equal Liabilities + Equity.", height = 320, objectives }) {
	const [applied, setApplied] = useState(clamp(start, 0, transactions.length));
	const [extraA, setExtraA] = useState(0);
	const [extraLE, setExtraLE] = useState(0);
	const balanceOf = useMemo(() => {
		const bal = {};
		for (let i = 0; i < applied; i++) for (const e of transactions[i].effects) bal[e.account] = (bal[e.account] ?? 0) + e.delta;
		return (id) => bal[id] ?? 0;
	}, [applied, transactions]);
	const { assets: a0, liabilities, equity } = equationParts(accounts, balanceOf);
	const assets = a0 + extraA;
	const rhs = liabilities + equity + extraLE;
	const imbalance = assets - rhs;
	const balanced = Math.abs(imbalance) < .005;
	const frac = clamp(Math.abs(imbalance) / Math.max(assets, rhs, 1), 0, 1);
	const drop = balanced ? 0 : Math.sign(imbalance) * (.5 + .5 * frac) * 1.3;
	useCheckpoint({
		solved: balanced && applied === transactions.length && applied > 0 && extraA === 0 && extraLE === 0,
		activity: "equation-balance"
	});
	const beamA = {
		x: PIVOT.x - HB,
		y: PIVOT.y - drop
	};
	const beamB = {
		x: PIVOT.x + HB,
		y: PIVOT.y + drop
	};
	const trayLC = {
		x: beamA.x,
		y: beamA.y - PAN_HANG
	};
	const trayRC = {
		x: beamB.x,
		y: beamB.y - PAN_HANG
	};
	const coins = (center, cats) => {
		const items = accounts.filter((ac) => cats.includes(ac.category) && Math.abs(balanceOf(ac.id)) > .005);
		const leftPan = center.x < 0;
		return items.map((ac, i) => {
			const cy = center.y + .7 + i * 1.15;
			return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx(Circle, {
				center: {
					x: center.x,
					y: cy
				},
				r: .4,
				color: CATEGORY_COLOR[ac.category],
				fill: CATEGORY_COLOR[ac.category],
				fillOpacity: .92,
				weight: 0
			}), /* @__PURE__ */ jsx(Label, {
				x: center.x,
				y: cy,
				text: `${ac.name} ${money(balanceOf(ac.id))}`,
				color: "var(--stage-fg)",
				size: 11,
				dx: leftPan ? -22 : 22,
				anchor: leftPan ? "end" : "start"
			})] }, ac.id);
		});
	};
	const next = transactions[applied];
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs(Stage, {
			view: VIEW,
			height,
			preserveAspect: true,
			ariaLabel: `Balance: assets ${money(assets)}, liabilities plus equity ${money(rhs)}, ${balanced ? "level" : "tipped"}`,
			children: [
				/* @__PURE__ */ jsx(StageAssetDefs, {}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: -6.4,
						y: 3
					},
					to: {
						x: -2,
						y: 3
					},
					color: CATEGORY_COLOR.Asset,
					opacity: .4,
					weight: 1,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Label, {
					x: -4.2,
					y: 3,
					text: "ASSETS",
					color: CATEGORY_COLOR.Asset,
					size: 11,
					dy: -12
				}),
				/* @__PURE__ */ jsx(Label, {
					x: 4.2,
					y: 3,
					text: "LIABILITIES + EQUITY",
					color: CATEGORY_COLOR.Equity,
					size: 11,
					dy: -12
				}),
				/* @__PURE__ */ jsx(ScaleFrame, {
					pivot: PIVOT,
					beamA,
					beamB,
					trayLC,
					trayRC,
					baseY: BASE_Y,
					panR: PAN_R,
					balanced
				}),
				coins(trayLC, ["Asset"]),
				coins(trayRC, ["Liability", "Equity"]),
				/* @__PURE__ */ jsx(Label, {
					x: 0,
					y: BASE_Y - .4,
					text: `A ${money(assets)}  =  L ${money(liabilities + extraLE)} + E ${money(equity)}`,
					color: "var(--stage-fg)",
					size: 13,
					weight: 700
				})
			]
		})
	}), /* @__PURE__ */ jsx(LiveRegion, { children: `Assets ${money(assets)}, Liabilities plus Equity ${money(rhs)}. ${balanced ? "Balanced." : "Not balanced."}` })] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "transaction",
			value: `${applied}/${transactions.length}`,
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "flex",
					flexWrap: "wrap",
					gap: 10,
					alignItems: "center"
				},
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "lab-chip",
					onClick: () => setApplied((n) => Math.max(0, n - 1)),
					disabled: applied === 0,
					children: "◀ Back"
				}), /* @__PURE__ */ jsx(CheckButton, {
					onClick: () => setApplied((n) => Math.min(transactions.length, n + 1)),
					disabled: applied >= transactions.length,
					children: next ? `Apply: ${next.label}` : "All applied"
				})]
			})
		}), freePost && /* @__PURE__ */ jsx(Field, {
			label: "free-post (one side only)",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "flex",
					flexWrap: "wrap",
					gap: 10,
					alignItems: "center"
				},
				children: [
					/* @__PURE__ */ jsx(Chip, {
						selected: false,
						onClick: () => setExtraA((v) => v + 2e3),
						children: "+2,000 Assets"
					}),
					/* @__PURE__ */ jsx(Chip, {
						selected: false,
						onClick: () => setExtraLE((v) => v + 2e3),
						children: "+2,000 L+E"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "lab-chip",
						onClick: () => {
							setExtraA(0);
							setExtraLE(0);
						},
						children: "reset"
					})
				]
			})
		})] }),
		footer: /* @__PURE__ */ jsx(StatusPill, {
			ok: balanced,
			children: balanced ? "Books balance ✓" : `Off by ${money(Math.abs(imbalance))}, not balanced`
		}),
		children: figure
	});
}

//#endregion
export { EquationBalanceLab };