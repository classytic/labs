'use client';

import { LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, Stage, Vector } from "@classytic/stage";

//#region src/physics/vector-types/preset.tsx
/**
* VectorTypes, a labeled reference figure for the vectors chapter opener:
* equal, negative, null, unit, parallel, position. These are DEFINITIONAL
* (no manipulation builds intuition here), so per the engine's video-vs-
* interactive rule it's a clean figure, not a puzzle. Data-driven: a creator
* can pass their own panels; the default is the standard CAIE/IGCSE set.
*
* Reuses @classytic/stage `Vector`/`Dot`/`Label`, one mini <Stage> per panel.
*/
const A = "var(--stage-accent)";
const A2 = "var(--stage-accent-2)";
const DEFAULT_TYPES = [
	{
		name: "Equal",
		caption: "Same magnitude AND direction.",
		vectors: [{
			tail: {
				x: -1.4,
				y: .7
			},
			comp: {
				x: 2,
				y: 0
			},
			color: A
		}, {
			tail: {
				x: -1.4,
				y: -.8
			},
			comp: {
				x: 2,
				y: 0
			},
			color: A
		}]
	},
	{
		name: "Negative (−a)",
		caption: "Same magnitude, opposite direction.",
		vectors: [{
			tail: {
				x: -1.2,
				y: .6
			},
			comp: {
				x: 2,
				y: 0
			},
			color: A,
			label: "a"
		}, {
			tail: {
				x: 1.2,
				y: -.7
			},
			comp: {
				x: -2,
				y: 0
			},
			color: A2,
			label: "−a"
		}]
	},
	{
		name: "Null (0)",
		caption: "Zero magnitude, no direction.",
		origin: true
	},
	{
		name: "Unit (â)",
		caption: "Magnitude 1: direction only.",
		vectors: [{
			comp: {
				x: 1,
				y: 0
			},
			color: "var(--stage-good)",
			label: "â"
		}],
		origin: true
	},
	{
		name: "Parallel",
		caption: "Same direction, any magnitude.",
		vectors: [{
			tail: {
				x: -1.4,
				y: .7
			},
			comp: {
				x: 1.2,
				y: 0
			},
			color: A
		}, {
			tail: {
				x: -1.4,
				y: -.8
			},
			comp: {
				x: 2.6,
				y: 0
			},
			color: A
		}]
	},
	{
		name: "Position (r)",
		caption: "From a fixed origin O to a point.",
		vectors: [{
			comp: {
				x: 1.5,
				y: 1.1
			},
			color: A2,
			label: "r"
		}],
		origin: true
	}
];
function Panel({ p }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "lang-typecard",
		children: [
			/* @__PURE__ */ jsxs(Stage, {
				view: {
					xMin: -2,
					xMax: 2,
					yMin: -1.6,
					yMax: 1.6
				},
				height: 110,
				preserveAspect: true,
				ariaLabel: `${p.name}: ${p.caption}`,
				children: [p.origin && /* @__PURE__ */ jsx(Dot, {
					x: 0,
					y: 0,
					r: 4,
					color: "var(--stage-muted)"
				}), (p.vectors ?? []).map((v, i) => /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Vector, {
					tail: v.tail ?? {
						x: 0,
						y: 0
					},
					tip: {
						x: (v.tail?.x ?? 0) + v.comp.x,
						y: (v.tail?.y ?? 0) + v.comp.y
					},
					color: v.color ?? A,
					weight: 3
				}), v.label && /* @__PURE__ */ jsx(Label, {
					x: (v.tail?.x ?? 0) + v.comp.x,
					y: (v.tail?.y ?? 0) + v.comp.y,
					text: v.label,
					color: v.color ?? A,
					dx: 8,
					dy: -6,
					size: 13
				})] }, i))]
			}),
			/* @__PURE__ */ jsx("p", {
				className: "lang-typename",
				children: p.name
			}),
			/* @__PURE__ */ jsx("p", {
				className: "lang-typecap",
				children: p.caption
			})
		]
	});
}
const CHALLENGE = [{
	id: "vector-vs-scalar",
	prompt: "Which of these is a VECTOR (it has a direction, not just a size)?",
	choices: [
		{
			value: "velocity",
			label: "Velocity"
		},
		{
			value: "speed",
			label: "Speed"
		},
		{
			value: "mass",
			label: "Mass"
		},
		{
			value: "temperature",
			label: "Temperature"
		}
	],
	answer: "velocity",
	explain: "Velocity is a vector: it carries a direction (e.g. 5 m/s north). Speed, mass and temperature are scalars: magnitude only."
}];
function VectorTypesLab({ types = DEFAULT_TYPES, title = "Types of vectors" }) {
	const ch = useChallenge(CHALLENGE);
	useCheckpoint({
		solved: ch.allCorrect,
		activity: "vector-types"
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: CHALLENGE,
			state: ch
		}),
		children: /* @__PURE__ */ jsx("div", {
			className: "lang-typegrid",
			children: types.map((p, i) => /* @__PURE__ */ jsx(Panel, { p }, i))
		})
	});
}

//#endregion
export { VectorTypesLab };