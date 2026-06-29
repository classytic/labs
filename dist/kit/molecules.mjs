'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/molecules.tsx
const O = "var(--stage-danger)";
const C = "color-mix(in oklab, var(--stage-fg) 44%, var(--stage-bg))";
const H = "color-mix(in oklab, var(--stage-fg) 84%, var(--stage-bg))";
const BOND = "color-mix(in oklab, var(--stage-fg) 52%, transparent)";
const LIGHT = "var(--stage-fg)";
const DARK = "var(--stage-bg)";
const HALO = "var(--stage-bg)";
function atom(cx, cy, r, fill, sym, symColor = LIGHT) {
	return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("circle", {
		cx,
		cy,
		r,
		fill,
		stroke: HALO,
		strokeWidth: 1.6,
		vectorEffect: "non-scaling-stroke"
	}), sym && /* @__PURE__ */ jsx("text", {
		x: cx,
		y: cy,
		fill: symColor,
		fontSize: r * 1.15,
		fontWeight: 800,
		textAnchor: "middle",
		dominantBaseline: "central",
		style: { pointerEvents: "none" },
		children: sym
	})] }, `${cx},${cy}`);
}
const bond = (x1, y1, x2, y2) => /* @__PURE__ */ jsx("line", {
	x1,
	y1,
	x2,
	y2,
	stroke: BOND,
	strokeWidth: 2.4,
	strokeLinecap: "round",
	vectorEffect: "non-scaling-stroke"
}, `b${x1},${y1},${x2},${y2}`);
/** Each molecule draws into a unit box [-1,1]² (scaled by size/2); has a label. */
const MOLECULES = {
	co2: {
		label: "CO₂",
		draw: () => /* @__PURE__ */ jsxs("g", { children: [
			bond(-.62, 0, 0, 0),
			bond(0, 0, .62, 0),
			atom(-.66, 0, .34, O, "O"),
			atom(0, 0, .42, C, "C"),
			atom(.66, 0, .34, O, "O")
		] })
	},
	o2: {
		label: "O₂",
		draw: () => /* @__PURE__ */ jsxs("g", { children: [
			bond(-.42, 0, .42, 0),
			atom(-.42, 0, .42, O, "O"),
			atom(.42, 0, .42, O, "O")
		] })
	},
	h2o: {
		label: "H₂O",
		draw: () => /* @__PURE__ */ jsxs("g", { children: [
			bond(0, .12, -.58, -.42),
			bond(0, .12, .58, -.42),
			atom(0, .12, .44, O, "O"),
			atom(-.58, -.42, .28, H, "H", DARK),
			atom(.58, -.42, .28, H, "H", DARK)
		] })
	},
	glucose: {
		label: "glucose",
		draw: () => {
			const pts = Array.from({ length: 6 }, (_, i) => {
				const a = Math.PI / 3 * i - Math.PI / 2;
				return [Math.cos(a) * .66, Math.sin(a) * .66];
			});
			return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("polygon", {
				points: pts.map((p) => p.join(",")).join(" "),
				fill: `color-mix(in oklab, ${C} 22%, var(--stage-bg))`,
				stroke: BOND,
				strokeWidth: 2.4,
				strokeLinejoin: "round",
				vectorEffect: "non-scaling-stroke"
			}), pts.map((p) => atom(p[0], p[1], .13, C))] });
		}
	},
	atp: {
		label: "ATP",
		draw: () => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("rect", {
			x: -.74,
			y: -.4,
			width: 1.48,
			height: .8,
			rx: .4,
			fill: "var(--stage-good)",
			stroke: HALO,
			strokeWidth: 1.4,
			vectorEffect: "non-scaling-stroke"
		}), /* @__PURE__ */ jsx("text", {
			x: 0,
			y: .02,
			fill: DARK,
			fontSize: .46,
			fontWeight: 800,
			textAnchor: "middle",
			dominantBaseline: "central",
			children: "ATP"
		})] })
	},
	light: {
		label: "light",
		draw: () => /* @__PURE__ */ jsxs("g", { children: [Array.from({ length: 8 }, (_, i) => {
			const a = Math.PI / 4 * i;
			return /* @__PURE__ */ jsx("line", {
				x1: Math.cos(a) * .56,
				y1: Math.sin(a) * .56,
				x2: Math.cos(a) * .92,
				y2: Math.sin(a) * .92,
				stroke: "var(--stage-warn)",
				strokeWidth: 2.2,
				strokeLinecap: "round",
				vectorEffect: "non-scaling-stroke"
			}, i);
		}), /* @__PURE__ */ jsx("circle", {
			cx: 0,
			cy: 0,
			r: .42,
			fill: "var(--stage-warn)",
			stroke: HALO,
			strokeWidth: 1.4,
			vectorEffect: "non-scaling-stroke"
		})] })
	},
	A: {
		label: "A",
		draw: () => atom(0, 0, .66, "var(--stage-accent)", "A")
	},
	B: {
		label: "B",
		draw: () => atom(0, 0, .66, "var(--stage-accent-2)", "B")
	},
	AB: {
		label: "AB",
		draw: () => /* @__PURE__ */ jsxs("g", { children: [
			bond(-.4, 0, .4, 0),
			atom(-.44, 0, .46, "var(--stage-accent)", "A"),
			atom(.44, 0, .46, "var(--stage-accent-2)", "B")
		] })
	}
};
/** A molecule icon as an SVG <g>, centred at (x,y), fitting a `size`-px box. */
function MoleculeGlyph({ kind, x = 0, y = 0, size = 30, showLabel = false }) {
	const m = MOLECULES[kind];
	const s = size / 2;
	return /* @__PURE__ */ jsxs("g", {
		transform: `translate(${x} ${y})`,
		children: [/* @__PURE__ */ jsx("g", {
			transform: `scale(${s})`,
			strokeLinecap: "round",
			children: m.draw()
		}), showLabel && /* @__PURE__ */ jsx("text", {
			x: 0,
			y: s + 12,
			fill: "var(--stage-fg)",
			fontSize: 11,
			fontWeight: 600,
			textAnchor: "middle",
			children: m.label
		})]
	});
}

//#endregion
export { MoleculeGlyph };