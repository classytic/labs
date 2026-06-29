'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/cluster.tsx
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
function DotCluster({ count, highlight = 0, size = 120, color = "color-mix(in oklab, var(--stage-fg) 55%, transparent)", highlightColor = "var(--stage-accent)", emphasis = false, label, value }) {
	const capH = label ? 24 : 6;
	const capB = value != null ? 30 : 6;
	const dishR = size / 2;
	const cx = dishR;
	const cy = capH + dishR;
	const total = capH + size + capB;
	const n = Math.max(0, Math.round(count));
	const dotR = Math.max(2.2, Math.min(7, dishR * .78 / Math.sqrt(Math.max(1, n))));
	const fitR = dishR - dotR - 3;
	const dots = [];
	for (let i = 0; i < n; i++) {
		const r = Math.sqrt((i + .5) / n) * fitR;
		const th = i * GOLDEN;
		const x = cx + r * Math.cos(th);
		const y = cy + r * Math.sin(th);
		const isNew = i >= n - highlight;
		dots.push(/* @__PURE__ */ jsx("circle", {
			cx: x,
			cy: y,
			r: dotR,
			fill: isNew ? highlightColor : color,
			opacity: isNew ? .95 : .8
		}, i));
	}
	return /* @__PURE__ */ jsxs("svg", {
		width: size,
		height: total,
		viewBox: `0 0 ${size} ${total}`,
		role: "img",
		"aria-label": `${label ? label + ": " : ""}${value != null && value !== "?" ? value : count} items`,
		children: [
			label && /* @__PURE__ */ jsx("text", {
				x: cx,
				y: 14,
				fontSize: 13,
				fontWeight: 700,
				fill: "var(--stage-fg)",
				textAnchor: "middle",
				children: label
			}),
			/* @__PURE__ */ jsx("circle", {
				cx,
				cy,
				r: dishR - 1,
				fill: "color-mix(in oklab, var(--stage-fg) 7%, transparent)",
				stroke: emphasis ? highlightColor : "color-mix(in oklab, var(--stage-fg) 22%, transparent)",
				strokeWidth: emphasis ? 2.5 : 1.5
			}),
			dots,
			value != null && /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("rect", {
				x: cx - 16,
				y: capH + size - 8,
				width: 32,
				height: 24,
				rx: 5,
				fill: "var(--stage-bg)",
				stroke: "color-mix(in oklab, var(--stage-fg) 30%, transparent)",
				strokeWidth: 1.5
			}), /* @__PURE__ */ jsx("text", {
				x: cx,
				y: capH + size + 4,
				fontSize: 14,
				fontWeight: 800,
				fill: "var(--stage-fg)",
				textAnchor: "middle",
				dominantBaseline: "middle",
				children: value
			})] })
		]
	});
}

//#endregion
export { DotCluster };