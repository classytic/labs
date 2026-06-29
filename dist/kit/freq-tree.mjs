'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/freq-tree.tsx
function countLeaves(n) {
	return n.children?.length ? n.children.reduce((s, c) => s + countLeaves(c), 0) : 1;
}
function depth(n) {
	return n.children?.length ? 1 + Math.max(...n.children.map(depth)) : 0;
}
function FrequencyTree({ root, width = 360, ariaLabel = "Natural-frequency tree" }) {
	const NODE_W = 88, NODE_H = 34, ROW = 46, PADY = 8, PADX = 4;
	const leaves = countLeaves(root);
	const levels = depth(root);
	const H = PADY * 2 + leaves * ROW;
	const colGap = levels > 0 ? (width - 2 * PADX - NODE_W) / levels : 0;
	const placed = [];
	let cursor = 0;
	const walk = (node, level, parent) => {
		const idx = placed.length;
		placed.push({
			node,
			x: PADX + level * colGap,
			y: 0,
			parent
		});
		let y;
		if (!node.children?.length) {
			y = PADY + (cursor + .5) * ROW;
			cursor++;
		} else {
			const ys = node.children.map((ch) => walk(ch, level + 1, idx));
			y = (Math.min(...ys) + Math.max(...ys)) / 2;
		}
		placed[idx].y = y;
		return y;
	};
	walk(root, 0, -1);
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: `0 0 ${width} ${H}`,
		style: {
			width: "100%",
			maxWidth: width,
			height: "auto"
		},
		role: "img",
		"aria-label": ariaLabel,
		children: [placed.map((p, i) => {
			if (p.parent < 0) return null;
			const par = placed[p.parent];
			const x1 = par.x + NODE_W;
			const x2 = p.x;
			const mx = (x1 + x2) / 2;
			return /* @__PURE__ */ jsx("path", {
				d: `M ${x1} ${par.y} C ${mx} ${par.y}, ${mx} ${p.y}, ${x2} ${p.y}`,
				fill: "none",
				stroke: p.node.color ?? "var(--stage-grid)",
				strokeWidth: 1.5,
				opacity: .55
			}, `e${i}`);
		}), placed.map((p, i) => {
			const accent = p.node.color ?? "var(--stage-fg)";
			const fill = p.node.lit ? `color-mix(in oklab, ${accent} 26%, var(--stage-bg))` : "color-mix(in oklab, var(--stage-fg) 5%, var(--stage-bg))";
			const stroke = p.node.color ?? "var(--stage-grid)";
			return /* @__PURE__ */ jsxs("g", { children: [
				/* @__PURE__ */ jsx("rect", {
					x: p.x,
					y: p.y - NODE_H / 2,
					width: NODE_W,
					height: NODE_H,
					rx: 8,
					fill,
					stroke,
					strokeWidth: p.node.lit ? 1.75 : 1
				}),
				/* @__PURE__ */ jsx("text", {
					x: p.x + 9,
					y: p.y - 2,
					fontSize: 13,
					fontWeight: 800,
					fill: accent,
					style: { fontVariantNumeric: "tabular-nums" },
					children: Math.round(p.node.count).toLocaleString()
				}),
				/* @__PURE__ */ jsx("text", {
					x: p.x + 9,
					y: p.y + 11,
					fontSize: 9.5,
					fill: "var(--stage-muted)",
					children: p.node.label
				})
			] }, `n${i}`);
		})]
	});
}

//#endregion
export { FrequencyTree };