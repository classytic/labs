'use client';

import { num } from "../../core/util.mjs";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { StageAssetDefs, registerAsset, useCoords } from "@classytic/stage";

//#region src/math/area-model/asset.tsx
const asVec = (v, d) => v && typeof v === "object" && "x" in v ? v : d;
function resolver({ params, bound }) {
	const o = asVec(params.origin, {
		x: 0,
		y: 0
	});
	const a = Math.max(0, Math.round(num(params.a, 3)));
	const b = Math.max(0, Math.round(num(params.b, 2)));
	const u = num(params.unit, 1);
	const factorMode = num(params.mode, 0) === 1;
	const xv = Math.max(.4, num(bound.x, 2));
	const revealed = !factorMode || bound.revealed === true || bound.revealed === 1;
	const solved = bound.solved === true || bound.solved === 1;
	const regions = [];
	regions.push({
		x0: o.x,
		y0: o.y,
		x1: o.x + xv,
		y1: o.y + xv,
		role: "x2",
		label: "x²"
	});
	if (a > 0) regions.push({
		x0: o.x + xv,
		y0: o.y,
		x1: o.x + xv + a * u,
		y1: o.y + xv,
		role: "xterm",
		label: a === 1 ? "x" : `${a}x`
	});
	if (b > 0) regions.push({
		x0: o.x,
		y0: o.y + xv,
		x1: o.x + xv,
		y1: o.y + xv + b * u,
		role: "xterm",
		label: b === 1 ? "x" : `${b}x`
	});
	if (a > 0 && b > 0) regions.push({
		x0: o.x + xv,
		y0: o.y + xv,
		x1: o.x + xv + a * u,
		y1: o.y + xv + b * u,
		role: "const",
		label: String(a * b)
	});
	const grid = [];
	for (let k = 1; k < a; k++) grid.push([{
		x: o.x + xv + k * u,
		y: o.y
	}, {
		x: o.x + xv + k * u,
		y: o.y + xv + b * u
	}]);
	for (let k = 1; k < b; k++) grid.push([{
		x: o.x,
		y: o.y + xv + k * u
	}, {
		x: o.x + xv + a * u,
		y: o.y + xv + k * u
	}]);
	const w = xv + a * u;
	const h = xv + b * u;
	const sideBottom = {
		at: {
			x: o.x + w / 2,
			y: o.y
		},
		text: revealed ? `x${a ? ` + ${a}` : ""}` : "x + ?"
	};
	const sideLeft = {
		at: {
			x: o.x,
			y: o.y + h / 2
		},
		text: revealed ? `x${b ? ` + ${b}` : ""}` : "x + ?"
	};
	return {
		kind: "asset-geom",
		parts: {
			outline: [
				{
					x: o.x,
					y: o.y
				},
				{
					x: o.x + w,
					y: o.y
				},
				{
					x: o.x + w,
					y: o.y + h
				},
				{
					x: o.x,
					y: o.y + h
				}
			],
			split: [{
				x: o.x + xv,
				y: o.y
			}, {
				x: o.x + xv,
				y: o.y + h
			}],
			split2: [{
				x: o.x,
				y: o.y + xv
			}, {
				x: o.x + w,
				y: o.y + xv
			}]
		},
		meta: {
			regions,
			grid,
			sideBottom,
			sideLeft,
			solved,
			revealed,
			expanded: {
				sq: 1,
				lin: a + b,
				con: a * b
			}
		}
	};
}
const FILL = {
	x2: "url(#stage-grad-weight)",
	xterm: "url(#stage-grad-weight-2)",
	const: "url(#stage-grad-metal)"
};
function Component({ geom }) {
	const c = useCoords();
	const p = geom.parts;
	const m = geom.meta ?? {};
	const P = (v) => c.toPx(v.x, v.y);
	const good = m.solved ? "var(--stage-good)" : "var(--stage-metal)";
	const renderRegion = (r, i) => {
		const [lx, ty] = P({
			x: r.x0,
			y: r.y1
		});
		const [rx, by] = P({
			x: r.x1,
			y: r.y0
		});
		const wpx = Math.abs(rx - lx);
		const hpx = Math.abs(by - ty);
		const fs = Math.max(11, Math.min(22, Math.min(wpx, hpx) * .4));
		return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("rect", {
			x: lx,
			y: ty,
			width: wpx,
			height: hpx,
			rx: Math.min(6, Math.min(wpx, hpx) * .12),
			fill: FILL[r.role],
			stroke: "color-mix(in oklab, var(--stage-sheen) 32%, transparent)",
			strokeWidth: 1
		}), /* @__PURE__ */ jsx("text", {
			x: lx + wpx / 2,
			y: ty + hpx / 2,
			fill: "var(--stage-fg)",
			fontSize: fs,
			fontWeight: 700,
			textAnchor: "middle",
			dominantBaseline: "central",
			style: { pointerEvents: "none" },
			children: r.label
		})] }, `r${i}`);
	};
	const outline = p.outline ?? [];
	const [ox0, oy0] = P(outline[0] ?? {
		x: 0,
		y: 0
	});
	const [ox2, oy2] = P(outline[2] ?? {
		x: 0,
		y: 0
	});
	const sb = m.sideBottom;
	const [sbx, sby] = P(sb.at);
	const [slx, sly] = P(m.sideLeft.at);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(StageAssetDefs, {}), /* @__PURE__ */ jsxs("g", { children: [
		(m.regions ?? []).map(renderRegion),
		(m.grid ?? []).map(([g0, g1], i) => {
			const [x1, y1] = P(g0);
			const [x2, y2] = P(g1);
			return /* @__PURE__ */ jsx("line", {
				x1,
				y1,
				x2,
				y2,
				stroke: "color-mix(in oklab, var(--stage-sheen) 16%, transparent)",
				strokeWidth: 1
			}, `g${i}`);
		}),
		["split", "split2"].map((key) => {
			const seg = p[key];
			if (!seg) return null;
			const [x1, y1] = P(seg[0]);
			const [x2, y2] = P(seg[1]);
			return /* @__PURE__ */ jsx("line", {
				x1,
				y1,
				x2,
				y2,
				stroke: "color-mix(in oklab, var(--stage-sheen) 50%, transparent)",
				strokeWidth: 1.5
			}, key);
		}),
		/* @__PURE__ */ jsx("rect", {
			x: Math.min(ox0, ox2),
			y: Math.min(oy0, oy2),
			width: Math.abs(ox2 - ox0),
			height: Math.abs(oy2 - oy0),
			rx: 4,
			fill: "none",
			stroke: good,
			strokeWidth: 3
		}),
		m.solved && /* @__PURE__ */ jsx("rect", {
			x: Math.min(ox0, ox2),
			y: Math.min(oy0, oy2),
			width: Math.abs(ox2 - ox0),
			height: Math.abs(oy2 - oy0),
			rx: 4,
			fill: "none",
			stroke: "var(--stage-good)",
			strokeWidth: 14,
			opacity: .16
		}),
		/* @__PURE__ */ jsx("text", {
			x: sbx,
			y: sby + 20,
			fill: "var(--stage-fg)",
			fontSize: 14,
			fontWeight: 600,
			textAnchor: "middle",
			dominantBaseline: "hanging",
			children: sb.text
		}),
		/* @__PURE__ */ jsx("text", {
			x: slx - 12,
			y: sly,
			fill: "var(--stage-fg)",
			fontSize: 14,
			fontWeight: 600,
			textAnchor: "end",
			dominantBaseline: "central",
			children: m.sideLeft.text
		})
	] })] });
}
const AREA_MODEL_ASSET = {
	resolver,
	Component
};
registerAsset("area-model", AREA_MODEL_ASSET);

//#endregion
export { AREA_MODEL_ASSET };