import { EquationBalanceLab } from "../commerce/accounting/equation-balance.mjs";
import { JournalPosterLab } from "../commerce/accounting/journal-poster.mjs";
import { StatementSorterLab } from "../commerce/accounting/statement-sorter.mjs";
import { ChipToggle, ConfigPanel, ConfigRow, NumField, RowsEditor, SelectField, SmallButton, TextField } from "./authoring.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/accounting.tsx
const CATEGORIES = [
	"Asset",
	"Liability",
	"Equity",
	"Income",
	"Expense"
];
/** Chart-of-accounts editor: id + name + a category dropdown (no raw JSON). */
function AccountsEditor({ accounts, onChange }) {
	return /* @__PURE__ */ jsx(RowsEditor, {
		rows: accounts,
		onChange,
		addLabel: "account",
		newRow: () => ({
			id: "",
			name: "",
			category: "Asset"
		}),
		columns: [
			{
				key: "id",
				label: "id"
			},
			{
				key: "name",
				label: "name",
				grow: true
			},
			{
				key: "category",
				label: "category",
				type: "select",
				options: CATEGORIES
			}
		]
	});
}
/** Transactions editor for the balance lab: a label + signed effects on accounts. */
function TxnEffectsEditor({ txns, accountIds, onChange }) {
	const setTxn = (i, patch) => onChange(txns.map((t, j) => j === i ? {
		...t,
		...patch
	} : t));
	const setEffect = (ti, ei, patch) => setTxn(ti, { effects: txns[ti].effects.map((e, j) => j === ei ? {
		...e,
		...patch
	} : e) });
	return /* @__PURE__ */ jsxs("div", {
		className: "w-full space-y-2",
		children: [txns.map((t, ti) => /* @__PURE__ */ jsxs("div", {
			className: "space-y-1.5 rounded-md border border-border/60 bg-background/40 p-2",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-1.5",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] text-muted-foreground",
						children: "when"
					}),
					/* @__PURE__ */ jsx(TextField, {
						value: t.label,
						placeholder: "Owner invests $10,000 cash",
						onChange: (v) => setTxn(ti, { label: v }),
						className: "flex-1 text-[11px]"
					}),
					/* @__PURE__ */ jsx(SmallButton, {
						tone: "danger",
						onClick: () => onChange(txns.filter((_, j) => j !== ti)),
						children: "✕"
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "space-y-1 pl-3",
				children: [t.effects.map((e, ei) => /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-1.5",
					children: [
						/* @__PURE__ */ jsx(SelectField, {
							value: e.account,
							options: accountIds,
							onChange: (v) => setEffect(ti, ei, { account: v })
						}),
						/* @__PURE__ */ jsx("span", {
							className: "text-[11px] text-muted-foreground",
							children: "changes by"
						}),
						/* @__PURE__ */ jsx(NumField, {
							value: e.delta,
							onChange: (v) => setEffect(ti, ei, { delta: v })
						}),
						/* @__PURE__ */ jsx(SmallButton, {
							tone: "danger",
							onClick: () => setTxn(ti, { effects: t.effects.filter((_, j) => j !== ei) }),
							children: "−"
						})
					]
				}, ei)), /* @__PURE__ */ jsx(SmallButton, {
					onClick: () => setTxn(ti, { effects: [...t.effects, {
						account: accountIds[0] ?? "",
						delta: 0
					}] }),
					children: "+ effect"
				})]
			})]
		}, ti)), /* @__PURE__ */ jsx(SmallButton, {
			onClick: () => onChange([...txns, {
				id: `t${txns.length + 1}`,
				label: "",
				effects: []
			}]),
			children: "+ transaction"
		})]
	});
}
const DEFAULT_ACCOUNTS = [
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
const DEFAULT_TXNS = [
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
const asAccounts = (raw) => Array.isArray(raw) && raw.length ? raw : DEFAULT_ACCOUNTS;
const asTxns = (raw) => Array.isArray(raw) && raw.length ? raw : DEFAULT_TXNS;
const EquationBalanceBlock = defineBlock({
	key: "equation-balance",
	tag: "EquationBalance",
	void: true,
	label: "Accounting equation balance (A = L + E)",
	description: "Apply transactions onto a two-pan scale (Assets vs Liabilities + Equity); the beam re-levels after each balanced entry, and a free-post mode tips the books to drill the misconception. Author the chart of accounts + transactions.",
	category: "interactive",
	schema: z.object({
		accounts: z.array(z.object({
			id: z.string(),
			name: z.string(),
			category: z.enum([
				"Asset",
				"Liability",
				"Equity",
				"Income",
				"Expense"
			])
		})).default(DEFAULT_ACCOUNTS),
		transactions: z.array(z.object({
			id: z.string(),
			label: z.string(),
			effects: z.array(z.object({
				account: z.string(),
				delta: z.number()
			}))
		})).default(DEFAULT_TXNS),
		freePost: z.boolean().default(false),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const accounts = asAccounts(attributes.accounts);
		const transactions = asTxns(attributes.transactions);
		const widget = /* @__PURE__ */ jsx(EquationBalanceLab, {
			accounts,
			transactions,
			freePost: attributes.freePost,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const upd = updateAttributes;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "The balance sheet that must stay level"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "free-post drill",
				children: /* @__PURE__ */ jsx(ChipToggle, {
					active: !!attributes.freePost,
					onClick: () => updateAttributes({ freePost: !attributes.freePost }),
					children: "tip the books"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "accounts",
				children: /* @__PURE__ */ jsx(AccountsEditor, {
					accounts,
					onChange: (v) => upd({ accounts: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "transactions",
				children: /* @__PURE__ */ jsx(TxnEffectsEditor, {
					txns: transactions,
					accountIds: accounts.map((a) => a.id),
					onChange: (v) => upd({ transactions: v })
				})
			})
		] }), widget] });
	}
});
const accountCatSchema = z.object({
	id: z.string(),
	name: z.string(),
	category: z.enum([
		"Asset",
		"Liability",
		"Equity",
		"Income",
		"Expense"
	])
});
const asJournalTxns = (raw) => Array.isArray(raw) && raw.length ? raw : void 0;
const asSortAccounts = (raw) => Array.isArray(raw) && raw.length ? raw : void 0;
const JournalPosterBlock = defineBlock({
	key: "journal-poster",
	tag: "JournalPoster",
	void: true,
	label: "Journal poster (debits, credits & T-accounts)",
	description: "Learner picks the debit (left) + credit (right) account for each authored event; instant coached feedback fills the T-accounts and a live trial balance. Author the chart of accounts + the events.",
	category: "interactive",
	schema: z.object({
		accounts: z.array(accountCatSchema).optional(),
		transactions: z.array(z.object({
			id: z.string(),
			prompt: z.string(),
			debit: z.string(),
			credit: z.string(),
			amount: z.number()
		})).optional(),
		showTrialBalance: z.boolean().default(true),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const accounts = asAccounts(attributes.accounts);
		const ids = accounts.map((a) => a.id);
		const txns = asJournalTxns(attributes.transactions) ?? [];
		const widget = /* @__PURE__ */ jsx(JournalPosterLab, {
			accounts,
			transactions: asJournalTxns(attributes.transactions),
			showTrialBalance: attributes.showTrialBalance,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const upd = updateAttributes;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "Post the entry"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "accounts",
				children: /* @__PURE__ */ jsx(AccountsEditor, {
					accounts,
					onChange: (v) => upd({ accounts: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "events",
				children: /* @__PURE__ */ jsx(RowsEditor, {
					rows: txns,
					onChange: (v) => upd({ transactions: v }),
					addLabel: "event",
					newRow: () => ({
						id: `e${txns.length + 1}`,
						prompt: "",
						debit: ids[0] ?? "",
						credit: ids[1] ?? ids[0] ?? "",
						amount: 0
					}),
					columns: [
						{
							key: "prompt",
							label: "event",
							grow: true
						},
						{
							key: "debit",
							label: "debit",
							type: "select",
							options: ids
						},
						{
							key: "credit",
							label: "credit",
							type: "select",
							options: ids
						},
						{
							key: "amount",
							label: "amount",
							type: "number"
						}
					]
				})
			})
		] }), widget] });
	}
});
const StatementSorterBlock = defineBlock({
	key: "statement-sorter",
	tag: "StatementSorter",
	void: true,
	label: "Statement sorter (the two statements)",
	description: "Sort each account into the Income Statement or the Balance Sheet (coached), then close the books to carry net profit into Equity and watch A = L + E hold. Author the accounts + balances.",
	category: "interactive",
	schema: z.object({
		accounts: z.array(accountCatSchema.extend({ balance: z.number() })).optional(),
		asOfLabel: z.string().optional(),
		showClosing: z.boolean().default(true),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const sortAccounts = asSortAccounts(attributes.accounts) ?? [];
		const widget = /* @__PURE__ */ jsx(StatementSorterLab, {
			accounts: asSortAccounts(attributes.accounts),
			asOfLabel: attributes.asOfLabel,
			showClosing: attributes.showClosing,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const upd = updateAttributes;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [/* @__PURE__ */ jsx(ConfigRow, {
			label: "title",
			children: /* @__PURE__ */ jsx(TextField, {
				value: attributes.title ?? "",
				onChange: (v) => updateAttributes({ title: v }),
				placeholder: "Sort into the statements"
			})
		}), /* @__PURE__ */ jsx(ConfigRow, {
			label: "accounts + balances",
			children: /* @__PURE__ */ jsx(RowsEditor, {
				rows: sortAccounts,
				onChange: (v) => upd({ accounts: v }),
				addLabel: "account",
				newRow: () => ({
					id: "",
					name: "",
					category: "Asset",
					balance: 0
				}),
				columns: [
					{
						key: "id",
						label: "id"
					},
					{
						key: "name",
						label: "name",
						grow: true
					},
					{
						key: "category",
						label: "category",
						type: "select",
						options: CATEGORIES
					},
					{
						key: "balance",
						label: "balance",
						type: "number"
					}
				]
			})
		})] }), widget] });
	}
});
/** This domain's block specs + tag→component render map. */
const accountingBlocks = [
	EquationBalanceBlock,
	JournalPosterBlock,
	StatementSorterBlock
];
const accountingComponents = {
	EquationBalance: EquationBalanceLab,
	JournalPoster: JournalPosterLab,
	StatementSorter: StatementSorterLab
};

//#endregion
export { EquationBalanceBlock, JournalPosterBlock, StatementSorterBlock, accountingBlocks, accountingComponents };