'use client';

import { Chip } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { MovableDot, Stage, useCoords } from "@classytic/stage";
import { barMagnet, fieldAt, fieldLines } from "@classytic/stage/field";

//#region src/physics/magnetism/preset.tsx
/**
* MagnetismLab, a magnetic field you can SEE and probe (the "magnetism visualized"
* gap). Drag a bar magnet (and its ends to rotate), or switch to a current-carrying
* wire, and the FIELD LINES retrace live on the @classytic/stage `field` kernel , 
* radial dipole lines N→S for the magnet, circular loops for the wire. Drag the
* compass anywhere and its needle snaps to the field there. Interactive, not a
* timed sim (no Play needed): the field is recomputed on every drag.
*/
const VIEW = {
	xMin: -6.5,
	xMax: 6.5,
	yMin: -4.2,
	yMax: 4.2
};
const MAGNETISM_CHALLENGE = [{
	id: "lines",
	prompt: "Outside a bar magnet, the field lines point…",
	choices: [{
		value: "ns",
		label: "from N to S"
	}, {
		value: "sn",
		label: "from S to N"
	}],
	answer: "ns",
	explain: "Outside the magnet field lines run N → S (they close back through the magnet, S → N, inside)."
}, {
	id: "compass",
	prompt: "Drop the compass into the field. Its needle…",
	choices: [
		{
			value: "along",
			label: "lines up along the field there"
		},
		{
			value: "perp",
			label: "sits across the field"
		},
		{
			value: "north",
			label: "always points to true N"
		}
	],
	answer: "along",
	explain: "A compass needle aligns to the LOCAL field, tracing the field line wherever you drop it."
}];
const RED = "var(--stage-danger, #e03131)";
const BLUE = "var(--stage-accent, #3b82f6)";
const sub = (a, b) => ({
	x: a.x - b.x,
	y: a.y - b.y
});
const mag = (v) => Math.hypot(v.x, v.y);
/** All the visuals (field lines + magnet/wire + compass needle), projected to px. */
function FieldFigure({ sources, lines, mode, center, northOff, compass, current }) {
	const c = useCoords();
	const P = (v) => c.toPx(v.x, v.y);
	const arrow = (a, b, key, color) => {
		const [ax, ay] = P(a), [bx, by] = P(b);
		const ang = Math.atan2(by - ay, bx - ax);
		const s = 6;
		const p1 = [bx - s * Math.cos(ang - .5), by - s * Math.sin(ang - .5)];
		const p2 = [bx - s * Math.cos(ang + .5), by - s * Math.sin(ang + .5)];
		return /* @__PURE__ */ jsx("polygon", {
			points: `${bx},${by} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`,
			fill: color,
			opacity: .65
		}, key);
	};
	const lineColor = "color-mix(in oklab, var(--stage-accent) 70%, transparent)";
	const nPole = {
		x: center.x + northOff.x,
		y: center.y + northOff.y
	};
	const sPole = {
		x: center.x - northOff.x,
		y: center.y - northOff.y
	};
	const [cnx, cny] = P(nPole);
	const [csx, csy] = P(sPole);
	const [ccx, ccy] = P(center);
	const fv = fieldAt(sources, compass);
	const fm = mag(fv) || 1;
	const ndir = {
		x: fv.x / fm,
		y: fv.y / fm
	};
	const nTip = {
		x: compass.x + ndir.x * .85,
		y: compass.y + ndir.y * .85
	};
	const nTail = {
		x: compass.x - ndir.x * .85,
		y: compass.y - ndir.y * .85
	};
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		lines.map((ln, i) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("polyline", {
			points: ln.points.map((pt) => P(pt).join(",")).join(" "),
			fill: "none",
			stroke: lineColor,
			strokeWidth: 1.6,
			strokeLinejoin: "round",
			strokeLinecap: "round"
		}), ln.points.length > 24 && (() => {
			const j = Math.floor(ln.points.length * .45);
			const rev = mode === "wire" && current < 0;
			return arrow(ln.points[rev ? j + 2 : j], ln.points[rev ? j : j + 2], `a${i}`, "var(--stage-accent)");
		})()] }, `l${i}`)),
		mode === "magnet" ? /* @__PURE__ */ jsxs("g", { children: [
			/* @__PURE__ */ jsx("line", {
				x1: csx,
				y1: csy,
				x2: ccx,
				y2: ccy,
				stroke: BLUE,
				strokeWidth: 16,
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: ccx,
				y1: ccy,
				x2: cnx,
				y2: cny,
				stroke: RED,
				strokeWidth: 16,
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ jsx("text", {
				x: cnx,
				y: cny + 4,
				textAnchor: "middle",
				fontSize: 12,
				fontWeight: 800,
				fill: "white",
				children: "N"
			}),
			/* @__PURE__ */ jsx("text", {
				x: csx,
				y: csy + 4,
				textAnchor: "middle",
				fontSize: 12,
				fontWeight: 800,
				fill: "white",
				children: "S"
			})
		] }) : /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("circle", {
			cx: ccx,
			cy: ccy,
			r: 13,
			fill: "var(--stage-bg)",
			stroke: "var(--stage-metal)",
			strokeWidth: 2.5
		}), current >= 0 ? /* @__PURE__ */ jsx("circle", {
			cx: ccx,
			cy: ccy,
			r: 3.5,
			fill: "var(--stage-metal)"
		}) : /* @__PURE__ */ jsxs("g", {
			stroke: "var(--stage-metal)",
			strokeWidth: 2,
			children: [/* @__PURE__ */ jsx("line", {
				x1: ccx - 7,
				y1: ccy - 7,
				x2: ccx + 7,
				y2: ccy + 7
			}), /* @__PURE__ */ jsx("line", {
				x1: ccx - 7,
				y1: ccy + 7,
				x2: ccx + 7,
				y2: ccy - 7
			})]
		})] }),
		/* @__PURE__ */ jsxs("g", {
			style: { pointerEvents: "none" },
			children: [
				/* @__PURE__ */ jsx("line", {
					x1: P(nTail)[0],
					y1: P(nTail)[1],
					x2: P(nTip)[0],
					y2: P(nTip)[1],
					stroke: "var(--stage-metal)",
					strokeWidth: 3,
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ jsx("line", {
					x1: ccx,
					y1: ccy,
					x2: P(nTip)[0],
					y2: P(nTip)[1],
					stroke: RED,
					strokeWidth: 3,
					strokeLinecap: "round",
					opacity: 0
				}),
				arrow(compass, nTip, "compassN", RED)
			]
		})
	] });
}
function MagnetismLab({ title = "Magnetism: field you can see", prompt = "Drag the magnet (and its ends to turn it), or switch to a wire. The compass snaps to the field wherever you drop it.", objectives = [
	"Read a magnetic field as field lines",
	"Field lines run N → S; a compass aligns with them",
	"A current makes circular field loops"
] } = {}) {
	const [mode, setMode] = useState("magnet");
	const [center, setCenter] = useState({
		x: -.5,
		y: 0
	});
	const [northOff, setNorthOff] = useState({
		x: 1.8,
		y: 0
	});
	const [compass, setCompass] = useState({
		x: 3.2,
		y: 1.6
	});
	const [current, setCurrent] = useState(1);
	const challenge = useChallenge(MAGNETISM_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "magnetism"
	});
	const sources = useMemo(() => mode === "magnet" ? barMagnet(center, northOff, 1, 2 * mag(northOff)) : [{
		kind: "wire",
		at: center,
		i: current
	}], [
		mode,
		center,
		northOff,
		current
	]);
	const lines = useMemo(() => fieldLines(sources, {
		perSource: 16,
		step: .07,
		maxSteps: 700,
		bounds: VIEW,
		seed: .35
	}), [sources]);
	const nPole = {
		x: center.x + northOff.x,
		y: center.y + northOff.y
	};
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "source",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: mode === "magnet",
					onClick: () => setMode("magnet"),
					children: "bar magnet"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: mode === "wire",
					onClick: () => setMode("wire"),
					children: "current wire"
				})]
			})
		}), mode === "wire" && /* @__PURE__ */ jsx(Field, {
			label: "current",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: current >= 0,
					onClick: () => setCurrent(1),
					children: "⊙ out"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: current < 0,
					onClick: () => setCurrent(-1),
					children: "⊗ in"
				})]
			})
		})] }),
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: MAGNETISM_CHALLENGE,
			state: challenge,
			title: "Predict"
		}),
		children: /* @__PURE__ */ jsxs(Stage, {
			view: VIEW,
			height: 420,
			ariaLabel: "Magnetic field lines with a draggable magnet and compass",
			children: [
				/* @__PURE__ */ jsx(FieldFigure, {
					sources,
					lines,
					mode,
					center,
					northOff,
					compass,
					current
				}),
				/* @__PURE__ */ jsx(MovableDot, {
					value: center,
					onMove: (p) => setCenter(p),
					ariaLabel: mode === "magnet" ? "magnet position" : "wire position",
					r: 9
				}),
				mode === "magnet" && /* @__PURE__ */ jsx(MovableDot, {
					value: nPole,
					onMove: (p) => setNorthOff(sub(p, center)),
					color: RED,
					ariaLabel: "magnet orientation (north pole)",
					r: 8
				}),
				/* @__PURE__ */ jsx(MovableDot, {
					value: compass,
					onMove: (p) => setCompass(p),
					color: "var(--stage-good)",
					ariaLabel: "compass",
					r: 8
				})
			]
		})
	});
}

//#endregion
export { MagnetismLab };