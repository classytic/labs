'use client';

import { CheckButton, Chip, StatusPill } from "../../kit/controls.mjs";
import { LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { RevealSolution } from "../../kit/pedagogy.mjs";
import { CATEGORY_COLOR, money, normalBalance } from "./core.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useLearner } from "@classytic/stage";

//#region src/commerce/accounting/journal-poster.tsx
/**
* JournalPosterLab, post the entry, fill the T-accounts, balance the trial.
*
* For each authored business event the learner picks the DEBIT account (left) and
* the CREDIT account (right) from the chart of accounts. On Post the lab gives
* INSTANT feedback: a correct entry drops into the matching T-accounts' left/right
* columns (green); a wrong pick is coached with the reason ("Cash is an Asset, it
* increases with a DEBIT, the left side") instead of just "wrong". A live trial
* balance sums ΣDebit vs ΣCredit and only reads level when they match.
*
* Reuses the shared accounting core (normalBalance / debit=credit), no ledger dep.
* The DEALER mnemonic + trial-balance traps belong in a paired MathDerivation.
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
	},
	{
		id: "sales",
		name: "Sales",
		category: "Income"
	},
	{
		id: "rent",
		name: "Rent expense",
		category: "Expense"
	}
];
const DEMO_TXNS = [
	{
		id: "t1",
		prompt: "Owner pays $10,000 into the business bank account",
		debit: "cash",
		credit: "capital",
		amount: 1e4
	},
	{
		id: "t2",
		prompt: "Take a $5,000 bank loan (cash received)",
		debit: "cash",
		credit: "loan",
		amount: 5e3
	},
	{
		id: "t3",
		prompt: "Buy equipment for $3,000 cash",
		debit: "equip",
		credit: "cash",
		amount: 3e3
	},
	{
		id: "t4",
		prompt: "Make a cash sale of $2,000",
		debit: "cash",
		credit: "sales",
		amount: 2e3
	},
	{
		id: "t5",
		prompt: "Pay $800 rent in cash",
		debit: "rent",
		credit: "cash",
		amount: 800
	}
];
function JournalPosterLab({ accounts = DEMO_ACCOUNTS, transactions = DEMO_TXNS, showTrialBalance = true, title = "Post the entry: fill the T-accounts", prompt = "Choose the debit (left) and credit (right) account for each event.", objectives }) {
	const [idx, setIdx] = useState(0);
	const [debitId, setDebitId] = useState(null);
	const [creditId, setCreditId] = useState(null);
	const [posted, setPosted] = useState([]);
	const [feedback, setFeedback] = useState(null);
	const [wrongHere, setWrongHere] = useState(false);
	const [peeked, setPeeked] = useState(0);
	const learner = useLearner();
	const reported = useRef(false);
	const nameOf = (id) => accounts.find((a) => a.id === id)?.name ?? id;
	const catOf = (id) => accounts.find((a) => a.id === id)?.category;
	const reason = (id) => {
		const c = catOf(id);
		if (!c) return "";
		const article = /^[AEIOU]/.test(c) ? "an" : "a";
		return `${nameOf(id)} is ${article} ${c}, it increases with a ${normalBalance(c).toUpperCase()} (${normalBalance(c) === "debit" ? "left" : "right"}).`;
	};
	const txn = transactions[idx];
	const allDone = idx >= transactions.length;
	const pick = (id) => {
		setFeedback(null);
		if (debitId === id) {
			setDebitId(null);
			return;
		}
		if (creditId === id) {
			setCreditId(null);
			return;
		}
		if (!debitId) setDebitId(id);
		else if (!creditId) setCreditId(id);
	};
	const post = () => {
		if (!txn || !debitId || !creditId) return;
		if (debitId === txn.debit && creditId === txn.credit) {
			setPosted((p) => [...p, {
				debit: txn.debit,
				credit: txn.credit,
				amount: txn.amount
			}]);
			setDebitId(null);
			setCreditId(null);
			setWrongHere(false);
			setFeedback({
				ok: true,
				msg: `Posted: debit ${nameOf(txn.debit)} ${money(txn.amount)}, credit ${nameOf(txn.credit)} ${money(txn.amount)} ✓`
			});
			const nextIdx = idx + 1;
			setIdx(nextIdx);
			if (nextIdx >= transactions.length && !reported.current) {
				reported.current = true;
				learner?.report({
					activity: "journal-poster",
					correct: peeked === 0,
					score: {
						raw: Math.max(0, transactions.length - peeked),
						max: transactions.length
					},
					completion: true
				});
			}
		} else {
			setWrongHere(true);
			setFeedback({
				ok: false,
				msg: `Not quite. ${reason(txn.debit)} ${reason(txn.credit)}`
			});
		}
	};
	const revealAnswer = () => {
		if (!txn) return;
		setDebitId(txn.debit);
		setCreditId(txn.credit);
		setFeedback(null);
		setPeeked((n) => n + 1);
	};
	const solutionNode = txn ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
		"Debit ",
		/* @__PURE__ */ jsx("b", {
			style: { color: CATEGORY_COLOR[catOf(txn.debit)] },
			children: nameOf(txn.debit)
		}),
		" (left), credit ",
		/* @__PURE__ */ jsx("b", {
			style: { color: CATEGORY_COLOR[catOf(txn.credit)] },
			children: nameOf(txn.credit)
		}),
		" (right).",
		/* @__PURE__ */ jsxs("span", {
			style: {
				display: "block",
				marginTop: 4,
				fontWeight: 400,
				fontSize: 12.5,
				opacity: .85
			},
			children: [
				reason(txn.debit),
				" ",
				reason(txn.credit)
			]
		})
	] }) : null;
	const tAccounts = accounts.map((a) => ({
		...a,
		debits: posted.filter((p) => p.debit === a.id).reduce((s, p) => s + p.amount, 0),
		credits: posted.filter((p) => p.credit === a.id).reduce((s, p) => s + p.amount, 0)
	})).filter((a) => a.debits > 0 || a.credits > 0);
	const sigmaDebit = posted.reduce((s, p) => s + p.amount, 0);
	const sigmaCredit = sigmaDebit;
	const cell = (filled) => ({
		flex: 1,
		padding: "4px 8px",
		fontVariantNumeric: "tabular-nums",
		fontWeight: 600,
		textAlign: filled ? "right" : "left",
		color: filled ? "var(--stage-fg)" : "transparent"
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		children: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
			style: {
				borderRadius: 14,
				background: "var(--stage-bg)",
				border: "1px solid var(--stage-grid)",
				padding: 16
			},
			children: [
				allDone ? /* @__PURE__ */ jsx("p", {
					style: {
						fontWeight: 700,
						color: "var(--stage-good)",
						margin: 0
					},
					children: "All entries posted ✓, the trial balance is level."
				}) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
					/* @__PURE__ */ jsxs("p", {
						style: {
							margin: "0 0 4px",
							fontSize: 12,
							color: "var(--stage-muted)",
							fontWeight: 700
						},
						children: [
							"Event ",
							idx + 1,
							" of ",
							transactions.length
						]
					}),
					/* @__PURE__ */ jsxs("p", {
						style: {
							margin: "0 0 10px",
							fontWeight: 600
						},
						children: [
							txn.prompt,
							" ",
							/* @__PURE__ */ jsxs("span", {
								style: { color: "var(--stage-accent)" },
								children: [
									"($",
									money(txn.amount),
									")"
								]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							gap: 8,
							marginBottom: 10,
							fontSize: 13
						},
						children: [/* @__PURE__ */ jsxs("span", {
							style: {
								flex: 1,
								padding: "6px 10px",
								borderRadius: 8,
								border: "1px dashed var(--stage-grid)",
								background: debitId ? "color-mix(in oklab, var(--stage-accent) 14%, transparent)" : "transparent"
							},
							children: ["DEBIT (left): ", /* @__PURE__ */ jsx("b", { children: debitId ? nameOf(debitId) : ", " })]
						}), /* @__PURE__ */ jsxs("span", {
							style: {
								flex: 1,
								padding: "6px 10px",
								borderRadius: 8,
								border: "1px dashed var(--stage-grid)",
								background: creditId ? "color-mix(in oklab, var(--stage-accent-2) 14%, transparent)" : "transparent"
							},
							children: ["CREDIT (right): ", /* @__PURE__ */ jsx("b", { children: creditId ? nameOf(creditId) : ", " })]
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						style: {
							display: "flex",
							flexWrap: "wrap",
							gap: 6,
							marginBottom: 10
						},
						children: accounts.map((a) => /* @__PURE__ */ jsxs(Chip, {
							selected: a.id === debitId || a.id === creditId,
							onClick: () => pick(a.id),
							children: [/* @__PURE__ */ jsx("span", { style: {
								display: "inline-block",
								width: 8,
								height: 8,
								borderRadius: 2,
								background: CATEGORY_COLOR[a.category],
								marginRight: 6
							} }), a.name]
						}, a.id))
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							gap: 8,
							alignItems: "center",
							flexWrap: "wrap"
						},
						children: [
							/* @__PURE__ */ jsx(CheckButton, {
								onClick: post,
								disabled: !debitId || !creditId,
								children: "Post entry"
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								className: "lab-chip",
								onClick: () => {
									setDebitId(null);
									setCreditId(null);
									setFeedback(null);
								},
								children: "clear"
							}),
							feedback && /* @__PURE__ */ jsx(StatusPill, {
								ok: feedback.ok,
								children: feedback.msg
							})
						]
					}),
					/* @__PURE__ */ jsx("div", {
						style: { marginTop: 10 },
						children: /* @__PURE__ */ jsx(RevealSolution, {
							available: wrongHere,
							solution: solutionNode,
							onReveal: revealAnswer,
							buttonLabel: "Show answer"
						}, idx)
					})
				] }),
				tAccounts.length > 0 && /* @__PURE__ */ jsx("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
						gap: 10,
						marginTop: 16
					},
					children: tAccounts.map((a) => {
						const bal = a.debits - a.credits;
						const onNormal = normalBalance(a.category) === "debit" ? bal : -bal;
						return /* @__PURE__ */ jsxs("div", {
							style: {
								borderRadius: 8,
								border: "1px solid var(--stage-grid)",
								overflow: "hidden",
								fontSize: 12
							},
							children: [
								/* @__PURE__ */ jsx("div", {
									style: {
										padding: "4px 8px",
										fontWeight: 700,
										color: "var(--stage-bg)",
										background: CATEGORY_COLOR[a.category]
									},
									children: a.name
								}),
								/* @__PURE__ */ jsxs("div", {
									style: {
										display: "flex",
										borderBottom: "1px solid var(--stage-grid)",
										background: "color-mix(in oklab, var(--stage-muted) 8%, transparent)"
									},
									children: [/* @__PURE__ */ jsx("span", {
										style: {
											flex: 1,
											padding: "2px 8px",
											fontSize: 10,
											fontWeight: 700,
											color: "var(--stage-muted)"
										},
										children: "Dr"
									}), /* @__PURE__ */ jsx("span", {
										style: {
											flex: 1,
											padding: "2px 8px",
											fontSize: 10,
											fontWeight: 700,
											color: "var(--stage-muted)",
											textAlign: "right"
										},
										children: "Cr"
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									style: {
										display: "flex",
										minHeight: 22
									},
									children: [/* @__PURE__ */ jsx("span", {
										style: cell(a.debits > 0),
										children: a.debits > 0 ? money(a.debits) : "·"
									}), /* @__PURE__ */ jsx("span", {
										style: {
											...cell(a.credits > 0),
											borderLeft: "1px solid var(--stage-grid)"
										},
										children: a.credits > 0 ? money(a.credits) : "·"
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									style: {
										padding: "3px 8px",
										textAlign: "right",
										fontWeight: 700,
										borderTop: "1px solid var(--stage-grid)",
										color: CATEGORY_COLOR[a.category]
									},
									children: [
										money(Math.abs(onNormal)),
										" ",
										normalBalance(a.category) === "debit" ? "Dr" : "Cr"
									]
								})
							]
						}, a.id);
					})
				}),
				showTrialBalance && posted.length > 0 && /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 14,
						marginTop: 14,
						paddingTop: 10,
						borderTop: "1px solid var(--stage-grid)",
						fontVariantNumeric: "tabular-nums",
						fontWeight: 700
					},
					children: [
						/* @__PURE__ */ jsx("span", { children: "Trial balance:" }),
						/* @__PURE__ */ jsxs("span", {
							style: { color: "var(--stage-accent)" },
							children: ["ΣDr ", money(sigmaDebit)]
						}),
						/* @__PURE__ */ jsxs("span", {
							style: { color: "var(--stage-accent-2)" },
							children: ["ΣCr ", money(sigmaCredit)]
						}),
						/* @__PURE__ */ jsx(StatusPill, {
							ok: sigmaDebit === sigmaCredit,
							children: sigmaDebit === sigmaCredit ? "level ✓" : "not level"
						})
					]
				})
			]
		}), /* @__PURE__ */ jsx(LiveRegion, { children: feedback?.msg ?? (allDone ? "All entries posted." : txn?.prompt) })] })
	});
}

//#endregion
export { JournalPosterLab };