'use client';

import { Callout, LabFrame } from "../../kit/frame.mjs";
import { RightAngleMark } from "../../kit/diagram.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { CoordPlane, circleExpandedTex, circleTex, distance, lineFrom, lineTex, num, snapPoint } from "../../kit/coords.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Circle, Dot, Line, MovableDot, Segment } from "@classytic/stage";

//#region src/math/circle/preset.tsx
/**
* CircleLab, the coordinate-geometry circle, as a thing you drag. Move the
* CENTRE (a, b) and pull the RIM to set the radius r; the equation
* (x − a)² + (y − b)² = r² updates live, and (optionally) its expanded form
* x² + y² + Dx + Ey + F = 0, the shape Edexcel hands you to complete-the-square.
*
* Turn on `showTangent` and a point rides the rim: the tangent there is drawn
* perpendicular to the radius (right-angle marked), which is the other classic
* circle question. Authorable via props + an optional checked answer (AskBox):
* "find the centre", "find the radius", "give the equation of the tangent".
*/
const C_CIRCLE = "var(--stage-accent)";
const C_CENTER = "var(--stage-good)";
const C_TAN = "var(--stage-accent-2)";
const DEFAULT_VIEW = {
	xMin: -7,
	xMax: 7,
	yMin: -7,
	yMax: 7
};
function CircleLab({ center: center0 = {
	x: 0,
	y: 0
}, radius = 4, showTangent = false, tangentAngleDeg = 45, showExpanded = false, view = DEFAULT_VIEW, height = 400, snap = 1, title = "The circle", prompt = "Drag the centre to move it; drag the rim to resize. (x − a)² + (y − b)² = r².", ask, activity = "circle" } = {}) {
	const [center, setCenter] = useState(center0);
	const [rim, setRim] = useState({
		x: center0.x + radius,
		y: center0.y
	});
	const [tAng, setTAng] = useState(tangentAngleDeg * Math.PI / 180);
	const r = Math.max(.5, distance(center, rim));
	const { x: a, y: b } = center;
	const T = {
		x: a + r * Math.cos(tAng),
		y: b + r * Math.sin(tAng)
	};
	const tdx = -(T.y - b), tdy = T.x - a;
	const tangent = Math.abs(tdx) < 1e-9 ? {
		m: Infinity,
		c: NaN,
		vertical: T.x
	} : lineFrom(tdy / tdx, T);
	const readouts = [
		{
			label: "centre (a, b)",
			value: `(${num(a)}, ${num(b)})`
		},
		{
			label: "radius r",
			value: num(r)
		},
		{
			label: "equation",
			value: circleTex(a, b, r)
		}
	];
	if (showExpanded) readouts.push({
		label: "expanded",
		value: circleExpandedTex(a, b, r)
	});
	if (showTangent) readouts.push({
		label: "tangent",
		value: lineTex(tangent)
	});
	const figure = /* @__PURE__ */ jsxs(CoordPlane, {
		view,
		height,
		ariaLabel: `Circle ${circleTex(a, b, r)}`,
		children: [
			/* @__PURE__ */ jsx(Circle, {
				center,
				r,
				color: C_CIRCLE,
				fill: C_CIRCLE,
				fillOpacity: .07,
				weight: 2.5
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: center,
				to: rim,
				color: "var(--stage-muted)",
				weight: 1.5,
				dashed: true
			}),
			showTangent && /* @__PURE__ */ jsxs(Fragment$1, { children: [
				/* @__PURE__ */ jsx(Segment, {
					from: center,
					to: T,
					color: C_TAN,
					weight: 1.5,
					dashed: true
				}),
				tangent.vertical !== void 0 ? /* @__PURE__ */ jsx(Line, {
					from: {
						x: tangent.vertical,
						y: 0
					},
					to: {
						x: tangent.vertical,
						y: 1
					},
					color: C_TAN,
					weight: 2.5
				}) : /* @__PURE__ */ jsx(Line, {
					from: {
						x: 0,
						y: tangent.c
					},
					to: {
						x: 1,
						y: tangent.c + tangent.m
					},
					color: C_TAN,
					weight: 2.5
				}),
				/* @__PURE__ */ jsx(RightAngleMark, {
					at: T,
					u: {
						x: T.x - a,
						y: T.y - b
					},
					v: tangent.vertical !== void 0 ? {
						x: 0,
						y: 1
					} : {
						x: 1,
						y: tangent.m
					}
				}),
				/* @__PURE__ */ jsx(MovableDot, {
					value: T,
					onMove: (p) => setTAng(Math.atan2(p.y - b, p.x - a)),
					color: C_TAN,
					ariaLabel: "tangent point, drag it round the rim"
				})
			] }),
			/* @__PURE__ */ jsx(MovableDot, {
				value: center,
				onMove: (p) => setCenter(snapPoint(p, snap)),
				snap,
				color: C_CENTER,
				ariaLabel: "centre, drag to move the circle"
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: rim,
				onMove: (p) => setRim(snapPoint(p, snap)),
				snap,
				color: C_CIRCLE,
				ariaLabel: "rim, drag to change the radius"
			}),
			/* @__PURE__ */ jsx(Dot, {
				x: a,
				y: b,
				r: 2.5,
				color: C_CENTER
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		aside: /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsx("div", {
				style: {
					display: "grid",
					gap: 6,
					fontVariantNumeric: "tabular-nums",
					fontSize: 13
				},
				children: readouts.map((rr, i) => /* @__PURE__ */ jsxs("span", { children: [
					rr.label,
					": ",
					/* @__PURE__ */ jsx("strong", { children: rr.value })
				] }, i))
			})
		}),
		footer: ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : void 0,
		children: figure
	});
}

//#endregion
export { CircleLab };