//#region src/commerce/accounting/core.ts
/** Assets & Expenses grow on the LEFT (debit); the rest grow on the RIGHT (credit). */
function normalBalance(category) {
	return category === "Asset" || category === "Expense" ? "debit" : "credit";
}
/** Which financial statement an account lands on. */
function statementOf(category) {
	return category === "Income" || category === "Expense" ? "Income Statement" : "Balance Sheet";
}
/** A balanced entry has equal total debits and credits (within a cent). */
function debitsEqualCredits(lines) {
	let d = 0, c = 0;
	for (const l of lines) {
		d += l.debit ?? 0;
		c += l.credit ?? 0;
	}
	return Math.abs(d - c) < .005;
}
/**
* Sum signed account balances (natural terms: + = increase on the normal side)
* into the accounting-equation parts. Equity absorbs profit = Income − Expense,
* so `assets` should equal `liabilities + equity` whenever every posted entry
* was balanced.
*/
function equationParts(accounts, balanceOf) {
	let assets = 0, liabilities = 0, equityBase = 0, income = 0, expense = 0;
	for (const a of accounts) {
		const v = balanceOf(a.id);
		if (a.category === "Asset") assets += v;
		else if (a.category === "Liability") liabilities += v;
		else if (a.category === "Equity") equityBase += v;
		else if (a.category === "Income") income += v;
		else expense += v;
	}
	const profit = income - expense;
	return {
		assets,
		liabilities,
		equity: equityBase + profit,
		profit
	};
}
/** Category → CSS token colour, consistent across every accounting lab. */
const CATEGORY_COLOR = {
	Asset: "var(--stage-good)",
	Liability: "var(--stage-danger)",
	Equity: "var(--stage-accent)",
	Income: "var(--stage-accent-2)",
	Expense: "var(--stage-warn)"
};
/** Compact money label (e.g. 10000 → "10,000"). */
function money(n) {
	return Math.round(n).toLocaleString("en-US");
}

//#endregion
export { CATEGORY_COLOR, debitsEqualCredits, equationParts, money, normalBalance, statementOf };