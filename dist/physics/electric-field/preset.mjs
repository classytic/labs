'use client';

import { Chip } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { MovableDot, Stage, useCoords } from "@classytic/stage";
import { fieldAt, fieldLines } from "@classytic/stage/field";

//#region src/physics/electric-field/preset.tsx
/**
* ElectricFieldLab, Coulomb's field you can see and probe, on the same
* @classytic/stage `field` kernel that draws magnetism (one kernel → both). Drag
* two charges (flip either +/−); field lines retrace live, flowing OUT of + into −.
* Drop the test charge anywhere and a force arrow F = qE appears, toward + or away,
* depending on its sign. Interactive (recomputed on drag), not a timed sim.
*/
const VIEW = {
	xMin: -6.5,
	xMax: 6.5,
	yMin: -4.1,
	yMax: 4.1
};
const EFIELD_CHALLENGE = [{
	id: "lines",
	prompt: "Electric field lines point…",
	choices: [{
		value: "out",
		label: "out of + and into −"
	}, {
		value: "in",
		label: "into + and out of −"
	}],
	answer: "out",
	explain: "Field lines flow OUT of a positive charge and INTO a negative one."
}, {
	id: "force",
	prompt: "A positive test charge placed near a + charge feels a force…",
	choices: [
		{
			value: "away",
			label: "pushing it away"
		},
		{
			value: "toward",
			label: "pulling it toward"
		},
		{
			value: "none",
			label: "no force at all"
		}
	],
	answer: "away",
	explain: "F = qE points along E for a + charge, so it is pushed away from the + charge (like repels like)."
}];
const POS = "var(--stage-danger, #e03131)";
const NEG = "var(--stage-accent, #3b82f6)";
const FORCE = "var(--stage-good)";
const mag = (v) => Math.hypot(v.x, v.y) || 1;
function ChargeFigure({ sources, lines, test, testSign }) {
	const c = useCoords();
	const P = (v) => c.toPx(v.x, v.y);
	const arrow = (a, b, key, color) => {
		const [ax, ay] = P(a), [bx, by] = P(b);
		const ang = Math.atan2(by - ay, bx - ax), s = 7;
		return /* @__PURE__ */ jsx("polygon", {
			points: `${bx},${by} ${bx - s * Math.cos(ang - .5)},${by - s * Math.sin(ang - .5)} ${bx - s * Math.cos(ang + .5)},${by - s * Math.sin(ang + .5)}`,
			fill: color
		}, key);
	};
	const E = fieldAt(sources, test);
	const Em = mag(E);
	const dir = {
		x: testSign * E.x / Em,
		y: testSign * E.y / Em
	};
	const fTip = {
		x: test.x + dir.x * 1.1,
		y: test.y + dir.y * 1.1
	};
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		lines.map((ln, i) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("polyline", {
			points: ln.points.map((pt) => P(pt).join(",")).join(" "),
			fill: "none",
			stroke: "color-mix(in oklab, var(--stage-accent) 60%, transparent)",
			strokeWidth: 1.5,
			strokeLinejoin: "round",
			strokeLinecap: "round"
		}), ln.points.length > 24 && (() => {
			const j = Math.floor(ln.points.length * .45);
			return arrow(ln.points[j], ln.points[j + 2], `a${i}`, "var(--stage-accent)");
		})()] }, `l${i}`)),
		(() => {
			const [tx, ty] = P(test);
			const [fx, fy] = P(fTip);
			return /* @__PURE__ */ jsxs("g", {
				style: { pointerEvents: "none" },
				children: [
					/* @__PURE__ */ jsx("line", {
						x1: tx,
						y1: ty,
						x2: fx,
						y2: fy,
						stroke: FORCE,
						strokeWidth: 3,
						strokeLinecap: "round"
					}),
					arrow(test, fTip, "F", FORCE),
					/* @__PURE__ */ jsx("text", {
						x: fx + 6,
						y: fy + 4,
						fontSize: 12,
						fontWeight: 800,
						fill: FORCE,
						children: "F"
					})
				]
			});
		})(),
		(() => {
			const [x, y] = P(test);
			return /* @__PURE__ */ jsxs("g", {
				style: { pointerEvents: "none" },
				children: [/* @__PURE__ */ jsx("circle", {
					cx: x,
					cy: y,
					r: 8,
					fill: "var(--stage-bg)",
					stroke: FORCE,
					strokeWidth: 2.5
				}), /* @__PURE__ */ jsx("text", {
					x,
					y: y + 4,
					textAnchor: "middle",
					fontSize: 11,
					fontWeight: 800,
					fill: FORCE,
					children: testSign > 0 ? "+" : "−"
				})]
			});
		})()
	] });
}
/** The charge discs with their ± sign, drawn ON TOP so the drag handles never hide them. */
function ChargeSymbols({ charges }) {
	const c = useCoords();
	return /* @__PURE__ */ jsx("g", {
		style: { pointerEvents: "none" },
		children: charges.map((ch, i) => {
			const [x, y] = c.toPx(ch.at.x, ch.at.y);
			return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("circle", {
				cx: x,
				cy: y,
				r: 15,
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
function ElectricFieldLab({ title = "Electric field: charges & the force you feel", prompt = "Drag the two charges and flip their signs; field lines flow out of + into −. Drop the test charge and watch the force F = qE.", objectives = [
	"Read an electric field as field lines (out of +, into −)",
	"See like charges repel, opposites attract",
	"Feel the force on a test charge: F = qE"
] } = {}) {
	const [a, setA] = useState({
		x: -2.2,
		y: 0
	});
	const [b, setB] = useState({
		x: 2.2,
		y: 0
	});
	const [qa, setQa] = useState(1);
	const [qb, setQb] = useState(-1);
	const [test, setTest] = useState({
		x: 0,
		y: 2.3
	});
	const [testSign, setTestSign] = useState(1);
	const challenge = useChallenge(EFIELD_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "electric-field"
	});
	const charges = useMemo(() => [{
		at: a,
		q: qa
	}, {
		at: b,
		q: qb
	}], [
		a,
		b,
		qa,
		qb
	]);
	const sources = useMemo(() => charges.map((ch) => ({
		kind: "point",
		at: ch.at,
		q: ch.q
	})), [charges]);
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view: VIEW,
		height: 420,
		ariaLabel: "Electric field lines from two charges, with a draggable test charge feeling a force",
		children: [
			/* @__PURE__ */ jsx(ChargeFigure, {
				sources,
				lines: useMemo(() => fieldLines(sources, {
					perSource: 14,
					step: .07,
					maxSteps: 700,
					bounds: VIEW,
					seed: .35
				}), [sources]),
				test,
				testSign
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: a,
				onMove: (p) => setA(p),
				color: qa > 0 ? POS : NEG,
				ariaLabel: "charge A",
				r: 9
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: b,
				onMove: (p) => setB(p),
				color: qb > 0 ? POS : NEG,
				ariaLabel: "charge B",
				r: 9
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: test,
				onMove: (p) => setTest(p),
				color: FORCE,
				ariaLabel: "test charge",
				r: 8
			}),
			/* @__PURE__ */ jsx(ChargeSymbols, { charges })
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
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
			}),
			/* @__PURE__ */ jsx(Field, {
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
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "test charge",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: testSign > 0,
						onClick: () => setTestSign(1),
						children: "+ probe"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: testSign < 0,
						onClick: () => setTestSign(-1),
						children: "− probe"
					})]
				})
			})
		] }),
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: EFIELD_CHALLENGE,
			state: challenge,
			title: "Predict"
		}),
		children: figure
	});
}

//#endregion
export { ElectricFieldLab };