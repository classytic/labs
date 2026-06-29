'use client';

import { Chip } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Circle, Label, MovableDot, Segment, Stage, useCoords } from "@classytic/stage";
import { potentialAt } from "@classytic/stage/field";

//#region src/physics/work-potential/preset.tsx
/**
* WorkPotentialLab, electric potential and the work to move a charge, made
* visible through EQUIPOTENTIALS. A source charge sets up a potential V = kQ/r;
* the dashed rings join points at the SAME potential (like contour lines on a map).
* Field lines run straight out, always at right angles to the rings.
*
* Drag the two points A and B. The work the field does on a test charge q moving
* A → B is W = q(V_A − V_B), and it depends ONLY on the endpoints, never the path:
*   • move B around a ring (same V): ΔV = 0, so W = 0, no work along an equipotential.
*   • move B to a different ring: W = qΔV, whatever route you imagine taking.
*
* V is computed from the shared field model (V = Σ kq/r). Authorable via props +
* an optional checked question.
*/
const VIEW = {
	xMin: -6,
	xMax: 6,
	yMin: -4,
	yMax: 4
};
const POS = "var(--stage-danger, #e03131)";
const NEG = "var(--stage-accent, #3b82f6)";
const RING = "color-mix(in oklab, var(--stage-accent) 45%, transparent)";
const A_COL = "var(--stage-good)";
const B_COL = "var(--stage-accent-2)";
const RING_R = [
	1,
	1.6,
	2.5,
	3.6
];
const fmt$1 = (n) => Math.abs(n) < .005 ? "0" : n.toFixed(2);
/** The source-charge glyph (disc + ± symbol), drawn ON TOP so the handle never hides it. */
function SourceGlyph({ at, q }) {
	const [x, y] = useCoords().toPx(at.x, at.y);
	return /* @__PURE__ */ jsxs("g", {
		style: { pointerEvents: "none" },
		children: [/* @__PURE__ */ jsx("circle", {
			cx: x,
			cy: y,
			r: 13,
			fill: q > 0 ? POS : NEG,
			stroke: "var(--stage-bg)",
			strokeWidth: 2
		}), /* @__PURE__ */ jsx("text", {
			x,
			y: y + 5,
			textAnchor: "middle",
			fontSize: 17,
			fontWeight: 800,
			fill: "white",
			children: q > 0 ? "+" : "−"
		})]
	});
}
function WorkPotentialLab({ title = "Potential & work: equipotentials and W = qΔV", prompt = "Drag A and B. The work to move a charge from A to B is W = qΔV, the change in potential. Slide a point around a ring and the work is zero.", ask, height = 420, activity = "work-potential" } = {}) {
	const [source, setSource] = useState({
		x: 0,
		y: 0
	});
	const [Q, setQ] = useState(1);
	const [A, setA] = useState({
		x: -3,
		y: 1.6
	});
	const [B, setB] = useState({
		x: 2.6,
		y: -1
	});
	const [qSign, setQSign] = useState(1);
	const sources = [{
		kind: "point",
		at: source,
		q: Q
	}];
	const V = (p) => potentialAt(sources, p);
	const Va = V(A), Vb = V(B);
	const dV = Va - Vb;
	const W = qSign * dV;
	const sameRing = Math.abs(dV) < .02;
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view: VIEW,
		height,
		preserveAspect: true,
		ariaLabel: "Equipotential rings around a charge, with two draggable points and the work between them",
		children: [
			Array.from({ length: 8 }, (_, i) => {
				const a = Math.PI * 2 * i / 8;
				const d = {
					x: Math.cos(a),
					y: Math.sin(a)
				};
				return {
					from: {
						x: source.x + d.x * .4,
						y: source.y + d.y * .4
					},
					to: {
						x: source.x + d.x * 5.5,
						y: source.y + d.y * 5.5
					}
				};
			}).map((r, i) => /* @__PURE__ */ jsx(Segment, {
				from: r.from,
				to: r.to,
				color: "color-mix(in oklab, var(--stage-accent) 22%, transparent)",
				weight: 1.2
			}, `r${i}`)),
			RING_R.map((r, i) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx(Circle, {
				center: source,
				r,
				color: RING,
				fill: "none",
				weight: 1.6,
				dashed: true
			}), /* @__PURE__ */ jsx(Label, {
				x: source.x + r * .82,
				y: source.y + r * .57,
				text: `V=${fmt$1(Q / r)}`,
				color: RING,
				size: 10,
				dx: 2
			})] }, `ring${i}`)),
			/* @__PURE__ */ jsx(Segment, {
				from: A,
				to: B,
				color: "var(--stage-muted)",
				weight: 1.6,
				dashed: true
			}),
			/* @__PURE__ */ jsx(Label, {
				x: A.x,
				y: A.y,
				text: `A · V=${fmt$1(Va)}`,
				color: A_COL,
				size: 12,
				weight: 700,
				dx: 10,
				dy: -8,
				anchor: "start"
			}),
			/* @__PURE__ */ jsx(Label, {
				x: B.x,
				y: B.y,
				text: `B · V=${fmt$1(Vb)}`,
				color: B_COL,
				size: 12,
				weight: 700,
				dx: 10,
				dy: -8,
				anchor: "start"
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: source,
				onMove: setSource,
				color: Q > 0 ? POS : NEG,
				ariaLabel: "source charge",
				r: 8
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: A,
				onMove: setA,
				color: A_COL,
				ariaLabel: "point A, drag it",
				r: 7
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: B,
				onMove: setB,
				color: B_COL,
				ariaLabel: "point B, drag it",
				r: 7
			}),
			/* @__PURE__ */ jsx(SourceGlyph, {
				at: source,
				q: Q
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "source charge",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: Q > 0,
					onClick: () => setQ(1),
					children: "+"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: Q < 0,
					onClick: () => setQ(-1),
					children: "−"
				})]
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "moving charge q",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: qSign > 0,
					onClick: () => setQSign(1),
					children: "+"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: qSign < 0,
					onClick: () => setQSign(-1),
					children: "−"
				})]
			})
		})] }),
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
					/* @__PURE__ */ jsxs("span", {
						style: { color: A_COL },
						children: [
							"V",
							/* @__PURE__ */ jsx("sub", { children: "A" }),
							" = ",
							/* @__PURE__ */ jsx("strong", { children: fmt$1(Va) })
						]
					}),
					/* @__PURE__ */ jsxs("span", {
						style: { color: B_COL },
						children: [
							"V",
							/* @__PURE__ */ jsx("sub", { children: "B" }),
							" = ",
							/* @__PURE__ */ jsx("strong", { children: fmt$1(Vb) })
						]
					}),
					/* @__PURE__ */ jsxs("span", { children: [
						"ΔV = V",
						/* @__PURE__ */ jsx("sub", { children: "A" }),
						" − V",
						/* @__PURE__ */ jsx("sub", { children: "B" }),
						" = ",
						/* @__PURE__ */ jsx("strong", { children: fmt$1(dV) })
					] }),
					/* @__PURE__ */ jsxs("span", { children: ["W = q·ΔV = ", /* @__PURE__ */ jsx("strong", { children: fmt$1(W) })] }),
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-muted)" },
						children: sameRing ? "A and B on the same ring: ΔV = 0, so no work." : "W depends only on the endpoints, not the path."
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
export { WorkPotentialLab };