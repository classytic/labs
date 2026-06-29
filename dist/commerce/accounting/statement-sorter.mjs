'use client';

import { CheckButton, StatusPill } from "../../kit/controls.mjs";
import { LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { CATEGORY_COLOR, money, statementOf } from "./core.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/commerce/accounting/statement-sorter.tsx
/**
* StatementSorterLab, sort the accounts into the two statements.
*
* The financial statements aren't new objects, they're a SORTING of the ledger
* accounts into their home: Income/Expense → Income Statement (this period's
* "result"), Asset/Liability/Equity → Balance Sheet (the cumulative "standing").
* The learner sends each account to a statement (wrong picks are coached, not just
* marked wrong); then "Close the books" carries net profit (Income − Expense) into
* Equity and the Balance Sheet equation A = L + E visibly holds.
*
* Reuses the accounting core (statementOf / equationParts). No ledger dep.
*/
const DEMO = [
	{
		id: "cash",
		name: "Cash",
		category: "Asset",
		balance: 13200
	},
	{
		id: "equip",
		name: "Equipment",
		category: "Asset",
		balance: 3e3
	},
	{
		id: "loan",
		name: "Bank loan",
		category: "Liability",
		balance: 5e3
	},
	{
		id: "capital",
		name: "Capital",
		category: "Equity",
		balance: 1e4
	},
	{
		id: "sales",
		name: "Sales",
		category: "Income",
		balance: 2e3
	},
	{
		id: "rent",
		name: "Rent expense",
		category: "Expense",
		balance: 800
	}
];
function StatementSorterLab({ accounts = DEMO, asOfLabel = "", showClosing = true, title = "Sort the accounts into the two statements", prompt = "Income & Expense → Income Statement; Asset, Liability & Equity → Balance Sheet.", objectives }) {
	const [place, setPlace] = useState({});
	const [closed, setClosed] = useState(false);
	const [hint, setHint] = useState(null);
	const send = (a, tray) => {
		if (tray === (statementOf(a.category) === "Income Statement" ? "IS" : "BS")) {
			setPlace((p) => ({
				...p,
				[a.id]: tray
			}));
			setHint(null);
		} else setHint(`${a.name} is ${a.category === "Asset" || a.category === "Income" ? "an" : "a"} ${a.category}, it belongs on the ${statementOf(a.category)}.`);
	};
	const unsorted = accounts.filter((a) => !place[a.id]);
	const inTray = (t) => accounts.filter((a) => place[a.id] === t);
	const profit = accounts.filter((a) => a.category === "Income").reduce((s, a) => s + a.balance, 0) - accounts.filter((a) => a.category === "Expense").reduce((s, a) => s + a.balance, 0);
	const assets = accounts.filter((a) => a.category === "Asset").reduce((s, a) => s + a.balance, 0);
	const liabilities = accounts.filter((a) => a.category === "Liability").reduce((s, a) => s + a.balance, 0);
	const equity = accounts.filter((a) => a.category === "Equity").reduce((s, a) => s + a.balance, 0) + (closed ? profit : 0);
	const balanced = Math.abs(assets - (liabilities + equity)) < .005;
	const allSorted = unsorted.length === 0;
	useCheckpoint({
		solved: closed,
		activity: "statement-sorter"
	});
	const close = () => {
		setClosed(true);
	};
	const Row = ({ a }) => /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			justifyContent: "space-between",
			padding: "2px 0",
			fontSize: 12,
			fontVariantNumeric: "tabular-nums"
		},
		children: [/* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", { style: {
			display: "inline-block",
			width: 8,
			height: 8,
			borderRadius: 2,
			background: CATEGORY_COLOR[a.category],
			marginRight: 6
		} }), a.name] }), /* @__PURE__ */ jsx("span", {
			style: { fontWeight: 600 },
			children: money(a.balance)
		})]
	});
	const trayStyle = {
		flex: 1,
		minWidth: 180,
		borderRadius: 10,
		border: "1px solid var(--stage-grid)",
		background: "var(--stage-bg)",
		padding: 12
	};
	const figure = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			gap: 12,
			flexWrap: "wrap"
		},
		children: [/* @__PURE__ */ jsxs("div", {
			style: trayStyle,
			children: [
				/* @__PURE__ */ jsxs("p", {
					style: {
						margin: "0 0 6px",
						fontWeight: 700,
						fontSize: 13
					},
					children: ["Income Statement ", /* @__PURE__ */ jsx("span", {
						style: {
							color: "var(--stage-muted)",
							fontWeight: 400
						},
						children: "· this period"
					})]
				}),
				inTray("IS").map((a) => /* @__PURE__ */ jsx(Row, { a }, a.id)),
				inTray("IS").length === 0 && /* @__PURE__ */ jsx("p", {
					style: {
						fontSize: 12,
						color: "var(--stage-muted)"
					},
					children: "drop Income & Expense here"
				}),
				allSorted && /* @__PURE__ */ jsxs("div", {
					style: {
						marginTop: 8,
						paddingTop: 6,
						borderTop: "1px solid var(--stage-grid)",
						fontWeight: 700,
						fontVariantNumeric: "tabular-nums",
						color: profit >= 0 ? "var(--stage-good)" : "var(--stage-danger)"
					},
					children: [
						"Net ",
						profit >= 0 ? "profit" : "loss",
						": ",
						money(Math.abs(profit))
					]
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				...trayStyle,
				borderColor: closed && balanced ? "var(--stage-good)" : "var(--stage-grid)"
			},
			children: [
				/* @__PURE__ */ jsxs("p", {
					style: {
						margin: "0 0 6px",
						fontWeight: 700,
						fontSize: 13
					},
					children: ["Balance Sheet ", /* @__PURE__ */ jsxs("span", {
						style: {
							color: "var(--stage-muted)",
							fontWeight: 400
						},
						children: ["· standing", asOfLabel ? ` ${asOfLabel}` : ""]
					})]
				}),
				inTray("BS").map((a) => /* @__PURE__ */ jsx(Row, { a }, a.id)),
				inTray("BS").length === 0 && /* @__PURE__ */ jsx("p", {
					style: {
						fontSize: 12,
						color: "var(--stage-muted)"
					},
					children: "drop Asset, Liability & Equity here"
				}),
				closed && /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						justifyContent: "space-between",
						padding: "2px 0",
						fontSize: 12,
						fontVariantNumeric: "tabular-nums",
						color: "var(--stage-accent)"
					},
					children: [/* @__PURE__ */ jsx("span", { children: "+ retained profit → Equity" }), /* @__PURE__ */ jsx("span", {
						style: { fontWeight: 700 },
						children: money(profit)
					})]
				}),
				allSorted && /* @__PURE__ */ jsxs("div", {
					style: {
						marginTop: 8,
						paddingTop: 6,
						borderTop: "1px solid var(--stage-grid)",
						fontWeight: 700,
						fontVariantNumeric: "tabular-nums"
					},
					children: [
						"A ",
						money(assets),
						" ",
						balanced ? "=" : "≠",
						" L ",
						money(liabilities),
						" + E ",
						money(equity)
					]
				})
			]
		})]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [unsorted.length > 0 ? /* @__PURE__ */ jsxs("div", {
			style: { marginTop: 12 },
			children: [hint && /* @__PURE__ */ jsx("p", {
				style: {
					fontSize: 12,
					color: "var(--stage-warn)",
					margin: "0 0 6px",
					fontWeight: 600
				},
				children: hint
			}), /* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					flexWrap: "wrap",
					gap: 8
				},
				children: unsorted.map((a) => /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 6,
						padding: "6px 8px",
						borderRadius: 8,
						border: "1px solid var(--stage-grid)"
					},
					children: [
						/* @__PURE__ */ jsxs("span", {
							style: {
								fontSize: 13,
								fontWeight: 600
							},
							children: [/* @__PURE__ */ jsx("span", { style: {
								display: "inline-block",
								width: 8,
								height: 8,
								borderRadius: 2,
								background: CATEGORY_COLOR[a.category],
								marginRight: 6
							} }), a.name]
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "lab-chip",
							onClick: () => send(a, "IS"),
							children: "Income St."
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "lab-chip",
							onClick: () => send(a, "BS"),
							children: "Balance Sh."
						})
					]
				}, a.id))
			})]
		}) : /* @__PURE__ */ jsxs("div", {
			className: "lab-bar",
			style: { gap: 10 },
			children: [showClosing && !closed && /* @__PURE__ */ jsx(CheckButton, {
				onClick: close,
				children: "Close the books → carry profit to Equity"
			}), closed && /* @__PURE__ */ jsx(StatusPill, {
				ok: balanced,
				children: balanced ? "Net profit carried to Equity, A = L + E holds ✓" : "Equation does not balance"
			})]
		}), /* @__PURE__ */ jsx(LiveRegion, { children: hint ?? (closed ? `Net profit ${money(profit)} carried to equity; assets ${money(assets)} equal liabilities plus equity ${money(liabilities + equity)}.` : `${unsorted.length} accounts left to sort.`) })] }),
		children: figure
	});
}

//#endregion
export { StatementSorterLab };