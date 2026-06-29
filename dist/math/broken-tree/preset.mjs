'use client';

import { clamp } from "../../core/util.mjs";
import { Callout, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { AngleArc, RightAngleMark } from "../../kit/diagram.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Circle, Label, MovableDot, Polygon, Segment, Stage } from "@classytic/stage";

//#region src/math/broken-tree/preset.tsx
/**
* BrokenTreeLab, the "tree snaps in the wind" trig word problem, but as a thing you
* PLAY WITH, not a labelled wireframe. A whole tree of height H stands by a house at
* distance D. DRAG the break point up/down the trunk: the leafy top snaps off, bends
* over, and its tip slides along the ground in real time. Break it at the right height
* and the falling top just reaches the house, that's the goal + the payoff.
*
* Physics of the bend: the broken top is a RIGID piece of length L = H − h that pivots
* at the break (height h) and swings down until its tip touches the ground, landing at
*     d = √(L² − h²)        with   tan θ = h / d   at the tip.
* (It can only reach the ground while h ≤ H/2, i.e. the broken piece is long enough.)
* So as you break LOWER, the top is longer and lands FARTHER, you feel the relationship
* instead of reading it. The classic "find the original height" is the same triangle.
*
* Direct manipulation (MovableDot on the trunk) + a real tree (trunk + foliage) + a
* target = the template for how the trig-scenario library should FEEL. Authorable via
* props (originalHeight, target, …); tokenised where it can be, nature colours for the tree.
*/
const C_TRUNK = "oklch(0.46 0.06 60)";
const C_LEAF = "oklch(0.62 0.15 145)";
const C_LEAF_DK = "oklch(0.5 0.14 150)";
const fmt$1 = (n) => Number.isFinite(n) ? n.toFixed(1) : ", ";
/** A leafy crown: layered blobs, darker low/sides + lighter on top for depth. Transparency
*  is applied to the WHOLE group (a single <g opacity>) so overlapping blobs don't compound
*  into blotchy dark patches, the foliage reads as one flat-tinted shape. */
function Crown({ at, r, opacity = 1 }) {
	const blob = (dx, dy, rr, c) => /* @__PURE__ */ jsx(Circle, {
		center: {
			x: at.x + dx,
			y: at.y + dy
		},
		r: rr,
		color: "none",
		fill: c,
		fillOpacity: 1,
		weight: 0
	});
	return /* @__PURE__ */ jsxs("g", {
		opacity,
		children: [
			blob(-r * .55, -r * .1, r * .72, C_LEAF_DK),
			blob(r * .55, -r * .05, r * .7, C_LEAF_DK),
			blob(0, -r * .35, r * .62, C_LEAF_DK),
			blob(0, r * .05, r * .92, C_LEAF),
			blob(-r * .32, r * .5, r * .5, C_LEAF),
			blob(r * .34, r * .46, r * .56, C_LEAF)
		]
	});
}
function BrokenTreeLab({ originalHeight = 18, target = 12, breakHeight = 3, title = "Snap the tree so its top reaches the house", prompt = "Drag the break point up or down the trunk. The top bends to the ground, break it lower and it falls farther.", height = 340, activity = "broken-tree" } = {}) {
	const H = originalHeight;
	const [breakH, setBreakH] = useState(breakHeight);
	const h = clamp(breakH, .5, H / 2 - .05);
	const L = H - h;
	const d = Math.sqrt(Math.max(0, L * L - h * h));
	const deg = Math.atan2(h, d || 1e-6) * 180 / Math.PI;
	const hasGoal = typeof target === "number";
	const reached = hasGoal && Math.abs(d - target) < .3;
	useCheckpoint({
		solved: reached,
		activity
	});
	const foot = {
		x: 0,
		y: 0
	};
	const brk = {
		x: 0,
		y: h
	};
	const tip = {
		x: d,
		y: 0
	};
	const far = Math.max(d, target ?? 0, H) + 2;
	const pad = far * .08;
	const view = {
		xMin: -pad * 2,
		xMax: far,
		yMin: -pad,
		yMax: H + pad
	};
	const nx = h / (L || 1), ny = d / (L || 1);
	const lf = .34;
	const Lmid = {
		x: brk.x + (tip.x - brk.x) * lf + nx * .9,
		y: brk.y + (tip.y - brk.y) * lf + ny * .9
	};
	const crownAt = {
		x: brk.x + (tip.x - brk.x) * .66,
		y: brk.y + (tip.y - brk.y) * .66 + 1
	};
	const Hx = -pad * 1.4;
	const houseC = reached ? "var(--stage-good)" : "var(--stage-muted)";
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view,
		height,
		preserveAspect: true,
		ariaLabel: `Broken tree: original height ${fmt$1(H)}, broke at ${fmt$1(h)}, top reaches ${fmt$1(d)} along the ground`,
		children: [
			/* @__PURE__ */ jsx(Polygon, {
				points: [
					{
						x: -pad * 2,
						y: 0
					},
					{
						x: far,
						y: 0
					},
					{
						x: far,
						y: -pad
					},
					{
						x: -pad * 2,
						y: -pad
					}
				],
				color: "none",
				fill: "oklch(0.62 0.13 145)",
				fillOpacity: .14,
				weight: 0
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: -pad * 2,
					y: 0
				},
				to: {
					x: far,
					y: 0
				},
				color: "oklch(0.5 0.08 145)",
				weight: 2,
				opacity: .65
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: Hx,
					y: 0
				},
				to: {
					x: Hx,
					y: H
				},
				color: "var(--stage-muted)",
				weight: 1,
				opacity: .7
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: Hx - .4,
					y: 0
				},
				to: {
					x: Hx + .4,
					y: 0
				},
				color: "var(--stage-muted)",
				weight: 1,
				opacity: .7
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: Hx - .4,
					y: H
				},
				to: {
					x: Hx + .4,
					y: H
				},
				color: "var(--stage-muted)",
				weight: 1,
				opacity: .7
			}),
			/* @__PURE__ */ jsx(Label, {
				x: Hx,
				y: H / 2,
				text: `H = ${fmt$1(H)} m`,
				color: "var(--stage-muted)",
				size: 11,
				dx: -5,
				anchor: "end"
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: foot,
				to: {
					x: 0,
					y: H
				},
				color: "var(--stage-muted)",
				weight: 2,
				dashed: true,
				opacity: .35
			}),
			/* @__PURE__ */ jsx(Crown, {
				at: {
					x: 0,
					y: H - .6
				},
				r: 2,
				opacity: .16
			}),
			hasGoal && /* @__PURE__ */ jsxs(Fragment$1, { children: [
				/* @__PURE__ */ jsx(Polygon, {
					points: [
						{
							x: target - 1,
							y: 0
						},
						{
							x: target + 1,
							y: 0
						},
						{
							x: target + 1,
							y: 1.8
						},
						{
							x: target - 1,
							y: 1.8
						}
					],
					color: houseC,
					fill: houseC,
					fillOpacity: .16,
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Polygon, {
					points: [
						{
							x: target - 1.35,
							y: 1.8
						},
						{
							x: target,
							y: 3
						},
						{
							x: target + 1.35,
							y: 1.8
						}
					],
					color: houseC,
					fill: houseC,
					fillOpacity: .28,
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Polygon, {
					points: [
						{
							x: target - .3,
							y: 0
						},
						{
							x: target + .3,
							y: 0
						},
						{
							x: target + .3,
							y: 1.1
						},
						{
							x: target - .3,
							y: 1.1
						}
					],
					color: houseC,
					fill: houseC,
					fillOpacity: .42,
					weight: 1
				}),
				/* @__PURE__ */ jsx(Label, {
					x: target,
					y: 0,
					text: `house · ${fmt$1(target)} m`,
					color: "var(--stage-muted)",
					size: 11,
					dy: 16
				})
			] }),
			/* @__PURE__ */ jsx(Polygon, {
				points: [
					foot,
					brk,
					tip
				],
				color: "var(--stage-accent)",
				fill: "var(--stage-accent)",
				fillOpacity: .12,
				weight: 0
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: foot,
				to: brk,
				color: C_TRUNK,
				weight: 6
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: brk,
				to: tip,
				color: C_TRUNK,
				weight: 5
			}),
			/* @__PURE__ */ jsx(Crown, {
				at: crownAt,
				r: 1.25
			}),
			/* @__PURE__ */ jsx(RightAngleMark, {
				at: foot,
				u: {
					x: 0,
					y: 1
				},
				v: {
					x: 1,
					y: 0
				}
			}),
			/* @__PURE__ */ jsx(AngleArc, {
				at: tip,
				from: {
					x: -1,
					y: 0
				},
				to: {
					x: brk.x - tip.x,
					y: brk.y - tip.y
				},
				rPx: 30,
				label: `θ = ${Math.round(deg)}°`
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 0,
				y: h / 2,
				text: `h = ${fmt$1(h)}`,
				color: C_TRUNK,
				size: 12,
				weight: 700,
				dx: -10,
				anchor: "end"
			}),
			/* @__PURE__ */ jsx(Label, {
				x: Lmid.x,
				y: Lmid.y,
				text: `L = ${fmt$1(L)}`,
				color: C_TRUNK,
				size: 12,
				weight: 700,
				anchor: "middle"
			}),
			/* @__PURE__ */ jsx(Label, {
				x: d / 2,
				y: 0,
				text: `d = ${fmt$1(d)}`,
				color: "var(--stage-fg)",
				size: 12,
				weight: 700,
				dy: 16
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: brk,
				onMove: (p) => setBreakH(clamp(p.y, .5, H / 2 - .05)),
				color: "var(--stage-accent)",
				ariaLabel: "break point, drag up or down the trunk"
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		aside: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 10
			},
			children: [hasGoal && /* @__PURE__ */ jsx("div", {
				className: "lab-pill",
				"data-state": reached ? "ok" : "no",
				role: "status",
				style: { alignSelf: "flex-start" },
				children: reached ? "✓ The top reaches the house!" : `the top lands ${fmt$1(d)} m out, ${d > target ? "break it higher" : "break it lower"}`
			}), /* @__PURE__ */ jsx(Callout, {
				tone: "result",
				children: /* @__PURE__ */ jsxs("div", {
					style: {
						display: "grid",
						gap: 6,
						fontVariantNumeric: "tabular-nums",
						fontSize: 13
					},
					children: [
						/* @__PURE__ */ jsxs("span", { children: ["original height H = ", /* @__PURE__ */ jsx("strong", { children: fmt$1(H) })] }),
						/* @__PURE__ */ jsxs("span", { children: [
							"broke at h = ",
							/* @__PURE__ */ jsx("strong", {
								style: { color: C_TRUNK },
								children: fmt$1(h)
							}),
							" · fell top L = ",
							/* @__PURE__ */ jsx("strong", { children: fmt$1(L) })
						] }),
						/* @__PURE__ */ jsxs("span", { children: [
							"reaches d = ",
							/* @__PURE__ */ jsx("strong", { children: fmt$1(d) }),
							" at θ = ",
							/* @__PURE__ */ jsxs("strong", { children: [Math.round(deg), "°"] })
						] }),
						/* @__PURE__ */ jsx("span", {
							style: { color: "var(--stage-muted)" },
							children: "tan θ = h/d · L = H − h · d = √(L² − h²)"
						})
					]
				})
			})]
		}),
		children: figure
	});
}

//#endregion
export { BrokenTreeLab };