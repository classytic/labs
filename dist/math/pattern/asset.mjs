'use client';

import { num } from "../../core/util.mjs";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { StageAssetDefs, registerAsset, useCoords } from "@classytic/stage";

//#region src/math/pattern/asset.tsx
const asVec = (v, d) => v && typeof v === "object" && "x" in v ? v : d;
function resolver({ params }) {
	const o = asVec(params.origin, {
		x: 0,
		y: 0
	});
	const step = Math.max(1, Math.round(num(params.n, 1)));
	const a = Math.max(0, Math.round(num(params.a, 2)));
	const b = Math.max(0, Math.round(num(params.b, 1)));
	const cell = num(params.cell, .5);
	const s = cell - cell * .08;
	const cells = [];
	for (let r = 0; r < step; r++) for (let col = 0; col < a; col++) cells.push({
		x: o.x + col * cell,
		y: o.y + r * cell,
		s,
		role: "grow"
	});
	for (let col = 0; col < b; col++) cells.push({
		x: o.x + col * cell,
		y: o.y - cell * 1.5,
		s,
		role: "const"
	});
	const count = a * step + b;
	const widthCells = Math.max(a, b, 1);
	return {
		kind: "asset-geom",
		parts: { captionAt: {
			x: o.x + widthCells * cell / 2,
			y: o.y - cell * 2.6
		} },
		meta: {
			cells,
			n: step,
			count,
			a,
			b
		}
	};
}
function Component({ geom }) {
	const c = useCoords();
	const p = geom.parts;
	const m = geom.meta ?? {};
	const P = (v) => c.toPx(v.x, v.y);
	const renderCell = (cell, i) => {
		const [lx, ty] = P({
			x: cell.x,
			y: cell.y + cell.s
		});
		const wpx = c.sx(cell.s);
		return /* @__PURE__ */ jsx("rect", {
			x: lx,
			y: ty,
			width: wpx,
			height: c.sy(cell.s),
			rx: Math.min(4, wpx * .2),
			fill: cell.role === "grow" ? "url(#stage-grad-weight)" : "url(#stage-grad-weight-2)",
			stroke: "color-mix(in oklab, var(--stage-sheen) 32%, transparent)",
			strokeWidth: 1
		}, i);
	};
	const [cx, cy] = P(p.captionAt ?? {
		x: 0,
		y: 0
	});
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(StageAssetDefs, {}),
		/* @__PURE__ */ jsx("g", { children: (m.cells ?? []).map(renderCell) }),
		/* @__PURE__ */ jsxs("text", {
			x: cx,
			y: cy,
			fill: "var(--stage-fg)",
			fontSize: 13,
			fontWeight: 600,
			textAnchor: "middle",
			dominantBaseline: "hanging",
			children: [
				"n = ",
				m.n,
				" → ",
				m.count
			]
		})
	] });
}
const PATTERN_FIGURE_ASSET = {
	resolver,
	Component
};
registerAsset("pattern-figure", PATTERN_FIGURE_ASSET);

//#endregion
export { PATTERN_FIGURE_ASSET };