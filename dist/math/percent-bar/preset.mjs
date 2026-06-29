'use client';

import { round } from "../../core/util.mjs";
import { StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { getScene } from "../../kit/scenes.mjs";
import { useEffect, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, MovableDot, Segment, Stage } from "@classytic/stage";

//#region src/math/percent-bar/preset.tsx
/**
* PercentBarLab, the authorable PERCENTAGE manipulative: a bar is the whole
* (100%), the learner drags a fill to a target percent, and the same drag reads
* out both the percent AND the concrete amount (percent × whole). One engine,
* many analogies, the story is data: set `whole` + `unit` (students, mL, $, %
* battery) and an optional `segments` breakdown for the reference bar, and the
* SAME component teaches "make 25%", "25% of 80", a budget split, a charged
* battery, a poll. Built on the juiced <MovableDot> (snap + live readout +
* ghost stops) so a percentage feels tactile, not typed.
*
* Fully authorable: whole, unit, target, snap granularity, the reference-bar
* segments + their labels/colours, and the prompt, no code per analogy.
*/
const PALETTE = [
	"var(--stage-accent)",
	"var(--stage-good)",
	"#f3a23b",
	"#e85aa6",
	"#7c83ff",
	"#34c6c6"
];
const fmtVal = (n) => String(round(n));
function PercentBarLab(props = {}) {
	const { whole = 100, unit = "", start = 0, target, snapPct = 5, showValue = true, segments, referenceLabel, scene, height = 230, title = "Percentages", prompt = target != null ? `Drag the bar to ${target}%.` : "Drag the bar and watch the percentage.", activity = "percent-bar" } = props;
	const snap = (p) => Math.round(p / snapPct) * snapPct;
	const clampPct = (p) => Math.max(0, Math.min(100, snap(p)));
	const [pct, setPct] = useState(clampPct(start));
	useEffect(() => {
		setPct(clampPct(start));
	}, [start, snapPct]);
	const solved = target != null && pct === target;
	const value = round(whole * pct / 100);
	useCheckpoint({
		solved,
		activity,
		response: `${pct}%${showValue ? ` = ${fmtVal(value)} ${unit}` : ""}`
	});
	const fillColor = solved ? "var(--stage-good)" : "var(--stage-accent)";
	const Y_REF = 1.35;
	const Y_BAR = -.25;
	const BARW = 30;
	const segTotal = (segments ?? []).reduce((s, x) => s + Math.max(0, x.frac), 0) || 1;
	let acc = 0;
	const segSpans = (segments ?? []).map((s, i) => {
		const x0 = acc / segTotal * 100;
		acc += Math.max(0, s.frac);
		const x1 = acc / segTotal * 100;
		return {
			...s,
			x0,
			x1,
			mid: (x0 + x1) / 2,
			color: s.color ?? PALETTE[i % PALETTE.length]
		};
	});
	const ticks = [];
	for (let p = 0; p <= 100; p += snapPct) ticks.push(p);
	const figure = /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin: -7,
			xMax: 114,
			yMin: -2.4,
			yMax: segments?.length || referenceLabel ? 2.6 : 1.2
		},
		height,
		preserveAspect: false,
		pad: 14,
		ariaLabel: `Percentage bar at ${pct} percent of ${whole}${unit ? " " + unit : ""}`,
		children: [
			(segSpans.length > 0 || referenceLabel) && /* @__PURE__ */ jsxs(Fragment$1, { children: [referenceLabel && /* @__PURE__ */ jsx(Label, {
				x: 0,
				y: Y_REF,
				text: referenceLabel,
				color: "var(--stage-muted)",
				size: 12,
				anchor: "start",
				dy: -22
			}), segSpans.length > 0 ? segSpans.map((s, i) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx(Segment, {
				from: {
					x: s.x0,
					y: Y_REF
				},
				to: {
					x: s.x1,
					y: Y_REF
				},
				color: s.color,
				weight: BARW - 4,
				opacity: .85
			}), s.label && s.x1 - s.x0 > 9 && /* @__PURE__ */ jsx(Label, {
				x: s.mid,
				y: Y_REF,
				text: s.label,
				color: "var(--stage-fg)",
				size: 11,
				weight: 700
			})] }, i)) : /* @__PURE__ */ jsx(Segment, {
				from: {
					x: 0,
					y: Y_REF
				},
				to: {
					x: 100,
					y: Y_REF
				},
				color: "var(--stage-grid)",
				weight: BARW - 4,
				opacity: .7
			})] }),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: 0,
					y: Y_BAR
				},
				to: {
					x: 100,
					y: Y_BAR
				},
				color: "var(--stage-grid)",
				weight: BARW,
				opacity: .6
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: 0,
					y: Y_BAR
				},
				to: {
					x: Math.max(1e-4, pct),
					y: Y_BAR
				},
				color: fillColor,
				weight: BARW
			}),
			ticks.map((p) => /* @__PURE__ */ jsx(Segment, {
				from: {
					x: p,
					y: Y_BAR - .62
				},
				to: {
					x: p,
					y: Y_BAR - (p % 25 === 0 ? .92 : .78)
				},
				color: "var(--stage-fg)",
				opacity: p % 25 === 0 ? .5 : .2,
				weight: p % 25 === 0 ? 1.5 : 1
			}, p)),
			/* @__PURE__ */ jsx(Label, {
				x: 0,
				y: Y_BAR,
				text: "0%",
				color: "var(--stage-muted)",
				size: 12,
				dy: 34
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 100,
				y: Y_BAR,
				text: "100%",
				color: "var(--stage-muted)",
				size: 12,
				dy: 34
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 100,
				y: Y_BAR,
				text: `${fmtVal(whole)}${unit ? " " + unit : ""}`,
				color: "var(--stage-muted)",
				size: 12,
				anchor: "start",
				dx: 10
			}),
			target != null && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Segment, {
				from: {
					x: target,
					y: Y_BAR - .95
				},
				to: {
					x: target,
					y: .7
				},
				color: "var(--stage-good)",
				weight: 1.75,
				opacity: solved ? .9 : .55,
				dashed: true
			}), !solved && /* @__PURE__ */ jsx(Dot, {
				x: target,
				y: Y_BAR,
				r: 5,
				color: "var(--stage-good)",
				opacity: .4
			})] }),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: pct,
					y: Y_BAR
				},
				onMove: (p) => setPct(clampPct(p.x)),
				constrain: "horizontal",
				range: {
					min: 0,
					max: 100
				},
				snap: snapPct,
				step: snapPct,
				readout: () => `${pct}%`,
				color: fillColor,
				r: 9,
				ariaLabel: "percentage fill handle"
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
			children: [pct, "%"]
		}),
		showValue && /* @__PURE__ */ jsxs("span", {
			style: {
				fontVariantNumeric: "tabular-nums",
				opacity: .85
			},
			children: [
				"= ",
				fmtVal(value),
				unit ? ` ${unit}` : "",
				whole !== 100 ? ` of ${fmtVal(whole)}` : ""
			]
		}),
		target != null && /* @__PURE__ */ jsx(StatusPill, {
			ok: solved,
			children: solved ? `✓ ${target}%` : `target ${target}%`
		})
	] });
	const twin = scene && scene !== "none" ? getScene(scene)?.render({
		frac: pct / 100,
		guessTone: solved ? "ok" : "idle",
		color: fillColor,
		label: `${pct}%`,
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
export { PercentBarLab };