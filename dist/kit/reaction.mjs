'use client';

import { MoleculeGlyph } from "./molecules.mjs";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/reaction.tsx
function ReactionFlow({ reactants, products, arrow = "right", height = 88, molSize = 30, ariaLabel }) {
	const GAP = 10, PLUS = 22, ARROW = 58, PAD = 14, COEF = 14;
	const cy = height / 2 - 6;
	const nodes = [];
	let x = PAD;
	const place = (terms, key) => {
		terms.forEach((t, i) => {
			const coef = t.coef ?? 1;
			if (coef > 1) {
				nodes.push(/* @__PURE__ */ jsx("text", {
					x,
					y: cy,
					fill: "var(--stage-fg)",
					fontSize: 14,
					fontWeight: 700,
					textAnchor: "middle",
					dominantBaseline: "central",
					children: coef
				}, `${key}c${i}`));
				x += COEF;
			}
			nodes.push(/* @__PURE__ */ jsx(MoleculeGlyph, {
				kind: t.kind,
				x: x + molSize / 2,
				y: cy,
				size: molSize,
				showLabel: true
			}, `${key}m${i}`));
			x += molSize + GAP;
			if (i < terms.length - 1) {
				nodes.push(/* @__PURE__ */ jsx("text", {
					x,
					y: cy,
					fill: "var(--stage-muted)",
					fontSize: 18,
					fontWeight: 700,
					textAnchor: "middle",
					dominantBaseline: "central",
					children: "+"
				}, `${key}p${i}`));
				x += PLUS;
			}
		});
	};
	place(reactants, "r");
	const ax = x + 6;
	if (arrow === "right") nodes.push(/* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
		x1: ax,
		y1: cy,
		x2: ax + ARROW - 12,
		y2: cy,
		stroke: "var(--stage-fg)",
		strokeWidth: 2.5
	}), /* @__PURE__ */ jsx("polygon", {
		points: `${ax + ARROW - 4},${cy} ${ax + ARROW - 14},${cy - 5} ${ax + ARROW - 14},${cy + 5}`,
		fill: "var(--stage-fg)"
	})] }, "arr"));
	else nodes.push(/* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
		x1: ax + 12,
		y1: cy,
		x2: ax + ARROW,
		y2: cy,
		stroke: "var(--stage-fg)",
		strokeWidth: 2.5
	}), /* @__PURE__ */ jsx("polygon", {
		points: `${ax + 4},${cy} ${ax + 14},${cy - 5} ${ax + 14},${cy + 5}`,
		fill: "var(--stage-fg)"
	})] }, "arr"));
	x += 62;
	place(products, "p");
	const W = x + PAD;
	return /* @__PURE__ */ jsx("div", {
		style: {
			overflowX: "auto",
			maxWidth: "100%"
		},
		children: /* @__PURE__ */ jsx("svg", {
			viewBox: `0 0 ${W} ${height}`,
			width: "100%",
			role: "img",
			"aria-label": ariaLabel,
			preserveAspectRatio: "xMidYMid meet",
			style: {
				display: "block",
				height: "auto",
				maxWidth: W,
				minWidth: Math.min(W, 300),
				margin: "0 auto"
			},
			children: nodes
		})
	});
}

//#endregion
export { ReactionFlow };