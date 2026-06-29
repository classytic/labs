'use client';

import { LabFrame } from "../../kit/frame.mjs";
import { useReducedMotion } from "../../kit/anim.mjs";
import { CoordPlane } from "../../kit/coords.mjs";
import { Blank, SlotTray, useSlotFill } from "../../kit/slot-fill.mjs";
import { useEffect, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Circle, Label, Point, Polygon, Polyline, Vector, vec } from "@classytic/stage";

//#region src/math/transform/preset.tsx
/**
* TransformLab, the geometry-transformation lab that was missing entirely: translate,
* reflect, rotate, enlarge, one authorable lab switched by `kind` (the same one-lab-many-
* modes shape as StraightLineLab). The learner reads the move, fills its parameters from a
* tile tray ("translate by (▢,▢)", "rotate ▢ about O"), and on a correct fill the shape
* FLIES to the ghost targets, the reward that makes "send the points to the targets" land.
*
* Almost no new engine code: the math is stage core (`vec.rotateAbout` / `vec.lerp` + a
* 6-line applyTf), the drawing is `Polygon`/`Point`/`Circle`/`Vector`, and the answer UI is
* the shared inline slot engine (`useSlotFill` + `Blank` + `SlotTray`). A creator sets the
* shape, the transform, and the distractor tiles, no code.
*/
const C_SRC = "var(--stage-accent)";
const C_IMG = "var(--stage-good)";
const C_GHOST = "var(--stage-muted)";
/** Apply a transform to a point. Pure, all from stage core math. */
function applyTf(p, t) {
	const o = t.about ?? {
		x: 0,
		y: 0
	};
	switch (t.kind) {
		case "translate": return {
			x: p.x + (t.by?.x ?? 0),
			y: p.y + (t.by?.y ?? 0)
		};
		case "reflect":
			switch (t.axis ?? "y") {
				case "x": return {
					x: p.x,
					y: -p.y
				};
				case "y": return {
					x: -p.x,
					y: p.y
				};
				case "y=x": return {
					x: p.y,
					y: p.x
				};
				case "y=-x": return {
					x: -p.y,
					y: -p.x
				};
			}
			return p;
		case "rotate": return vec.rotateAbout(p, o, (t.deg ?? 0) * Math.PI / 180);
		case "enlarge": return {
			x: o.x + (p.x - o.x) * (t.k ?? 1),
			y: o.y + (p.y - o.y) * (t.k ?? 1)
		};
	}
}
const AXIS_LABEL = {
	x: "x-axis",
	y: "y-axis",
	"y=x": "y = x",
	"y=-x": "y = −x"
};
const easeOut = (t) => 1 - (1 - t) ** 3;
const DEFAULTS = {
	translate: {
		kind: "translate",
		by: {
			x: 5,
			y: 1
		}
	},
	reflect: {
		kind: "reflect",
		axis: "y"
	},
	rotate: {
		kind: "rotate",
		deg: 90,
		about: {
			x: 0,
			y: 0
		}
	},
	enlarge: {
		kind: "enlarge",
		k: 2,
		about: {
			x: 0,
			y: 0
		}
	}
};
const PROMPTS = {
	translate: "Complete the translation to send the shape onto the targets.",
	reflect: "Pick the mirror line that lands the shape on the targets.",
	rotate: "Pick the turn (about O) that lands the shape on the targets.",
	enlarge: "Pick the scale factor (centre O) that lands the shape on the targets."
};
function TransformLab(props = {}) {
	const kind = props.transform?.kind ?? "translate";
	const tf = props.transform ?? DEFAULTS[kind];
	const { shape = [
		{
			x: -4,
			y: 0
		},
		{
			x: -2,
			y: 0
		},
		{
			x: -2,
			y: 2
		}
	], view = {
		xMin: -6,
		xMax: 6,
		yMin: -4,
		yMax: 6
	}, height = 380, title = "Transformations", prompt = PROMPTS[kind], activity = `transform-${kind}` } = props;
	const targets = shape.map((p) => applyTf(p, tf));
	let slots;
	let tiles;
	if (kind === "translate") {
		const bx = tf.by?.x ?? 0, by = tf.by?.y ?? 0;
		slots = [{
			id: "dx",
			answer: bx
		}, {
			id: "dy",
			answer: by
		}];
		const lo = Math.min(-3, bx - 2, by - 2), hi = Math.max(3, bx + 2, by + 2);
		const pool = new Set([
			bx,
			by,
			...props.distractors ?? []
		]);
		for (let v = lo; v <= hi; v++) pool.add(v);
		tiles = [...pool].sort((a, b) => a - b);
	} else if (kind === "reflect") {
		slots = [{
			id: "axis",
			answer: AXIS_LABEL[tf.axis ?? "y"]
		}];
		tiles = [
			"x-axis",
			"y-axis",
			"y = x",
			"y = −x"
		];
	} else if (kind === "rotate") {
		slots = [{
			id: "deg",
			answer: `${tf.deg ?? 90}°`
		}];
		tiles = [
			"90°",
			"180°",
			"270°"
		];
	} else {
		const k = tf.k ?? 2;
		slots = [{
			id: "k",
			answer: String(k)
		}];
		tiles = [
			"2",
			"3",
			"4"
		];
	}
	const reduce = useReducedMotion();
	const [prog, setProg] = useState(0);
	const fill = useSlotFill(slots, tiles, activity);
	const solved = fill.solved;
	useEffect(() => {
		if (!solved) {
			setProg(0);
			return;
		}
		if (reduce) {
			setProg(1);
			return;
		}
		let raf = 0;
		let start = 0;
		const tick = (now) => {
			if (!start) start = now;
			const e = Math.min(1, (now - start) / 700);
			setProg(easeOut(e));
			if (e < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [solved, reduce]);
	const current = shape.map((p, i) => vec.lerp(p, targets[i], prog));
	const isPoly = shape.length >= 3;
	const about = tf.about ?? {
		x: 0,
		y: 0
	};
	const figure = /* @__PURE__ */ jsxs(CoordPlane, {
		view,
		height,
		stepX: 1,
		stepY: 1,
		ariaLabel: `${title}: ${kind}`,
		children: [
			isPoly ? /* @__PURE__ */ jsx(Polyline, {
				points: [...targets, targets[0]],
				color: C_GHOST,
				weight: 1.5,
				dashed: true,
				opacity: .7
			}) : null,
			targets.map((t, i) => /* @__PURE__ */ jsx(Circle, {
				center: t,
				r: .26,
				color: C_GHOST,
				weight: 2,
				fill: "none"
			}, `t${i}`)),
			(kind === "rotate" || kind === "enlarge") && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Point, {
				x: about.x,
				y: about.y,
				r: 4,
				color: C_GHOST
			}), /* @__PURE__ */ jsx(Label, {
				x: about.x,
				y: about.y,
				text: "O",
				dx: -10,
				dy: -8,
				size: 12,
				color: C_GHOST
			})] }),
			isPoly && /* @__PURE__ */ jsx(Polygon, {
				points: current,
				color: solved ? C_IMG : C_SRC,
				fill: solved ? C_IMG : C_SRC,
				fillOpacity: .18,
				weight: 2.5
			}),
			current.map((p, i) => /* @__PURE__ */ jsx(Point, {
				x: p.x,
				y: p.y,
				r: 6,
				color: solved ? C_IMG : C_SRC
			}, `p${i}`)),
			kind === "translate" && prog < .05 && shape.map((p, i) => /* @__PURE__ */ jsx(Vector, {
				tail: p,
				tip: targets[i],
				color: C_GHOST,
				weight: 1.5,
				opacity: .5
			}, `v${i}`))
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		footer: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 12,
				justifyItems: "center",
				marginTop: 4
			},
			children: [
				/* @__PURE__ */ jsxs("span", {
					style: {
						display: "inline-flex",
						alignItems: "center",
						gap: 8,
						flexWrap: "wrap",
						fontWeight: 700,
						fontSize: 16
					},
					children: [
						kind === "translate" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
							"translate by ( ",
							/* @__PURE__ */ jsx(Blank, {
								fill,
								id: "dx"
							}),
							" , ",
							/* @__PURE__ */ jsx(Blank, {
								fill,
								id: "dy"
							}),
							" )"
						] }),
						kind === "reflect" && /* @__PURE__ */ jsxs(Fragment$1, { children: ["reflect in the ", /* @__PURE__ */ jsx(Blank, {
							fill,
							id: "axis",
							width: 72
						})] }),
						kind === "rotate" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
							"rotate ",
							/* @__PURE__ */ jsx(Blank, {
								fill,
								id: "deg"
							}),
							" anticlockwise about O"
						] }),
						kind === "enlarge" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
							"enlarge by scale factor ",
							/* @__PURE__ */ jsx(Blank, {
								fill,
								id: "k"
							}),
							" , centre O"
						] })
					]
				}),
				/* @__PURE__ */ jsx(SlotTray, { fill }),
				solved && /* @__PURE__ */ jsx("p", {
					role: "status",
					style: {
						margin: 0,
						color: "var(--stage-good)",
						fontWeight: 700
					},
					children: "✓ Landed on the targets."
				})
			]
		}),
		children: figure
	});
}

//#endregion
export { TransformLab, applyTf };