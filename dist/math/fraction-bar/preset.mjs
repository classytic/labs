'use client';

import { gcd, round } from "../../core/util.mjs";
import { StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { getScene } from "../../kit/scenes.mjs";
import { BarStrip } from "../../kit/bar-strip.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { MovableDot, Segment, Stage } from "@classytic/stage";

//#region src/math/fraction-bar/preset.tsx
/**
* FractionBarLab, the authorable PART-WHOLE / fraction manipulative: a strip is
* split into `denom` equal parts and the learner drags to shade `num` of them.
* The same shaded amount reads as a fraction, a decimal, a percent, and (when a
* `whole` is set) a concrete quantity, so k/n, 0.75, 75% and "15 of 20" are
* visibly ONE thing. An optional second strip at a different denominator makes
* EQUIVALENT fractions (¾ = 6⁄8) something you see by re-cutting the same length.
*
* One engine, many uses, all data: set denom, a target to shade, a whole+unit
* for "fraction of a quantity", or a compare denominator for equivalence. Built
* on the juiced <MovableDot> (snaps to the cell boundaries, live readout).
*/
function FractionBarLab(props = {}) {
	const { denom = 4, target, whole, unit = "", compareDenom, showEquiv = true, scene, height = 240, title = "Fractions", prompt = target != null ? `Shade ${target}/${denom} of the strip.` : "Drag to shade the strip.", activity = "fraction-bar" } = props;
	const n = Math.max(1, Math.round(denom));
	const clampN = (k) => Math.max(0, Math.min(n, Math.round(k)));
	const [num, setNum] = useState(clampN(props.num ?? 0));
	useEffect(() => {
		setNum(clampN(props.num ?? 0));
	}, [props.num, n]);
	const solved = target != null && num === target;
	const frac = num / n;
	const g = gcd(num, n);
	const simp = num > 0 && g > 1 ? `${num / g}/${n / g}` : null;
	const fillColor = solved ? "var(--stage-good)" : "var(--stage-accent)";
	useCheckpoint({
		solved,
		activity,
		response: `${num}/${n}`
	});
	const hasCompare = compareDenom != null && compareDenom > 0;
	const cmpShaded = hasCompare ? Math.round(frac * compareDenom) : 0;
	const cmpExact = hasCompare ? Math.abs(frac * compareDenom - cmpShaded) < 1e-9 : false;
	const Y_MAIN = hasCompare ? .75 : 0;
	const Y_CMP = -.95;
	const yMin = hasCompare ? -2.1 : -1.5;
	const yMax = hasCompare ? 1.9 : 1.2;
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin: -.55,
			xMax: n + .55,
			yMin,
			yMax
		},
		height,
		preserveAspect: false,
		pad: 14,
		ariaLabel: `Fraction strip showing ${num} of ${n} parts shaded`,
		children: [
			/* @__PURE__ */ jsx(BarStrip, {
				span: n,
				cells: n,
				shaded: num,
				y: Y_MAIN,
				color: fillColor
			}),
			target != null && !solved && /* @__PURE__ */ jsx(Segment, {
				from: {
					x: target,
					y: Y_MAIN - .85
				},
				to: {
					x: target,
					y: Y_MAIN + .85
				},
				color: "var(--stage-good)",
				weight: 1.75,
				opacity: .6,
				dashed: true
			}),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: num,
					y: Y_MAIN
				},
				onMove: (p) => setNum(clampN(p.x)),
				constrain: "horizontal",
				range: {
					min: 0,
					max: n
				},
				snap: 1,
				step: 1,
				readout: () => `${num}/${n}`,
				color: fillColor,
				r: 9,
				ariaLabel: "fraction boundary"
			}),
			hasCompare && /* @__PURE__ */ jsx(BarStrip, {
				span: n,
				cells: compareDenom,
				shaded: cmpShaded,
				y: Y_CMP,
				color: "var(--stage-accent)",
				weight: 26
			})
		]
	});
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [
		/* @__PURE__ */ jsxs("span", {
			style: {
				fontWeight: 700,
				fontSize: 17,
				fontVariantNumeric: "tabular-nums"
			},
			children: [
				num,
				"/",
				n
			]
		}),
		hasCompare && cmpShaded > 0 && /* @__PURE__ */ jsxs("span", {
			style: {
				opacity: .85,
				fontVariantNumeric: "tabular-nums"
			},
			children: [
				"= ",
				cmpShaded,
				"/",
				compareDenom,
				cmpExact ? "" : " (≈)"
			]
		}),
		simp && /* @__PURE__ */ jsxs("span", {
			style: { opacity: .75 },
			children: ["= ", simp]
		}),
		showEquiv && /* @__PURE__ */ jsxs("span", {
			style: {
				opacity: .75,
				fontVariantNumeric: "tabular-nums"
			},
			children: [
				"= ",
				round(frac),
				" = ",
				round(frac * 100),
				"%"
			]
		}),
		whole != null && /* @__PURE__ */ jsxs("span", {
			style: {
				opacity: .85,
				fontVariantNumeric: "tabular-nums"
			},
			children: [
				"= ",
				round(frac * whole),
				unit ? ` ${unit}` : "",
				" of ",
				whole
			]
		}),
		target != null && /* @__PURE__ */ jsx(StatusPill, {
			ok: solved,
			children: solved ? `✓ ${target}/${n}` : `shade ${target}/${n}`
		})
	] });
	const twin = scene && scene !== "none" ? getScene(scene)?.render({
		frac,
		guessTone: solved ? "ok" : "idle",
		color: fillColor,
		label: `${num}/${n}`,
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
export { FractionBarLab };