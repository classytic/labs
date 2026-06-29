'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/receipt.tsx
const money = (currency, n) => `${currency}${Math.round(n * 100) / 100}`;
function ReceiptScene({ store = "Half Foods", items, currency = "$", revealItems = false, revealCost = false, width = 260 }) {
	const totalItems = items.reduce((s, it) => s + it.qty, 0);
	const totalCost = items.reduce((s, it) => s + it.qty * it.unit, 0);
	const row = {
		display: "flex",
		justifyContent: "space-between",
		gap: 12,
		alignItems: "baseline"
	};
	const muted = "var(--stage-muted)";
	return /* @__PURE__ */ jsxs("div", {
		className: "not-prose",
		role: "img",
		"aria-label": `Receipt from ${store}, ${items.length} line items`,
		style: {
			width,
			padding: 16,
			borderRadius: 14,
			border: "2px solid var(--stage-accent)",
			background: "color-mix(in oklab, var(--stage-fg) 4%, var(--stage-bg))",
			display: "grid",
			gap: 10,
			fontVariantNumeric: "tabular-nums"
		},
		children: [
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 8,
					fontWeight: 800,
					fontSize: 16
				},
				children: [/* @__PURE__ */ jsx("span", {
					"aria-hidden": true,
					style: {
						width: 22,
						height: 22,
						borderRadius: "50%",
						background: "conic-gradient(var(--stage-good) 0 25%, var(--stage-accent) 0 60%, var(--stage-warn) 0 100%)",
						display: "inline-block"
					}
				}), store]
			}),
			items.map((it, i) => /* @__PURE__ */ jsxs("div", {
				style: {
					...row,
					color: muted
				},
				children: [/* @__PURE__ */ jsxs("span", { children: [
					it.qty,
					" ",
					it.name
				] }), /* @__PURE__ */ jsxs("span", {
					style: { whiteSpace: "nowrap" },
					children: [money(currency, it.unit), " each"]
				})]
			}, i)),
			/* @__PURE__ */ jsx("div", { style: {
				borderTop: "1px dashed color-mix(in oklab, var(--stage-fg) 30%, transparent)",
				margin: "2px 0"
			} }),
			/* @__PURE__ */ jsxs("div", {
				style: {
					...row,
					fontWeight: 700
				},
				children: [/* @__PURE__ */ jsx("span", { children: "Total items" }), /* @__PURE__ */ jsx("span", {
					style: { color: revealItems ? "var(--stage-good)" : muted },
					children: revealItems ? totalItems : "—"
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					...row,
					fontWeight: 800
				},
				children: [/* @__PURE__ */ jsx("span", { children: "Total" }), /* @__PURE__ */ jsx("span", {
					style: { color: revealCost ? "var(--stage-good)" : muted },
					children: revealCost ? money(currency, totalCost) : "—"
				})]
			})
		]
	});
}

//#endregion
export { ReceiptScene };