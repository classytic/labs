'use client';

import { num, toRad } from "../../core/util.mjs";
import { ScaleFrame } from "../../kit/scale.mjs";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { StageAssetDefs, WeightGlyph, XBlockGlyph, registerAsset, useCoords, vec } from "@classytic/stage";

//#region src/math/balance-algebra/asset.tsx
const TRAY_R = .82;
const HANG = .72;
const asVec = (v, d) => v && typeof v === "object" && "x" in v ? v : d;
function layoutPan(center, items) {
	const count = items.length || 1;
	const slot = count === 1 ? 0 : .78;
	return items.map((it, i) => ({
		cx: center.x + (i - (count - 1) / 2) * slot,
		yBase: center.y,
		w: .62,
		h: .62,
		kind: it.kind,
		label: it.label
	}));
}
function resolver({ params, bound }) {
	const pivot = asVec(params.pivot, {
		x: 0,
		y: .4
	});
	const arm = num(params.arm, 3.3);
	const coef = Math.max(0, Math.round(num(params.coef, 2)));
	const addend = Math.max(0, Math.round(num(params.addend, 1)));
	const rhs = Math.max(0, Math.round(num(params.rhs, 7)));
	const tiltDeg = num(bound.tilt, 0);
	const balanced = bound.balanced === true || bound.balanced === 1;
	const rad = toRad(tiltDeg);
	const beamA = vec.rotateAbout({
		x: pivot.x - arm,
		y: pivot.y
	}, pivot, rad);
	const beamB = vec.rotateAbout({
		x: pivot.x + arm,
		y: pivot.y
	}, pivot, rad);
	const baseY = pivot.y - 1.05;
	const pedestal = [
		{
			x: pivot.x - .12,
			y: pivot.y - .05
		},
		{
			x: pivot.x + .12,
			y: pivot.y - .05
		},
		{
			x: pivot.x + .3,
			y: baseY
		},
		{
			x: pivot.x - .3,
			y: baseY
		}
	];
	const foot = [{
		x: pivot.x - .55,
		y: baseY
	}, {
		x: pivot.x + .55,
		y: baseY
	}];
	const trayLC = {
		x: beamA.x,
		y: beamA.y - HANG
	};
	const trayRC = {
		x: beamB.x,
		y: beamB.y - HANG
	};
	const leftItems = [...coef > 0 ? [{
		kind: "x",
		label: coef === 1 ? "x" : `${coef}x`
	}] : [], ...addend > 0 ? [{
		kind: "const",
		label: String(addend)
	}] : []];
	const rightItems = [{
		kind: "const",
		label: String(rhs)
	}];
	return {
		kind: "asset-geom",
		parts: {
			pivot,
			beamA,
			beamB,
			pedestal,
			foot,
			trayLC,
			trayRC
		},
		meta: {
			items: [...layoutPan(trayLC, leftItems), ...layoutPan(trayRC, rightItems)],
			balanced
		}
	};
}
function Component({ geom }) {
	const c = useCoords();
	const p = geom.parts;
	const m = geom.meta ?? {};
	const P = (v) => c.toPx(v.x, v.y);
	const pivot = p.pivot;
	const renderItem = (it, i) => {
		const [cx, baseY] = P({
			x: it.cx,
			y: it.yBase
		});
		const wpx = c.sx(it.w);
		const hpx = c.sy(it.h);
		const box = {
			cx,
			top: baseY - hpx,
			wpx,
			hpx,
			label: it.label
		};
		return /* @__PURE__ */ jsx("g", { children: it.kind === "x" ? /* @__PURE__ */ jsx(XBlockGlyph, { ...box }) : /* @__PURE__ */ jsx(WeightGlyph, { ...box }) }, i);
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(StageAssetDefs, {}),
		/* @__PURE__ */ jsx(ScaleFrame, {
			pivot,
			beamA: p.beamA,
			beamB: p.beamB,
			trayLC: p.trayLC,
			trayRC: p.trayRC,
			baseY: pivot.y - 1.05,
			panR: TRAY_R,
			balanced: m.balanced
		}),
		/* @__PURE__ */ jsx("g", { children: (m.items ?? []).map(renderItem) })
	] });
}
const BALANCE_ALGEBRA_ASSET = {
	resolver,
	Component
};
registerAsset("balance-algebra", BALANCE_ALGEBRA_ASSET);

//#endregion
export { BALANCE_ALGEBRA_ASSET };