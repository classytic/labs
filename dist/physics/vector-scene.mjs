'use client';

import { clamp, toDeg } from "../core/util.mjs";
import { LabFrame } from "../kit/frame.mjs";
import { LabeledVector } from "../kit/diagram.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Axes, Dot, Grid, MovableDot, Stage } from "@classytic/stage";

//#region src/physics/vector-scene.tsx
/**
* VectorScene, a GENERAL vector-algebra board (not one problem), now on the
* @classytic/stage engine (SVG arrows, draggable tips, accessible).
*
* A creator declares named vectors; some are draggable (drag the tip to set
* direction & magnitude), some are *derived* (sum or difference of others), and
* any vector can be anchored tip-to-tail on another. The board shows the arrows,
* optional dashed component (sin/cos) decomposition, and per-vector magnitude +
* angle. One authored scene each = river crossing, rain-on-a-walker, relative
* velocity, force balance, projectile components, … thousands of problems from
* one tool.
*
*   <VectorScene vectors={[
*     { id:'boat', dx:0, dy:4, draggable:true, label:'boat' },
*     { id:'cur',  dx:2, dy:0, label:'current' },
*     { id:'R', combine:{op:'add', of:['boat','cur']}, label:'resultant', components:true },
*   ]} />
*/
const DEFAULT = [
	{
		id: "a",
		dx: 3,
		dy: 1,
		draggable: true,
		label: "a",
		color: "var(--stage-accent)"
	},
	{
		id: "b",
		dx: 1,
		dy: 3,
		draggable: true,
		label: "b",
		color: "var(--stage-accent-2)"
	},
	{
		id: "R",
		combine: {
			op: "add",
			of: ["a", "b"]
		},
		label: "a + b",
		color: "var(--stage-good)",
		components: true
	}
];
function resolveScene(vectors, overrides) {
	const comp = /* @__PURE__ */ new Map();
	const tail = /* @__PURE__ */ new Map();
	const out = [];
	for (const v of vectors) {
		let c;
		if (v.combine) {
			const a = comp.get(v.combine.of[0]) ?? {
				x: 0,
				y: 0
			};
			const b = comp.get(v.combine.of[1]) ?? {
				x: 0,
				y: 0
			};
			c = v.combine.op === "sub" ? {
				x: a.x - b.x,
				y: a.y - b.y
			} : {
				x: a.x + b.x,
				y: a.y + b.y
			};
		} else c = overrides[v.id] ?? {
			x: v.dx ?? 0,
			y: v.dy ?? 0
		};
		comp.set(v.id, c);
		const anchor = v.from && tail.has(v.from) ? {
			x: tail.get(v.from).x + comp.get(v.from).x,
			y: tail.get(v.from).y + comp.get(v.from).y
		} : {
			x: 0,
			y: 0
		};
		tail.set(v.id, anchor);
		out.push({
			id: v.id,
			tail: anchor,
			comp: c,
			color: v.color ?? "var(--stage-accent)",
			label: v.label,
			components: v.components,
			draggable: v.draggable && !v.combine
		});
	}
	return out;
}
function autoView(vectors) {
	const r = resolveScene(vectors, {});
	const xs = [0], ys = [0];
	for (const v of r) {
		xs.push(v.tail.x, v.tail.x + v.comp.x);
		ys.push(v.tail.y, v.tail.y + v.comp.y);
	}
	const pad = 1.5;
	const span = Math.max(2, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
	const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
	const half = span / 2 + pad;
	return {
		xMin: cx - half,
		xMax: cx + half,
		yMin: cy - half,
		yMax: cy + half
	};
}
function VectorScene({ vectors, view, title = "Vectors", height = 340 } = {}) {
	const vecs = vectors && vectors.length ? vectors : DEFAULT;
	const [overrides, setOverrides] = useState({});
	useEffect(() => {
		setOverrides({});
	}, [vecs.map((v) => `${v.id}:${v.dx},${v.dy}`).join("|")]);
	const v = view ?? autoView(vecs);
	const resolved = resolveScene(vecs, overrides);
	const drawable = resolved.filter((r) => Math.hypot(r.comp.x, r.comp.y) > 1e-6);
	const draggables = resolved.filter((r) => r.draggable);
	const labelled = drawable.filter((r) => r.label);
	const figure = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs(Stage, {
			view: v,
			height,
			ariaLabel: `Vector diagram: ${drawable.map((r) => r.label ?? r.id).join(", ")}`,
			children: [
				/* @__PURE__ */ jsx(Grid, {}),
				/* @__PURE__ */ jsx(Axes, {}),
				/* @__PURE__ */ jsx(Dot, {
					x: 0,
					y: 0,
					r: 3,
					color: "var(--stage-fg)",
					opacity: .6
				}),
				drawable.map((r) => /* @__PURE__ */ jsx(LabeledVector, {
					tail: r.tail,
					comp: r.comp,
					color: r.color,
					label: r.label,
					components: r.components
				}, r.id)),
				draggables.map((r) => /* @__PURE__ */ jsx(MovableDot, {
					value: {
						x: r.tail.x + r.comp.x,
						y: r.tail.y + r.comp.y
					},
					onMove: (p) => setOverrides((o) => ({
						...o,
						[r.id]: {
							x: clamp(p.x - r.tail.x, -50, 50),
							y: clamp(p.y - r.tail.y, -50, 50)
						}
					})),
					color: r.color,
					ariaLabel: `tip of vector ${r.label ?? r.id}`
				}, `h-${r.id}`))
			]
		})
	});
	const aside = labelled.length > 0 ? /* @__PURE__ */ jsx("div", {
		style: {
			display: "grid",
			gap: 4,
			fontVariantNumeric: "tabular-nums",
			fontWeight: 600
		},
		children: labelled.map((r) => {
			const mag = Math.hypot(r.comp.x, r.comp.y);
			const ang = toDeg(Math.atan2(r.comp.y, r.comp.x));
			return /* @__PURE__ */ jsxs("span", {
				style: { color: r.color },
				children: [
					r.label,
					": ",
					mag.toFixed(2),
					" ∠ ",
					ang.toFixed(0),
					"°"
				]
			}, r.id);
		})
	}) : void 0;
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: draggables.length > 0 ? "Drag a vector’s tip to change it, sums and components update live." : void 0,
		aside,
		children: figure
	});
}

//#endregion
export { VectorScene };