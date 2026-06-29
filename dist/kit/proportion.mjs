'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/proportion.tsx
function ProportionModel({ columns, size = 234, caption, result, resultColor = "var(--stage-good)", ariaLabel = "Proportion area model" }) {
	const OX = 12, OY = 16;
	const total = columns.reduce((s, c) => s + c.frac, 0) || 1;
	let acc = 0;
	const cols = columns.map((c) => {
		const x = OX + acc / total * size;
		acc += c.frac;
		return {
			c,
			x,
			w: c.frac / total * size
		};
	});
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: `0 0 ${size + 24} ${OY + size + (caption ? 18 : 0) + (result ? 20 : 0) + 8}`,
		style: {
			width: "100%",
			maxWidth: size + 90,
			height: "auto"
		},
		role: "img",
		"aria-label": ariaLabel,
		children: [
			cols.map(({ c, x, w }, ci) => {
				let ry = OY;
				return /* @__PURE__ */ jsxs("g", { children: [c.label && /* @__PURE__ */ jsx("text", {
					x: x + w / 2,
					y: OY - 4,
					textAnchor: w < size * .16 ? "start" : "middle",
					fontSize: 10,
					fill: "var(--stage-muted)",
					children: c.label
				}), c.rows.map((r, ri) => {
					const h = r.frac * size;
					const y = ry;
					ry += h;
					const big = w * h > 1400;
					return /* @__PURE__ */ jsxs("g", { children: [
						/* @__PURE__ */ jsx("rect", {
							x,
							y,
							width: Math.max(0, w),
							height: Math.max(0, h),
							fill: r.color,
							opacity: r.opacity ?? 1
						}),
						r.lit && /* @__PURE__ */ jsx("rect", {
							x,
							y,
							width: Math.max(1.5, w),
							height: Math.max(0, h),
							fill: "none",
							stroke: "var(--stage-fg)",
							strokeWidth: 1.75
						}),
						r.count != null && big && /* @__PURE__ */ jsx("text", {
							x: x + w / 2,
							y: y + h / 2,
							textAnchor: "middle",
							dominantBaseline: "central",
							fontSize: 11,
							fontWeight: 700,
							fill: r.lit ? "white" : "var(--stage-fg)",
							style: { pointerEvents: "none" },
							children: Math.round(r.count)
						})
					] }, ri);
				})] }, ci);
			}),
			cols.slice(1).map(({ x }, i) => /* @__PURE__ */ jsx("line", {
				x1: x,
				y1: OY,
				x2: x,
				y2: OY + size,
				stroke: "var(--stage-bg)",
				strokeWidth: 1
			}, i)),
			/* @__PURE__ */ jsx("rect", {
				x: OX,
				y: OY,
				width: size,
				height: size,
				fill: "none",
				stroke: "var(--stage-grid)",
				strokeWidth: 1
			}),
			caption && /* @__PURE__ */ jsx("text", {
				x: OX,
				y: OY + size + 15,
				fontSize: 10,
				fill: "var(--stage-muted)",
				children: caption
			}),
			result && /* @__PURE__ */ jsx("text", {
				x: OX,
				y: OY + size + (caption ? 33 : 17),
				fontSize: 11.5,
				fontWeight: 700,
				fill: resultColor,
				children: result
			})
		]
	});
}

//#endregion
export { ProportionModel };