'use client';

import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Axes, Grid, Label, Segment, Stage } from "@classytic/stage";

//#region src/kit/coords.tsx
const EPS = 1e-9;
/** The line through two points (vertical-safe). */
function lineThrough(a, b) {
	if (Math.abs(b.x - a.x) < EPS) return {
		m: Infinity,
		c: NaN,
		vertical: a.x
	};
	const m = (b.y - a.y) / (b.x - a.x);
	return {
		m,
		c: a.y - m * a.x
	};
}
/** y on a line at x (NaN for a vertical line). */
function yAt(l, x) {
	return l.vertical !== void 0 ? NaN : l.m * x + l.c;
}
/** The line of gradient m through point p. */
function lineFrom(m, p) {
	return {
		m,
		c: p.y - m * p.x
	};
}
/** The line parallel to `l` through p (same gradient). */
function parallelThrough(l, p) {
	if (l.vertical !== void 0) return {
		m: Infinity,
		c: NaN,
		vertical: p.x
	};
	return lineFrom(l.m, p);
}
/** The line perpendicular to `l` through p (gradient −1/m; verticals ↔ horizontals). */
function perpThrough(l, p) {
	if (l.vertical !== void 0) return lineFrom(0, p);
	if (Math.abs(l.m) < EPS) return {
		m: Infinity,
		c: NaN,
		vertical: p.x
	};
	return lineFrom(-1 / l.m, p);
}
/** Where two lines cross (null if parallel). Vertical-safe. */
function intersectLines(l1, l2) {
	if (l1.vertical !== void 0 && l2.vertical !== void 0) return null;
	if (l1.vertical !== void 0) return {
		x: l1.vertical,
		y: yAt(l2, l1.vertical)
	};
	if (l2.vertical !== void 0) return {
		x: l2.vertical,
		y: yAt(l1, l2.vertical)
	};
	if (Math.abs(l1.m - l2.m) < EPS) return null;
	const x = (l2.c - l1.c) / (l1.m - l2.m);
	return {
		x,
		y: yAt(l1, x)
	};
}
function distance(a, b) {
	return Math.hypot(b.x - a.x, b.y - a.y);
}
function midpoint(a, b) {
	return {
		x: (a.x + b.x) / 2,
		y: (a.y + b.y) / 2
	};
}
/** Round to a clean string, trims trailing zeros; up to `dp` decimals. */
function num(n, dp = 2) {
	if (!Number.isFinite(n)) return "∞";
	const r = Math.round(n * 10 ** dp) / 10 ** dp;
	return String(r);
}
/** "+ 3" / "− 3" (unicode minus), with an optional leading space. */
function signed(n, dp = 2) {
	return `${n < 0 ? "−" : "+"} ${num(Math.abs(n), dp)}`;
}
/** A gradient coefficient: "x", "−x", "2x", "½x" … (no leading +/−1 noise). */
function coefX(m, dp = 2) {
	if (Math.abs(m - 1) < EPS) return "x";
	if (Math.abs(m + 1) < EPS) return "−x";
	return `${num(m, dp)}x`;
}
/** Human-readable equation of a line: "y = 2x − 3", "x = 4", "y = 5". */
function lineTex(l, dp = 2) {
	if (l.vertical !== void 0) return `x = ${num(l.vertical, dp)}`;
	if (Math.abs(l.m) < EPS) return `y = ${num(l.c, dp)}`;
	if (Math.abs(l.c) < EPS) return `y = ${coefX(l.m, dp)}`;
	return `y = ${coefX(l.m, dp)} ${signed(l.c, dp)}`;
}
/** Intercept form "x/a + y/b = 1" for a line cutting the axes at (a,0),(0,b). */
function interceptTex(a, b, dp = 2) {
	return `x/${num(a, dp)} + y/${num(b, dp)} = 1`;
}
/** Circle "(x − a)² + (y − b)² = r²" with centre (a,b). */
function circleTex(a, b, r, dp = 2) {
	return `${Math.abs(a) < EPS ? "x²" : `(x ${signed(-a, dp)})²`} + ${Math.abs(b) < EPS ? "y²" : `(y ${signed(-b, dp)})²`} = ${num(r * r, dp)}`;
}
/** Expanded circle x² + y² + Dx + Ey + F = 0 (the completing-the-square form). */
function circleExpandedTex(a, b, r, dp = 2) {
	const D = -2 * a, E = -2 * b, F = a * a + b * b - r * r;
	return `x² + y²${Math.abs(D) < EPS ? "" : ` ${signed(D, dp)}x`.replace("+ ", "+ ").replace("− ", "− ")}${Math.abs(E) < EPS ? "" : ` ${signed(E, dp)}y`}${Math.abs(F) < EPS ? "" : ` ${signed(F, dp)}`} = 0`;
}
/** Snap a value to the nearest `step` (0 → no snap). */
function snapTo(v, step = 0) {
	return step > 0 ? Math.round(v / step) * step : v;
}
function snapPoint(p, step = 0) {
	return {
		x: snapTo(p.x, step),
		y: snapTo(p.y, step)
	};
}
/** The framed coordinate plane every coord-geometry lab draws on. */
function CoordPlane({ view, height = 360, ariaLabel, step, stepX, stepY, pad, labels = true, preserveAspect = true, children }) {
	return /* @__PURE__ */ jsxs(Stage, {
		view,
		height,
		pad: pad ?? (labels ? 26 : 12),
		preserveAspect,
		ariaLabel,
		children: [
			/* @__PURE__ */ jsx(Grid, {
				step,
				stepX,
				stepY
			}),
			/* @__PURE__ */ jsx(Axes, {
				ticks: true,
				step,
				stepX,
				stepY,
				labels
			}),
			children
		]
	});
}
/** The rise/run right-triangle under a line segment, makes "gradient = Δy/Δx" visible. */
function GradientTriangle({ a, b, color = "var(--stage-muted)", showLabels = true }) {
	const corner = {
		x: b.x,
		y: a.y
	};
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(Segment, {
			from: a,
			to: corner,
			color,
			weight: 1.5,
			dashed: true
		}),
		/* @__PURE__ */ jsx(Segment, {
			from: corner,
			to: b,
			color,
			weight: 1.5,
			dashed: true
		}),
		showLabels && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Label, {
			x: (a.x + corner.x) / 2,
			y: a.y,
			text: `Δx = ${num(dx)}`,
			color,
			size: 11,
			dy: dy >= 0 ? 14 : -8
		}), /* @__PURE__ */ jsx(Label, {
			x: corner.x,
			y: (corner.y + b.y) / 2,
			text: `Δy = ${num(dy)}`,
			color,
			size: 11,
			dx: dx >= 0 ? 8 : -8,
			anchor: dx >= 0 ? "start" : "end"
		})] })
	] });
}

//#endregion
export { CoordPlane, GradientTriangle, circleExpandedTex, circleTex, distance, interceptTex, intersectLines, lineFrom, lineTex, lineThrough, midpoint, num, parallelThrough, perpThrough, snapPoint, snapTo };