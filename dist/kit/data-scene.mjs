'use client';

import { registerScene } from "./scenes.mjs";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/data-scene.tsx
const clamp01 = (n) => Math.max(0, Math.min(1, n));
const Cap = ({ label }) => label ? /* @__PURE__ */ jsx("span", {
	style: {
		fontSize: 12,
		fontWeight: 700,
		color: "var(--stage-fg)"
	},
	children: label
}) : null;
/** N icons, wrapped to fit; the last `highlight` stay vivid, the rest desaturate. */
function iconCountRender(icon) {
	return (q) => {
		const n = Math.max(0, Math.round(q.count ?? 0));
		const hl = q.highlight ?? 0;
		const w = q.width ?? 120, h = q.height ?? 130;
		const size = Math.max(12, Math.min(30, Math.sqrt(w * (h - 24) * .62 / Math.max(1, n))));
		return /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				justifyItems: "center",
				gap: 4
			},
			children: [
				/* @__PURE__ */ jsx("div", {
					role: "img",
					"aria-label": `${n} ${icon}`,
					style: {
						width: w,
						minHeight: h - (q.label ? 22 : 6),
						display: "flex",
						flexWrap: "wrap",
						alignContent: "center",
						justifyContent: "center",
						gap: 2
					},
					children: Array.from({ length: n }).map((_, i) => /* @__PURE__ */ jsx("span", {
						style: {
							fontSize: size,
							lineHeight: 1,
							opacity: i >= n - hl ? 1 : .92,
							filter: i < n - hl ? "saturate(0.5)" : "none",
							animation: `data-pop 0.3s ease-out ${i * .03}s backwards`
						},
						children: icon
					}, i))
				}),
				/* @__PURE__ */ jsx(Cap, { label: q.label }),
				/* @__PURE__ */ jsx("style", { children: `@keyframes data-pop{from{opacity:0;transform:scale(0.4)}to{opacity:1}}` })
			]
		});
	};
}
/** A fixed row of `slots` icons; round(frac·slots) are lit, the rest greyed (a rating). */
function iconLevelRender(icon, slots) {
	return (q) => {
		const lit = Math.round(clamp01(q.frac ?? 0) * slots);
		const w = q.width ?? 120;
		return /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				justifyItems: "center",
				gap: 6
			},
			children: [/* @__PURE__ */ jsx("div", {
				role: "img",
				"aria-label": `${lit} of ${slots}`,
				style: {
					width: w,
					display: "flex",
					flexWrap: "wrap",
					justifyContent: "center",
					gap: 4
				},
				children: Array.from({ length: slots }).map((_, i) => /* @__PURE__ */ jsx("span", {
					style: {
						fontSize: 26,
						opacity: i < lit ? 1 : .25,
						filter: i < lit ? "none" : "grayscale(1)",
						transition: "opacity 0.3s, filter 0.3s"
					},
					children: icon
				}, i))
			}), /* @__PURE__ */ jsx(Cap, { label: q.label })]
		});
	};
}
/** A coloured shape that fills with the fraction: a box / cup (fill up) or circle (pie). */
function shapeLevelRender(shape, color) {
	return (q) => {
		const w = q.width ?? 120, h = q.height ?? 150;
		const f = clamp01(q.frac ?? 0);
		const c = color ?? q.color ?? "var(--stage-accent)";
		const FG = "var(--stage-fg)", MUTED = "var(--stage-muted)";
		const aria = `${shape} ${f * 100 | 0}% full`;
		const lbl = q.label ? /* @__PURE__ */ jsx("text", {
			x: w / 2,
			y: h - 6,
			fontSize: 12,
			fontWeight: 700,
			fill: FG,
			textAnchor: "middle",
			children: q.label
		}) : null;
		if (shape === "circle") {
			const cx = w / 2, cy = (h - (q.label ? 22 : 8)) / 2 + 4, r = Math.min(cx, cy) - 8;
			const a = f * 2 * Math.PI, ex = cx + r * Math.sin(a), ey = cy - r * Math.cos(a), large = f > .5 ? 1 : 0;
			const d = f <= 0 ? "" : f >= 1 ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - .01} ${cy - r} Z` : `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
			return /* @__PURE__ */ jsxs("svg", {
				width: w,
				height: h,
				viewBox: `0 0 ${w} ${h}`,
				role: "img",
				"aria-label": aria,
				children: [
					/* @__PURE__ */ jsx("circle", {
						cx,
						cy,
						r,
						fill: "color-mix(in oklab, var(--stage-fg) 10%, transparent)",
						stroke: MUTED,
						strokeWidth: 1.5
					}),
					d && /* @__PURE__ */ jsx("path", {
						d,
						fill: c,
						fillOpacity: .85
					}),
					lbl
				]
			});
		}
		const bw = shape === "cup" ? Math.min(w - 24, 78) : w - 36, bx = (w - bw) / 2;
		const top = 12, bot = h - (q.label ? 28 : 12);
		const fillTop = bot - f * (bot - top);
		const outline = shape === "cup" ? `M ${bx + 5} ${top} L ${bx} ${bot} L ${bx + bw} ${bot} L ${bx + bw - 5} ${top}` : `M ${bx} ${top} L ${bx} ${bot} L ${bx + bw} ${bot} L ${bx + bw} ${top}`;
		return /* @__PURE__ */ jsxs("svg", {
			width: w,
			height: h,
			viewBox: `0 0 ${w} ${h}`,
			role: "img",
			"aria-label": aria,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: bx,
					y: fillTop,
					width: bw,
					height: Math.max(0, bot - fillTop),
					fill: c,
					fillOpacity: .5,
					style: { transition: "y 0.5s ease-out, height 0.5s ease-out" }
				}),
				/* @__PURE__ */ jsx("path", {
					d: outline,
					fill: "none",
					stroke: MUTED,
					strokeWidth: 2.5,
					strokeLinejoin: "round"
				}),
				lbl
			]
		});
	};
}
/** Build a registry scene from a data spec, no render code authored. */
function dataScene(spec) {
	if (spec.kind === "count") return {
		name: spec.name,
		kind: "count",
		label: spec.label ?? spec.name,
		render: iconCountRender(spec.icon)
	};
	if ("icon" in spec) return {
		name: spec.name,
		kind: "level",
		label: spec.label ?? spec.name,
		render: iconLevelRender(spec.icon, spec.slots ?? 5)
	};
	return {
		name: spec.name,
		kind: "level",
		label: spec.label ?? spec.name,
		render: shapeLevelRender(spec.shape, spec.color)
	};
}
/** Build AND register a data scene, so it appears in every lab + authoring picker. */
function registerDataScene(spec) {
	const meta = dataScene(spec);
	registerScene(meta);
	return meta;
}

//#endregion
export { dataScene, registerDataScene };