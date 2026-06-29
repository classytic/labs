'use client';

import { num, toRad } from "../../core/util.mjs";
import { ScaleFrame } from "../../kit/scale.mjs";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { BucketGlyph, StageAssetDefs, WeightGlyph, registerAsset, useCoords, vec } from "@classytic/stage";

//#region src/math/mystery-bucket/asset.tsx
const TRAY_R = .95;
const HANG = .72;
const asVec = (v, d) => v && typeof v === "object" && "x" in v ? v : d;
function resolver({ params }) {
	const pivot = asVec(params.pivot, {
		x: 0,
		y: .4
	});
	const arm = num(params.arm, 3.3);
	const weight = Math.max(0, Math.round(num(params.bucketWeight, 5)));
	const buckets = Math.max(1, Math.round(num(params.bucketCount, 1)));
	const total = weight * buckets;
	const count = Math.max(0, Math.round(num(params.count, 0)));
	const diff = total - count;
	const balanced = diff === 0;
	const rad = toRad(Math.max(-13, Math.min(13, diff * 4.5)));
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
	const lUsable = TRAY_R * 2 * .86;
	const bw = Math.min(1.15, lUsable / buckets * .96);
	const bucketList = Array.from({ length: buckets }, (_, i) => ({
		cx: trayLC.x + (i - (buckets - 1) / 2) * (buckets > 1 ? lUsable / buckets : 0),
		yBase: trayLC.y,
		wpx: bw,
		hpx: bw,
		label: balanced ? String(weight) : "?"
	}));
	const cw = count > 0 ? Math.min(.5, TRAY_R * 2 * .86 / count) : .5;
	const coins = Array.from({ length: count }, (_, i) => ({
		cx: trayRC.x + (i - (count - 1) / 2) * cw,
		yBase: trayRC.y,
		wpx: cw * .92,
		hpx: cw * .92,
		label: "1"
	}));
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
			buckets: bucketList,
			coins,
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
	const toGlyph = (b) => {
		const [gx, gy] = P({
			x: b.cx,
			y: b.yBase
		});
		const hpx = c.sy(b.hpx);
		return {
			cx: gx,
			top: gy - hpx,
			wpx: c.sx(b.wpx),
			hpx,
			label: b.label
		};
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
		(m.buckets ?? []).map((b, i) => /* @__PURE__ */ jsx(BucketGlyph, { ...toGlyph(b) }, `b${i}`)),
		(m.coins ?? []).map((coin, i) => /* @__PURE__ */ jsx(WeightGlyph, { ...toGlyph(coin) }, `c${i}`))
	] });
}
const MYSTERY_BUCKET_ASSET = {
	resolver,
	Component
};
registerAsset("mystery-bucket", MYSTERY_BUCKET_ASSET);

//#endregion
export { MYSTERY_BUCKET_ASSET };