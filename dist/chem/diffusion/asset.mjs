'use client';

import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCoords } from "@classytic/stage";

//#region src/chem/diffusion/asset.tsx
const numOr = (v, d) => typeof v === "number" && Number.isFinite(v) ? v : d;
const arr = (v) => Array.isArray(v) ? v : [];
const A = "var(--stage-accent)";
const B = "var(--stage-danger, #e03131)";
function resolver({ sim, params }) {
	return {
		kind: "asset-geom",
		parts: {},
		meta: {
			px: arr(sim?.px),
			py: arr(sim?.py),
			group: arr(sim?.group),
			w: numOr(params?.w, 12),
			h: numOr(params?.h, 6),
			mixed: numOr(sim?.mixed, 0)
		}
	};
}
function Component({ geom }) {
	const c = useCoords();
	const m = geom.meta ?? {};
	const P = (x, y) => c.toPx(x, y);
	const [bx0, by0] = P(0, 0);
	const [bx1, by1] = P(m.w, m.h);
	const x = Math.min(bx0, bx1), y = Math.min(by0, by1);
	const w = Math.abs(bx1 - bx0), h = Math.abs(by1 - by0);
	const pct = Math.round(m.mixed * 100);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("rect", {
			x,
			y,
			width: w,
			height: h,
			rx: 8,
			fill: "color-mix(in oklab, var(--stage-accent) 4%, var(--stage-bg))",
			stroke: "var(--stage-grid)",
			strokeWidth: 1.5
		}),
		m.px.map((_, i) => {
			const [cx, cy] = P(m.px[i], m.py[i]);
			return /* @__PURE__ */ jsx("circle", {
				cx,
				cy,
				r: 4.5,
				fill: m.group[i] === 0 ? A : B,
				opacity: .92
			}, i);
		}),
		/* @__PURE__ */ jsxs("text", {
			x: x + 12,
			y: y + 20,
			fontSize: 13,
			fontWeight: 700,
			fill: "var(--stage-fg)",
			style: { fontVariantNumeric: "tabular-nums" },
			children: [
				"mixed: ",
				pct,
				"%"
			]
		})
	] });
}
const DIFFUSION_ASSET = {
	resolver,
	Component
};

//#endregion
export { DIFFUSION_ASSET };