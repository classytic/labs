'use client';

import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { AngleArc } from "../../kit/diagram.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Label, MovableDot, Segment, Stage, Vector } from "@classytic/stage";

//#region src/physics/electric-flux/preset.tsx
/**
* ElectricFluxLab, the concept of flux (Φ) made literal: flux is just HOW MANY
* field lines thread through your area. A uniform field points to the right as a
* set of evenly spaced lines (denser = stronger E). Drop a flat "area" into it and
* the lines that actually pass through it light up green; that count IS the flux.
*
*   • rotate the area: edge-on to the field, nothing threads it (Φ = 0); face-on,
*     the maximum threads it (Φ = E·A). In between, Φ = E·A·cosθ, where θ is the
*     angle between the area's NORMAL and the field.
*   • resize the area A: a bigger window catches more lines.
*   • change the medium (permittivity εr): a dielectric weakens the field to
*     E = E₀/εr, so there are fewer lines to thread, and Φ falls. This is the
*     Gauss-law statement Φ = Q/(ε₀εr) seen as line-counting.
*
* Built from stage primitives; the analogy (lines through a hoop) is the point,
* not a timed simulation. Authorable via props + an optional checked question.
*/
const VIEW = {
	xMin: -6,
	xMax: 6,
	yMin: -4,
	yMax: 4
};
const C_THREAD = "var(--stage-good)";
const C_FAINT = "color-mix(in oklab, var(--stage-accent) 35%, transparent)";
const C_AREA = "var(--stage-accent-2)";
const C_NORMAL = "var(--stage-fg)";
const MEDIA = [
	{
		name: "vacuum",
		er: 1
	},
	{
		name: "glass",
		er: 5
	},
	{
		name: "water",
		er: 80
	}
];
const fmt$1 = (n) => Math.abs(n) < .05 ? "0" : n.toFixed(1);
function ElectricFluxLab({ field = 6, area = 3, angleDeg = 0, title = "Electric flux: how many lines thread the area", prompt = "Rotate the area and resize it. The lines that pass through light up: that count is the flux Φ = E·A·cosθ.", ask, height = 420, activity = "electric-flux" } = {}) {
	const [E0, setE0] = useState(field);
	const [A, setA] = useState(area);
	const [theta, setTheta] = useState(angleDeg * Math.PI / 180);
	const [er, setEr] = useState(1);
	const Eeff = E0 / er;
	const cos = Math.cos(theta);
	const phi = Eeff * A * cos;
	const deg = Math.round(theta * 180 / Math.PI);
	const C = {
		x: 0,
		y: 0
	};
	const n = {
		x: Math.cos(theta),
		y: Math.sin(theta)
	};
	const dir = {
		x: -Math.sin(theta),
		y: Math.cos(theta)
	};
	const p1 = {
		x: C.x + dir.x * A / 2,
		y: C.y + dir.y * A / 2
	};
	const p2 = {
		x: C.x - dir.x * A / 2,
		y: C.y - dir.y * A / 2
	};
	const halfSpan = A / 2 * Math.abs(cos);
	const nLines = Math.max(4, Math.min(40, Math.round(Eeff * 3)));
	const y0 = VIEW.yMin + .4, y1 = VIEW.yMax - .4;
	const ys = Array.from({ length: nLines }, (_, i) => y0 + (y1 - y0) * i / Math.max(1, nLines - 1));
	const threads = ys.filter((y) => Math.abs(y - C.y) <= halfSpan + 1e-6).length;
	const rotTip = {
		x: C.x + n.x * 2.2,
		y: C.y + n.y * 2.2
	};
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view: VIEW,
		height,
		ariaLabel: `Uniform field with a flat area at ${deg} degrees; ${threads} field lines thread it`,
		children: [
			ys.map((y, i) => {
				const on = Math.abs(y - C.y) <= halfSpan + 1e-6;
				return /* @__PURE__ */ jsx(Segment, {
					from: {
						x: VIEW.xMin,
						y
					},
					to: {
						x: VIEW.xMax,
						y
					},
					color: on ? C_THREAD : C_FAINT,
					weight: on ? 2.4 : 1.4
				}, i);
			}),
			/* @__PURE__ */ jsx(Vector, {
				tail: {
					x: 3.6,
					y: y1 - .2
				},
				tip: {
					x: 4.7,
					y: y1 - .2
				},
				color: "var(--stage-accent)"
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 4.9,
				y: y1 - .2,
				text: "E",
				color: "var(--stage-accent)",
				size: 13,
				anchor: "start"
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: p1,
				to: p2,
				color: C_AREA,
				weight: 7
			}),
			/* @__PURE__ */ jsx(Label, {
				x: p1.x,
				y: p1.y,
				text: "area A",
				color: C_AREA,
				size: 12,
				weight: 700,
				dx: 8,
				dy: -4,
				anchor: "start"
			}),
			/* @__PURE__ */ jsx(Vector, {
				tail: C,
				tip: {
					x: C.x + n.x * 1.5,
					y: C.y + n.y * 1.5
				},
				color: C_NORMAL
			}),
			/* @__PURE__ */ jsx(AngleArc, {
				at: C,
				from: {
					x: 1,
					y: 0
				},
				to: n,
				rPx: 38,
				label: `θ=${Math.abs(deg)}°`
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: rotTip,
				onMove: (p) => setTheta(Math.atan2(p.y - C.y, p.x - C.x)),
				color: "var(--stage-accent)",
				ariaLabel: "rotate the area",
				r: 7
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "field E₀",
				value: fmt$1(E0),
				children: /* @__PURE__ */ jsx(Slider, {
					value: E0,
					min: 1,
					max: 12,
					step: 1,
					onChange: setE0,
					ariaLabel: "field strength"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "area A",
				value: fmt$1(A),
				children: /* @__PURE__ */ jsx(Slider, {
					value: A,
					min: 1,
					max: 6,
					step: .5,
					onChange: setA,
					ariaLabel: "area size"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "angle θ",
				value: `${Math.abs(deg)}°`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: deg,
					min: -90,
					max: 90,
					step: 5,
					onChange: (v) => setTheta(v * Math.PI / 180),
					ariaLabel: "angle of the area"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "medium",
				children: /* @__PURE__ */ jsx("span", {
					className: "lab-field-row",
					children: MEDIA.map((m) => /* @__PURE__ */ jsx(Chip, {
						selected: er === m.er,
						onClick: () => setEr(m.er),
						children: m.name
					}, m.name))
				})
			})
		] }),
		aside: /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					display: "grid",
					gap: 6,
					fontVariantNumeric: "tabular-nums",
					fontSize: 13
				},
				children: [
					/* @__PURE__ */ jsxs("span", { children: ["lines threading the area: ", /* @__PURE__ */ jsx("strong", {
						style: { color: C_THREAD },
						children: threads
					})] }),
					/* @__PURE__ */ jsxs("span", { children: [
						"E = E₀/εr = ",
						/* @__PURE__ */ jsx("strong", { children: fmt$1(Eeff) }),
						" ",
						er > 1 ? `(÷${er} in ${MEDIA.find((m) => m.er === er)?.name})` : ""
					] }),
					/* @__PURE__ */ jsxs("span", { children: ["Φ = E·A·cosθ = ", /* @__PURE__ */ jsx("strong", { children: fmt$1(phi) })] }),
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-muted)" },
						children: Math.abs(deg) >= 88 ? "edge-on: nothing threads it, Φ = 0" : Math.abs(deg) < 2 ? "face-on: maximum flux, Φ = E·A" : "tilted: Φ falls with cosθ"
					})
				]
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
export { ElectricFluxLab };