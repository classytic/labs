'use client';

import { pxRect } from "../../kit/asset-util.mjs";
import { CoinGlyph, DiceGlyph } from "../../kit/probability.mjs";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCoords } from "@classytic/stage";

//#region src/discrete/lln/asset.tsx
const H = 300;
const CH = {
	x0: 250,
	x1: 636,
	yTop: 250,
	yBot: 40
};
const numOr = (v, d) => typeof v === "number" && Number.isFinite(v) ? v : d;
const arr = (v) => Array.isArray(v) ? v : [];
function resolver({ sim, params }) {
	return {
		kind: "asset-geom",
		parts: {},
		meta: {
			p: arr(sim?.p),
			p0: arr(sim?.p0),
			samples: arr(sim?.samples),
			n: numOr(sim?.n, 0),
			last: numOr(sim?.last, -1),
			kind: numOr(params?.kind, 0),
			done: sim?.done === true
		}
	};
}
function Component({ geom }) {
	const c = useCoords();
	const m = geom.meta ?? {};
	const P = (x, y) => c.toPx(x, H - y);
	const labels = m.kind === 1 ? [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6"
	] : ["H", "T"];
	const drew = m.n > 0;
	const headP = m.p[0] ?? 0;
	const trueP = m.p0[0] ?? 0;
	const sy = (v) => CH.yTop - Math.max(0, Math.min(1, v)) * (CH.yTop - CH.yBot);
	const sx = (i, len) => CH.x0 + (len <= 1 ? 0 : i / (len - 1)) * (CH.x1 - CH.x0);
	const frame = pxRect(P, CH.x0, CH.yBot, CH.x1, CH.yTop);
	const line = m.samples.map((v, i) => P(sx(i, m.samples.length), sy(v)).join(",")).join(" ");
	const [tx0, ty] = P(CH.x0, sy(trueP));
	const [tx1] = P(CH.x1, sy(trueP));
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		(() => {
			const [gx, gy] = P(110, 200);
			return m.kind === 1 ? /* @__PURE__ */ jsx(DiceGlyph, {
				x: gx - 36,
				y: gy - 36,
				size: 72,
				value: Math.max(1, m.last + 1),
				highlight: drew
			}) : /* @__PURE__ */ jsx(CoinGlyph, {
				cx: gx,
				cy: gy,
				r: 42,
				face: m.last === 1 ? "T" : "H",
				highlight: drew
			});
		})(),
		(() => {
			const [x, y] = P(110, 128);
			return /* @__PURE__ */ jsxs("text", {
				x,
				y,
				textAnchor: "middle",
				fontSize: 14,
				fontWeight: 700,
				fill: "var(--stage-fg)",
				children: [
					m.n.toLocaleString(),
					" draws",
					m.done ? " ✓" : ""
				]
			});
		})(),
		(() => {
			const [x, y] = P(110, 104);
			return /* @__PURE__ */ jsxs("text", {
				x,
				y,
				textAnchor: "middle",
				fontSize: 20,
				fontWeight: 800,
				fill: "var(--stage-accent)",
				style: { fontVariantNumeric: "tabular-nums" },
				children: [
					labels[0],
					" ",
					(headP * 100).toFixed(1),
					"%"
				]
			});
		})(),
		/* @__PURE__ */ jsx("rect", {
			x: frame.x,
			y: frame.y,
			width: frame.width,
			height: frame.height,
			rx: 8,
			fill: "color-mix(in oklab, var(--stage-accent) 5%, var(--stage-bg))",
			stroke: "var(--stage-grid)",
			strokeWidth: 1
		}),
		(() => {
			const [x, y] = P(CH.x0 - 6, sy(1));
			return /* @__PURE__ */ jsx("text", {
				x,
				y: y + 3,
				textAnchor: "end",
				fontSize: 10,
				fill: "var(--stage-muted)",
				children: "100%"
			});
		})(),
		(() => {
			const [x, y] = P(CH.x0 - 6, sy(0));
			return /* @__PURE__ */ jsx("text", {
				x,
				y: y + 9,
				textAnchor: "end",
				fontSize: 10,
				fill: "var(--stage-muted)",
				children: "0%"
			});
		})(),
		/* @__PURE__ */ jsx("line", {
			x1: tx0,
			y1: ty,
			x2: tx1,
			y2: ty,
			stroke: "var(--stage-good)",
			strokeWidth: 1.5,
			strokeDasharray: "6 5"
		}),
		(() => {
			const [x, y] = P(CH.x1 + 6, sy(trueP));
			return /* @__PURE__ */ jsxs("text", {
				x,
				y: y + 3,
				fontSize: 11,
				fontWeight: 700,
				fill: "var(--stage-good)",
				children: [
					"true ",
					(trueP * 100).toFixed(0),
					"%"
				]
			});
		})(),
		/* @__PURE__ */ jsx("polyline", {
			points: line,
			fill: "none",
			stroke: "var(--stage-accent)",
			strokeWidth: 2.25,
			strokeLinejoin: "round",
			strokeLinecap: "round"
		}),
		(() => {
			const [x, y] = P((CH.x0 + CH.x1) / 2, CH.yBot - 16);
			return /* @__PURE__ */ jsxs("text", {
				x,
				y,
				textAnchor: "middle",
				fontSize: 11,
				fill: "var(--stage-muted)",
				children: [
					"running P(",
					labels[0],
					") over ",
					m.n.toLocaleString(),
					" draws → settles on the dashed true line"
				]
			});
		})(),
		(() => {
			const [x, y] = P(110, 250);
			return /* @__PURE__ */ jsx("text", {
				x,
				y,
				textAnchor: "middle",
				fontSize: 12,
				fill: "var(--stage-muted)",
				style: { fontVariantNumeric: "tabular-nums" },
				children: m.p.map((pi, i) => `${labels[i] ?? i} ${(pi * 100).toFixed(0)}%`).join("   ")
			});
		})()
	] });
}
const LLN_ASSET = {
	resolver,
	Component
};

//#endregion
export { LLN_ASSET };