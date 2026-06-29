'use client';

import { BulbGlyph, CellGlyph, ResistorGlyph, SwitchGlyph } from "./electronics.mjs";
import { Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Label, Segment, Vector, useCoords } from "@classytic/stage";

//#region src/kit/diagram.tsx
/**
* Small composite helpers built on @classytic/stage primitives, shared by the
* physics/vector labs. Render these INSIDE a `<Stage>` (they use the coordinate
* context via the underlying primitives).
*/
function AngleArc({ at, from, to, rPx = 26, color = "var(--stage-fg)", label }) {
	const c = useCoords();
	const o = c.toPx(at.x, at.y);
	const p1 = c.toPx(at.x + from.x, at.y + from.y);
	const p2 = c.toPx(at.x + to.x, at.y + to.y);
	const a1 = Math.atan2(p1[1] - o[1], p1[0] - o[0]);
	const a2 = Math.atan2(p2[1] - o[1], p2[0] - o[0]);
	let da = a2 - a1;
	while (da <= -Math.PI) da += 2 * Math.PI;
	while (da > Math.PI) da -= 2 * Math.PI;
	const sweep = da > 0 ? 1 : 0;
	const sx = o[0] + rPx * Math.cos(a1), sy = o[1] + rPx * Math.sin(a1);
	const ex = o[0] + rPx * Math.cos(a2), ey = o[1] + rPx * Math.sin(a2);
	const am = a1 + da / 2;
	const lx = o[0] + (rPx + 13) * Math.cos(am), ly = o[1] + (rPx + 13) * Math.sin(am);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("path", {
		d: `M ${sx} ${sy} A ${rPx} ${rPx} 0 0 ${sweep} ${ex} ${ey}`,
		fill: "none",
		stroke: color,
		strokeWidth: 1.6,
		opacity: .85
	}), label && /* @__PURE__ */ jsx("text", {
		x: lx,
		y: ly,
		fill: color,
		fontSize: 13,
		fontWeight: 600,
		textAnchor: "middle",
		dominantBaseline: "middle",
		style: {
			paintOrder: "stroke",
			stroke: "var(--stage-bg)",
			strokeWidth: 3.5,
			strokeLinejoin: "round"
		},
		children: label
	})] });
}
/** A small right-angle square at `at`, between unit-ish directions `u` and `v`. */
function RightAngleMark({ at, u, v, sizePx = 12, color = "var(--stage-muted)" }) {
	const c = useCoords();
	const o = c.toPx(at.x, at.y);
	const dir = (d) => {
		const p = c.toPx(at.x + d.x, at.y + d.y);
		const dx = p[0] - o[0], dy = p[1] - o[1];
		const m = Math.hypot(dx, dy) || 1;
		return [dx / m, dy / m];
	};
	const [ux, uy] = dir(u);
	const [vx, vy] = dir(v);
	const a = [o[0] + ux * sizePx, o[1] + uy * sizePx];
	const b = [o[0] + (ux + vx) * sizePx, o[1] + (uy + vy) * sizePx];
	const d = [o[0] + vx * sizePx, o[1] + vy * sizePx];
	return /* @__PURE__ */ jsx("path", {
		d: `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${d[0]} ${d[1]}`,
		fill: "none",
		stroke: color,
		strokeWidth: 1.4,
		opacity: .8
	});
}
/**
* An arrow (tail → tail+comp) with an optional tip label and optional dashed
* x/y component decomposition, the SVG equivalent of the old canvas
* `drawVector(..., { label, components })`.
*/
function LabeledVector({ tail = {
	x: 0,
	y: 0
}, comp, color = "var(--stage-accent)", weight = 2.5, label, components = false }) {
	const tip = {
		x: tail.x + comp.x,
		y: tail.y + comp.y
	};
	const corner = {
		x: tip.x,
		y: tail.y
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		components && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Segment, {
			from: tail,
			to: corner,
			color,
			opacity: .4,
			weight: 1,
			dashed: true
		}), /* @__PURE__ */ jsx(Segment, {
			from: corner,
			to: tip,
			color,
			opacity: .4,
			weight: 1,
			dashed: true
		})] }),
		/* @__PURE__ */ jsx(Vector, {
			tail,
			tip,
			color,
			weight
		}),
		label && (() => {
			const len = Math.hypot(comp.x, comp.y) || 1;
			const ux = comp.x / len, uy = -comp.y / len;
			const off = 15;
			const anchor = ux < -.35 ? "end" : ux > .35 ? "start" : "middle";
			return /* @__PURE__ */ jsx(Label, {
				x: tip.x,
				y: tip.y,
				text: label,
				color,
				dx: ux * off,
				dy: uy * off,
				size: 13,
				anchor
			});
		})()
	] });
}
/**
* Math-coordinate ADAPTERS over the canonical pixel-space electronics glyph library
* (kit/electronics.tsx). A lab drawing on a math-unit <Stage> places a real
* schematic symbol by giving a `center` in view units; the adapter projects to
* pixels and renders the ONE canonical glyph, so there is a single definition of
* each symbol across every circuit lab. `liveAt`/state props drive the glyph.
*/
function ResistorBox({ center, w, color = "var(--stage-fg)", label, reading, live }) {
	const c = useCoords();
	const [cx, cy] = c.toPx(center.x, center.y);
	const half = Math.max(c.sx(w / 2), 24);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(ResistorGlyph, {
		cx,
		cy,
		half,
		live,
		label
	}), reading && /* @__PURE__ */ jsx(Label, {
		x: center.x,
		y: center.y,
		text: reading,
		color,
		size: 11,
		dy: 22
	})] });
}
/** Rotate a glyph 90° for a vertical wire, keeping its label horizontal (rendered separately). */
function Oriented({ cx, cy, orient, label, glyph }) {
	if (orient === "h") return /* @__PURE__ */ jsx(Fragment, { children: glyph(true) });
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("g", {
		transform: `rotate(90 ${cx} ${cy})`,
		children: glyph(false)
	}), label && /* @__PURE__ */ jsx("text", {
		x: cx + 16,
		y: cy + 4,
		fill: "var(--stage-fg)",
		fontSize: 11,
		fontWeight: 600,
		textAnchor: "start",
		style: { pointerEvents: "none" },
		children: label
	})] });
}
/** Cell / battery at a math `center`; `half` (units) → terminal reach. `cells` > 1 = a battery. */
function CellBox({ center, half, live, label, cells, orient = "h" }) {
	const c = useCoords();
	const [cx, cy] = c.toPx(center.x, center.y);
	const h = Math.max(c.sx(half), 22);
	return /* @__PURE__ */ jsx(Oriented, {
		cx,
		cy,
		orient,
		label,
		glyph: (s) => /* @__PURE__ */ jsx(CellGlyph, {
			cx,
			cy,
			half: h,
			live,
			label: s ? label : void 0,
			cells
		})
	});
}
/** Filament lamp at a math `center`; `brightness` 0..1 glows it. */
function BulbBox({ center, half, live, brightness, label, orient = "h" }) {
	const c = useCoords();
	const [cx, cy] = c.toPx(center.x, center.y);
	const h = Math.max(c.sx(half), 22);
	return /* @__PURE__ */ jsx(Oriented, {
		cx,
		cy,
		orient,
		label,
		glyph: (s) => /* @__PURE__ */ jsx(BulbGlyph, {
			cx,
			cy,
			half: h,
			live,
			brightness,
			label: s ? label : void 0
		})
	});
}
/** SPST switch at a math `center`; `closed` lays the lever down. */
function SwitchBox({ center, half, live, closed, label, orient = "h" }) {
	const c = useCoords();
	const [cx, cy] = c.toPx(center.x, center.y);
	const h = Math.max(c.sx(half), 22);
	return /* @__PURE__ */ jsx(Oriented, {
		cx,
		cy,
		orient,
		label,
		glyph: (s) => /* @__PURE__ */ jsx(SwitchGlyph, {
			cx,
			cy,
			half: h,
			live,
			closed,
			label: s ? label : void 0
		})
	});
}

//#endregion
export { AngleArc, BulbBox, CellBox, LabeledVector, ResistorBox, RightAngleMark, SwitchBox };