'use client';

import { toDeg, toRad } from "../../core/util.mjs";
import { Tex as Tex$1 } from "../../core/tex.mjs";
import { StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { castLetter, evalTrig, exactTex, isSpecial, normDeg, quadrant, radTex, referenceAngleDeg, sign } from "./core.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Axes, Circle, Dot, Label, MovableDot, Polyline, Segment, Stage, Vector } from "@classytic/stage";

//#region src/math/trig/preset.tsx
/**
* TrigSignsLab, the unit circle where the SIGNS of sin/cos/tan stop being
* memorised and become spatial. Drag the angle; the quadrant lights up, the CAST
* letter (All / Sin / Tan / Cos) shows which functions are positive there, and the
* cos (horizontal) and sin (vertical) legs are drawn GREEN when positive, RED when
* negative, so "cos is negative in the second quadrant" is something you SEE. Land
* on a special angle and the exact value (½, √3⁄2, …) appears.
*
* The unit-circle dragger pattern (shared with TrigExplorer); the teaching
* semantics come from the trig kernel (quadrant / CAST / reference angle / exact).
*/
const SIGN_COLOR = (s) => s > 0 ? "var(--stage-good)" : s < 0 ? "var(--stage-danger)" : "var(--stage-muted)";
const signTxt = (s) => Number.isNaN(s) ? "∅" : s > 0 ? "+" : s < 0 ? "−" : "0";
/** A small labelled sign badge, so the readout shows magnitude + a clear sign
*  (not a loose "−" that reads as part of the value). */
const SignChip = ({ s }) => /* @__PURE__ */ jsxs("span", {
	"aria-label": s > 0 ? "positive" : s < 0 ? "negative" : "zero",
	style: {
		fontSize: 11,
		fontWeight: 800,
		lineHeight: 1,
		padding: "2px 6px",
		borderRadius: 999,
		color: SIGN_COLOR(s),
		background: `color-mix(in oklab, ${SIGN_COLOR(s)} 16%, transparent)`
	},
	children: [signTxt(s), s > 0 ? " pos" : s < 0 ? " neg" : ""]
});
const CAST = [
	{
		q: 1,
		x: .45,
		y: .45,
		c: "A"
	},
	{
		q: 2,
		x: -.45,
		y: .45,
		c: "S"
	},
	{
		q: 3,
		x: -.45,
		y: -.45,
		c: "T"
	},
	{
		q: 4,
		x: .45,
		y: -.45,
		c: "C"
	}
];
/** Arc points from the +Re axis through to θ, radius r (the angle wedge). */
function arc(thetaRad, r) {
	const n = 30;
	return Array.from({ length: 31 }, (_, i) => {
		const t = thetaRad * i / n;
		return {
			x: r * Math.cos(t),
			y: r * Math.sin(t)
		};
	});
}
function TrigSignsLab({ startDeg = 30, snapDeg = 15, targetDeg, height = 360, title = "Signs on the unit circle (CAST)", prompt = "Drag the angle. cos is the horizontal leg, sin the vertical — green where +, red where −. The CAST letter says which are positive.", activity = "trig-signs" } = {}) {
	const snap = (d) => snapDeg > 0 ? Math.round(d / snapDeg) * snapDeg : d;
	const [deg, setDeg] = useState(() => normDeg(snap(startDeg)));
	useEffect(() => {
		setDeg(normDeg(snap(startDeg)));
	}, [startDeg]);
	const rad = toRad(deg);
	const P = {
		x: Math.cos(rad),
		y: Math.sin(rad)
	};
	const q = quadrant(deg);
	const sSin = sign("sin", deg), sCos = sign("cos", deg), sTan = sign("tan", deg);
	const solved = targetDeg != null && normDeg(deg) === normDeg(targetDeg);
	useCheckpoint({
		solved,
		activity,
		response: `${deg}°`
	});
	const accent = solved ? "var(--stage-good)" : "var(--stage-fg)";
	const valTex = (fn) => {
		const ex = exactTex(fn, deg);
		if (ex) return ex;
		const v = evalTrig(fn, deg);
		return Number.isNaN(v) ? "\\text{undef}" : (Math.round(v * 100) / 100).toString().replace(/^-/, "−");
	};
	const magTex = (fn) => valTex(fn).replace(/^[-−]/, "");
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin: -1.5,
			xMax: 1.5,
			yMin: -1.45,
			yMax: 1.45
		},
		height,
		ariaLabel: `Unit circle, angle ${deg} degrees in quadrant ${q || "on an axis"}`,
		children: [
			/* @__PURE__ */ jsx(Axes, {}),
			/* @__PURE__ */ jsx(Circle, {
				center: {
					x: 0,
					y: 0
				},
				r: 1,
				color: "var(--stage-fg)",
				opacity: .3,
				weight: 1.5,
				fill: "none"
			}),
			CAST.map(({ q: cq, x, y, c }) => /* @__PURE__ */ jsx(Label, {
				x,
				y,
				text: c,
				size: cq === q ? 22 : 15,
				weight: cq === q ? 800 : 600,
				color: cq === q ? "var(--stage-accent)" : "var(--stage-muted)"
			}, c)),
			/* @__PURE__ */ jsx(Polyline, {
				points: arc(rad, .32),
				color: "var(--stage-muted)",
				weight: 1.5
			}),
			/* @__PURE__ */ jsx(Label, {
				x: .5 * Math.cos(rad / 2),
				y: .5 * Math.sin(rad / 2),
				text: `${deg}°`,
				color: "var(--stage-muted)",
				size: 12
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: 0,
					y: 0
				},
				to: {
					x: P.x,
					y: 0
				},
				color: SIGN_COLOR(sCos),
				weight: 4
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: P.x,
					y: 0
				},
				to: {
					x: P.x,
					y: P.y
				},
				color: SIGN_COLOR(sSin),
				weight: 4
			}),
			/* @__PURE__ */ jsx(Label, {
				x: P.x / 2,
				y: 0,
				text: "cos",
				color: SIGN_COLOR(sCos),
				size: 11,
				dy: P.y >= 0 ? 14 : -8
			}),
			/* @__PURE__ */ jsx(Label, {
				x: P.x,
				y: P.y / 2,
				text: "sin",
				color: SIGN_COLOR(sSin),
				size: 11,
				dx: P.x >= 0 ? 8 : -8,
				anchor: P.x >= 0 ? "start" : "end"
			}),
			/* @__PURE__ */ jsx(Vector, {
				tail: {
					x: 0,
					y: 0
				},
				tip: P,
				color: accent,
				weight: 2
			}),
			targetDeg != null && !solved && /* @__PURE__ */ jsx(Dot, {
				x: Math.cos(toRad(targetDeg)),
				y: Math.sin(toRad(targetDeg)),
				r: 9,
				color: "var(--stage-good)",
				opacity: .35
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: P,
				onMove: (p) => {
					let a = toDeg(Math.atan2(p.y, p.x));
					setDeg(normDeg(snap(a)));
				},
				color: accent,
				r: 9,
				ariaLabel: "angle on the unit circle, drag it round"
			})
		]
	});
	const Row = ({ fn, s }) => /* @__PURE__ */ jsxs("span", {
		style: {
			color: SIGN_COLOR(s),
			display: "inline-flex",
			alignItems: "center",
			gap: 6
		},
		children: [/* @__PURE__ */ jsx(Tex$1, { tex: `\\${fn}\\theta = ${magTex(fn)}` }), !Number.isNaN(s) && /* @__PURE__ */ jsx(SignChip, { s })]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx("span", {
				style: { fontVariantNumeric: "tabular-nums" },
				children: /* @__PURE__ */ jsx(Tex$1, { tex: `\\theta = ${deg}^\\circ = ${radTex(deg)}` })
			}),
			/* @__PURE__ */ jsx(Row, {
				fn: "sin",
				s: sSin
			}),
			/* @__PURE__ */ jsx(Row, {
				fn: "cos",
				s: sCos
			}),
			/* @__PURE__ */ jsx(Row, {
				fn: "tan",
				s: sTan
			}),
			/* @__PURE__ */ jsxs("span", {
				style: { opacity: .8 },
				children: [q ? `Q${q}: ${castLetter(deg)} positive` : "on an axis", isSpecial(deg) ? ` · ref ${referenceAngleDeg(deg)}°` : ""]
			}),
			targetDeg != null && /* @__PURE__ */ jsx(StatusPill, {
				ok: solved,
				children: solved ? `✓ ${targetDeg}°` : `target ${targetDeg}°`
			})
		] }),
		children: figure
	});
}

//#endregion
export { TrigSignsLab };