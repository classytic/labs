'use client';

import { gcd, round } from "../../core/util.mjs";
import { StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { getScene } from "../../kit/scenes.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Label, MovableDot, Segment, Stage } from "@classytic/stage";

//#region src/math/ratio-share/preset.tsx
/**
* RatioShareLab, the authorable "share in a ratio" manipulative: a quantity is a
* single bar, and the learner drags ONE divider to split it in the ratio a:b.
* The split reads back live as an amount AND as a ratio that simplifies, so
* "share £60 in 2:3" becomes a thing you slide until 24:36 clicks to 2:3. The
* target divider is shown faint; landing on any split whose simplified ratio is
* a:b solves it (so 40:60 and 2:3 are visibly the same share).
*
* One engine, many uses, all data: set the ratio a:b, the total, the unit and
* the two side labels. Built on the juiced <MovableDot>.
*/
function RatioShareLab(props = {}) {
	const { a = 2, b = 3, total = 100, unit = "", labelA = "A", labelB = "B", step = 1, scene, height = 220, title = "Share in a ratio", prompt = `Share ${total}${unit ? " " + unit : ""} in the ratio ${a} : ${b}. Drag the divider.`, activity = "ratio-share" } = props;
	const correct = total * a / (a + b);
	const clamp = (v) => Math.max(0, Math.min(total, Math.round(v / step) * step));
	const [split, setSplit] = useState(clamp(props.total != null ? 0 : 0));
	useEffect(() => {
		setSplit(0);
	}, [
		total,
		a,
		b,
		step
	]);
	const rest = total - split;
	const tg = gcd(a, b);
	const sg = gcd(split, rest);
	const solved = split > 0 && rest > 0 && split / sg === a / tg && rest / sg === b / tg;
	const colA = solved ? "var(--stage-good)" : "var(--stage-accent)";
	const colB = solved ? "#34c6c6" : "#e85aa6";
	useCheckpoint({
		solved,
		activity,
		response: `${split} : ${rest}`
	});
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin: -total * .04,
			xMax: total * 1.12,
			yMin: -1.7,
			yMax: 1.5
		},
		height,
		preserveAspect: false,
		pad: 14,
		ariaLabel: `A bar of ${total} split into ${split} and ${rest}`,
		children: [
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: 0,
					y: 0
				},
				to: {
					x: Math.max(1e-4, split),
					y: 0
				},
				color: colA,
				weight: 34
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: split,
					y: 0
				},
				to: {
					x: total,
					y: 0
				},
				color: colB,
				weight: 34,
				opacity: .92
			}),
			split > total * .06 && /* @__PURE__ */ jsx(Label, {
				x: split / 2,
				y: 0,
				text: `${round(split)}`,
				color: "var(--stage-fg)",
				size: 13,
				weight: 700
			}),
			rest > total * .06 && /* @__PURE__ */ jsx(Label, {
				x: (split + total) / 2,
				y: 0,
				text: `${round(rest)}`,
				color: "var(--stage-fg)",
				size: 13,
				weight: 700
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 0,
				y: 0,
				text: labelA,
				color: "var(--stage-muted)",
				size: 12,
				anchor: "start",
				dy: 32
			}),
			/* @__PURE__ */ jsx(Label, {
				x: total,
				y: 0,
				text: labelB,
				color: "var(--stage-muted)",
				size: 12,
				anchor: "end",
				dy: 32
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: correct,
					y: -.85
				},
				to: {
					x: correct,
					y: .85
				},
				color: "var(--stage-good)",
				weight: 1.75,
				opacity: solved ? .9 : .5,
				dashed: true
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: split,
					y: 0
				},
				onMove: (p) => setSplit(clamp(p.x)),
				constrain: "horizontal",
				range: {
					min: 0,
					max: total
				},
				snap: step,
				step,
				readout: () => `${round(split)} : ${round(rest)}`,
				color: "var(--stage-fg)",
				r: 9,
				ariaLabel: "ratio divider"
			})
		]
	});
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [
		/* @__PURE__ */ jsxs("span", {
			style: {
				fontWeight: 700,
				fontSize: 16,
				fontVariantNumeric: "tabular-nums"
			},
			children: [
				round(split),
				" : ",
				round(rest)
			]
		}),
		split > 0 && rest > 0 && /* @__PURE__ */ jsxs("span", {
			style: { opacity: .75 },
			children: [
				"= ",
				round(split / sg),
				" : ",
				round(rest / sg)
			]
		}),
		/* @__PURE__ */ jsx(StatusPill, {
			ok: solved,
			children: solved ? `✓ ${a} : ${b}` : `target ${a} : ${b}`
		})
	] });
	const twin = scene && scene !== "none" ? getScene(scene)?.render({
		frac: total > 0 ? split / total : 0,
		guessTone: solved ? "ok" : "idle",
		color: colA,
		label: `${labelA}: ${round(split)}`,
		width: 132,
		height: 170
	}) : null;
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls,
		aside: twin ? /* @__PURE__ */ jsx("div", {
			style: {
				display: "grid",
				placeItems: "center"
			},
			children: twin
		}) : void 0,
		children: figure
	});
}

//#endregion
export { RatioShareLab };