'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { LabFrame } from "../../kit/frame.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Axes, Grid, MovableDot, Plot, Stage, Tex } from "@classytic/stage";

//#region src/math/parabola/preset.tsx
/**
* Vertex-form parabola, drag the vertex (h,k); the curve y = a(x−h)²+k and its
* equation update live. A direct composition of @classytic/stage primitives
* (Plot + a draggable handle + KaTeX), no scene DAG needed, shows the
* primitives are usable on their own, not only through <Scene>.
*/
function equationTex(a, h, k) {
	const sq = `\\left(${h === 0 ? "x" : `x ${h < 0 ? "+" : "-"} ${Math.abs(h)}`}\\right)^2`;
	return `y = ${a === 1 ? sq : `${a}${sq}`}${k === 0 ? "" : ` ${k < 0 ? "-" : "+"} ${Math.abs(k)}`}`;
}
function VertexParabolaLab({ a = 1, height = 380 }) {
	const [vertex, setVertex] = useState({
		x: -4,
		y: -3
	});
	const h = vertex.x;
	const k = vertex.y;
	const y = (x) => a * (x - h) * (x - h) + k;
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin: -8,
			xMax: 8,
			yMin: -5,
			yMax: 7
		},
		height,
		ariaLabel: "Drag the vertex to graph the parabola",
		children: [
			/* @__PURE__ */ jsx(Grid, {}),
			/* @__PURE__ */ jsx(Axes, {}),
			/* @__PURE__ */ jsx(Plot.OfX, {
				y,
				color: "var(--stage-accent)",
				weight: 3
			}),
			/* @__PURE__ */ jsx(Tex, {
				x: 3.5,
				y: 6,
				tex: equationTex(a, h, k),
				size: 18
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: vertex,
				onMove: (p) => setVertex({
					x: Math.round(p.x),
					y: Math.round(p.y)
				}),
				snap: 1,
				color: "var(--stage-good)",
				ariaLabel: "parabola vertex"
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title: "Vertex-form parabola",
		footer: /* @__PURE__ */ jsxs("p", {
			className: "lab-prompt",
			children: [
				"Drag the ",
				/* @__PURE__ */ jsx("strong", { children: "vertex" }),
				", the curve and the equation update. Vertex form ",
				/* @__PURE__ */ jsx(Tex$1, { tex: "y = a(x-h)^2 + k" }),
				"."
			]
		}),
		children: figure
	});
}

//#endregion
export { VertexParabolaLab };