'use client';

import { Chip } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { MovableDot, Stage, useCoords } from "@classytic/stage";
import { fieldAt, fieldLines } from "@classytic/stage/field";

//#region src/physics/gauss-law/preset.tsx
/**
* GaussLab, Gauss's law as a thing you can see: the net number of field lines
* crossing OUT of a closed surface depends only on the charge it ENCLOSES, not on
* the surface's size or shape, and not at all on charges outside it.
*
* A Gaussian loop (drag its centre, drag the rim to resize) sits in the field of
* two charges. Around the loop, short markers show which way the field crosses it:
* GREEN points out (flux leaving), RED points in (flux entering).
*   • enclose a + charge: every marker points out. Resize the loop: still all out,
*     the net is unchanged, that is the whole point of Gauss's law.
*   • a charge OUTSIDE: every line that enters one side leaves the other, so the
*     greens and reds cancel and the net flux is zero.
* The readout gives the enclosed charge Q and the net flux Φ = Q/ε₀.
*
* Built on the shared stage `field` kernel (same one that draws electric-field
* and magnetism). Authorable via props + an optional checked question.
*/
const VIEW = {
	xMin: -6.5,
	xMax: 6.5,
	yMin: -4.1,
	yMax: 4.1
};
const POS = "var(--stage-danger, #e03131)";
const NEG = "var(--stage-accent, #3b82f6)";
const OUT = "var(--stage-good)";
const IN = "var(--stage-danger, #e03131)";
const M = 20;
/** The charge glyphs (coloured disc + ± symbol), drawn ON TOP so the handles never hide them. */
function ChargeGlyphs({ charges }) {
	const c = useCoords();
	return /* @__PURE__ */ jsx("g", {
		style: { pointerEvents: "none" },
		children: charges.map((ch, i) => {
			const [x, y] = c.toPx(ch.at.x, ch.at.y);
			return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("circle", {
				cx: x,
				cy: y,
				r: 14,
				fill: ch.q > 0 ? POS : NEG,
				stroke: "var(--stage-bg)",
				strokeWidth: 2
			}), /* @__PURE__ */ jsx("text", {
				x,
				y: y + 5,
				textAnchor: "middle",
				fontSize: 18,
				fontWeight: 800,
				fill: "white",
				children: ch.q > 0 ? "+" : "−"
			})] }, i);
		})
	});
}
function GaussFigure({ sources, lines, center, radius }) {
	const c = useCoords();
	const P = (v) => c.toPx(v.x, v.y);
	const [cx, cy] = P(center);
	const rPx = Math.abs(c.toPx(center.x + radius, center.y)[0] - cx);
	const markers = [];
	for (let i = 0; i < M; i++) {
		const ang = 2 * Math.PI * i / M;
		const nhat = {
			x: Math.cos(ang),
			y: Math.sin(ang)
		};
		const p = {
			x: center.x + radius * nhat.x,
			y: center.y + radius * nhat.y
		};
		const E = fieldAt(sources, p);
		const out = E.x * nhat.x + E.y * nhat.y > 0;
		const L = .32;
		const tip = out ? {
			x: p.x + nhat.x * L,
			y: p.y + nhat.y * L
		} : {
			x: p.x - nhat.x * L,
			y: p.y - nhat.y * L
		};
		const [px, py] = P(p), [tx, ty] = P(tip);
		markers.push(/* @__PURE__ */ jsx("line", {
			x1: px,
			y1: py,
			x2: tx,
			y2: ty,
			stroke: out ? OUT : IN,
			strokeWidth: 2.6,
			strokeLinecap: "round"
		}, `m${i}`));
	}
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		lines.map((ln, i) => /* @__PURE__ */ jsx("polyline", {
			points: ln.points.map((pt) => P(pt).join(",")).join(" "),
			fill: "none",
			stroke: "color-mix(in oklab, var(--stage-accent) 28%, transparent)",
			strokeWidth: 1.3,
			strokeLinejoin: "round"
		}, `l${i}`)),
		/* @__PURE__ */ jsx("circle", {
			cx,
			cy,
			r: rPx,
			fill: "color-mix(in oklab, var(--stage-good) 8%, transparent)",
			stroke: "var(--stage-good)",
			strokeWidth: 2,
			strokeDasharray: "7 5"
		}),
		markers
	] });
}
function GaussLab({ title = "Gauss’s law: flux depends only on the charge inside", prompt = "Drag the loop and resize it. Green markers are field leaving, red are field entering. The net depends only on the charge enclosed, not the loop’s size.", ask, height = 420, activity = "gauss-law" } = {}) {
	const [chA, setChA] = useState({
		x: -1.3,
		y: 0
	});
	const [chB, setChB] = useState({
		x: 4.8,
		y: 0
	});
	const [qa, setQa] = useState(1);
	const [qb, setQb] = useState(1);
	const [center, setCenter] = useState({
		x: .4,
		y: 0
	});
	const [rim, setRim] = useState({
		x: 2.6,
		y: 0
	});
	const radius = Math.max(.6, Math.hypot(rim.x - center.x, rim.y - center.y));
	const charges = useMemo(() => [{
		at: chA,
		q: qa
	}, {
		at: chB,
		q: qb
	}], [
		chA,
		chB,
		qa,
		qb
	]);
	const sources = useMemo(() => charges.map((ch) => ({
		kind: "point",
		at: ch.at,
		q: ch.q
	})), [charges]);
	const lines = useMemo(() => fieldLines(sources, {
		perSource: 12,
		step: .07,
		maxSteps: 600,
		bounds: VIEW,
		seed: .4
	}), [sources]);
	const enclosed = charges.filter((ch) => Math.hypot(ch.at.x - center.x, ch.at.y - center.y) < radius);
	const Qenc = enclosed.reduce((s, ch) => s + ch.q, 0);
	const verdict = Qenc > 0 ? "net flux OUT" : Qenc < 0 ? "net flux IN" : "net flux ZERO";
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view: VIEW,
		height,
		ariaLabel: `Gaussian loop enclosing charge ${Qenc}`,
		children: [
			/* @__PURE__ */ jsx(GaussFigure, {
				sources,
				lines,
				center,
				radius
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: chA,
				onMove: setChA,
				color: qa > 0 ? POS : NEG,
				ariaLabel: "charge A",
				r: 8
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: chB,
				onMove: setChB,
				color: qb > 0 ? POS : NEG,
				ariaLabel: "charge B",
				r: 8
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: center,
				onMove: (p) => {
					const d = {
						x: rim.x - center.x,
						y: rim.y - center.y
					};
					setCenter(p);
					setRim({
						x: p.x + d.x,
						y: p.y + d.y
					});
				},
				color: "var(--stage-good)",
				ariaLabel: "loop centre, drag to move it",
				r: 7
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: rim,
				onMove: setRim,
				color: "var(--stage-good)",
				ariaLabel: "loop edge, drag to resize",
				r: 6
			}),
			/* @__PURE__ */ jsx(ChargeGlyphs, { charges })
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "charge A",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: qa > 0,
					onClick: () => setQa(1),
					children: "+"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: qa < 0,
					onClick: () => setQa(-1),
					children: "−"
				})]
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "charge B",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: qb > 0,
					onClick: () => setQb(1),
					children: "+"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: qb < 0,
					onClick: () => setQb(-1),
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
					/* @__PURE__ */ jsxs("span", { children: ["charges enclosed: ", /* @__PURE__ */ jsx("strong", { children: enclosed.length })] }),
					/* @__PURE__ */ jsxs("span", { children: ["enclosed charge Q = ", /* @__PURE__ */ jsxs("strong", { children: [Qenc > 0 ? "+" : "", Qenc] })] }),
					/* @__PURE__ */ jsxs("span", { children: ["Φ = Q/ε₀ → ", /* @__PURE__ */ jsx("strong", {
						style: { color: Qenc > 0 ? OUT : Qenc < 0 ? IN : "var(--stage-muted)" },
						children: verdict
					})] }),
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-muted)" },
						children: "resize the loop: same charge inside, same flux. A charge outside adds zero."
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
export { GaussLab };