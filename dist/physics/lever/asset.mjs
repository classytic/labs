'use client';

import { num, toRad } from "../../core/util.mjs";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { HangerHook, StageAssetDefs, WeightGlyph, XBlockGlyph, registerAsset, useCoords, vec } from "@classytic/stage";

//#region src/physics/lever/asset.tsx
const asVec = (v, d) => v && typeof v === "object" && "x" in v ? v : d;
const numOr = (v, d) => typeof v === "number" && Number.isFinite(v) ? v : typeof v === "boolean" ? v ? 1 : 0 : d;
function resolver({ params, bound }) {
	const pivot = asVec(params.pivot, {
		x: 0,
		y: 1.2
	});
	const arm = num(params.arm, 3.6);
	const unitGap = num(params.unitGap, .9);
	const count = Math.max(0, Math.round(num(params.count, 0)));
	const tiltDeg = num(bound.tilt, 0);
	const balanced = bound.balanced === true || bound.balanced === 1;
	const drop = .95;
	const rad = toRad(tiltDeg);
	const beamA = vec.rotateAbout({
		x: pivot.x - arm,
		y: pivot.y
	}, pivot, rad);
	const beamB = vec.rotateAbout({
		x: pivot.x + arm,
		y: pivot.y
	}, pivot, rad);
	const baseY = pivot.y - 1.3;
	const pedestal = [
		{
			x: pivot.x - .14,
			y: pivot.y - .05
		},
		{
			x: pivot.x + .14,
			y: pivot.y - .05
		},
		{
			x: pivot.x + .34,
			y: baseY
		},
		{
			x: pivot.x - .34,
			y: baseY
		}
	];
	const foot = [{
		x: pivot.x - .62,
		y: baseY
	}, {
		x: pivot.x + .62,
		y: baseY
	}];
	const ticks = [];
	const maxSlots = Math.round(arm / unitGap);
	for (let k = 1; k <= maxSlots; k++) for (const sgn of [-1, 1]) {
		const a = vec.rotateAbout({
			x: pivot.x + sgn * k * unitGap,
			y: pivot.y
		}, pivot, rad);
		ticks.push([a, {
			x: a.x,
			y: a.y - .16
		}]);
	}
	const items = [];
	for (let i = 0; i < count; i++) {
		const side = num(params[`s${i}`], 1);
		const dist = num(params[`d${i}`], 1);
		const kind = num(params[`k${i}`], 0) === 1 ? "x" : "const";
		const wv = numOr(bound[`w${i}`], 0);
		const anchor = vec.rotateAbout({
			x: pivot.x + side * dist * unitGap,
			y: pivot.y
		}, pivot, rad);
		items.push({
			anchor,
			cx: anchor.x,
			cy: anchor.y - drop,
			w: kind === "x" ? .6 : .72,
			h: kind === "x" ? .66 : .78,
			kind,
			label: kind === "x" ? "x" : String(Math.round(wv))
		});
	}
	return {
		kind: "asset-geom",
		parts: {
			pivot,
			beamA,
			beamB,
			pedestal,
			foot
		},
		meta: {
			items,
			ticks,
			balanced
		}
	};
}
function Component({ geom }) {
	const c = useCoords();
	const p = geom.parts;
	const m = geom.meta ?? {};
	const P = (v) => c.toPx(v.x, v.y);
	const [bax, bay] = P(p.beamA);
	const [bbx, bby] = P(p.beamB);
	const ped = p.pedestal.map(P);
	const [ft0x, ft0y] = P(p.foot[0]);
	const [ft1x] = P(p.foot[1]);
	const [pivx, pivy] = P(p.pivot);
	const metal = "var(--stage-metal)";
	const edge = "color-mix(in oklab, var(--stage-metal) 72%, black)";
	const beamColor = m.balanced ? "var(--stage-good)" : metal;
	const renderItem = (it, i) => {
		const [ax, ay] = P(it.anchor);
		const [cx, cy] = P({
			x: it.cx,
			y: it.cy
		});
		const wpx = c.sx(it.w);
		const hpx = c.sy(it.h);
		const top = cy - hpx / 2;
		const box = {
			cx,
			top,
			wpx,
			hpx,
			label: it.label
		};
		return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx(HangerHook, {
			topX: ax,
			topY: ay,
			botX: cx,
			botY: top
		}), it.kind === "x" ? /* @__PURE__ */ jsx(XBlockGlyph, { ...box }) : /* @__PURE__ */ jsx(WeightGlyph, { ...box })] }, i);
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(StageAssetDefs, {}),
		/* @__PURE__ */ jsx("rect", {
			x: Math.min(ft0x, ft1x),
			y: ft0y - 2.5,
			width: Math.abs(ft1x - ft0x),
			height: 6,
			rx: 3,
			fill: metal,
			stroke: edge,
			strokeWidth: .75
		}),
		/* @__PURE__ */ jsx("polygon", {
			points: ped.map((q) => q.join(",")).join(" "),
			fill: "url(#stage-grad-metal)",
			stroke: edge,
			strokeWidth: .75,
			strokeLinejoin: "round"
		}),
		(m.ticks ?? []).map(([t0, t1], i) => {
			const [x1, y1] = P(t0);
			const [x2, y2] = P(t1);
			return /* @__PURE__ */ jsx("line", {
				x1,
				y1,
				x2,
				y2,
				stroke: metal,
				strokeWidth: 1.5,
				opacity: .3
			}, `t${i}`);
		}),
		m.balanced && /* @__PURE__ */ jsx("line", {
			x1: bax,
			y1: bay,
			x2: bbx,
			y2: bby,
			stroke: "var(--stage-good)",
			strokeWidth: 12,
			strokeLinecap: "round",
			opacity: .18
		}),
		/* @__PURE__ */ jsx("line", {
			x1: bax,
			y1: bay,
			x2: bbx,
			y2: bby,
			stroke: beamColor,
			strokeWidth: 4,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("line", {
			x1: bax,
			y1: bay,
			x2: bbx,
			y2: bby,
			stroke: "color-mix(in oklab, var(--stage-sheen) 40%, transparent)",
			strokeWidth: 1,
			strokeLinecap: "round",
			transform: "translate(0,-1)"
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: pivx,
			cy: pivy,
			r: 4,
			fill: metal,
			stroke: edge,
			strokeWidth: .75
		}),
		(m.items ?? []).map(renderItem)
	] });
}
const BALANCE_LEVER_ASSET = {
	resolver,
	Component
};
registerAsset("balance-lever", BALANCE_LEVER_ASSET);

//#endregion
export { BALANCE_LEVER_ASSET };