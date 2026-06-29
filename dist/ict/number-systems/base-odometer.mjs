'use client';

import { Chip, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { WheelRow, digitChar, toDigits } from "./wheel.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useInView } from "@classytic/stage";

//#region src/ict/number-systems/base-odometer.tsx
/**
* BaseOdometer, the same quantity, ticking in every base at once.
*
* Stacked odometer rows (one per base) all driven by ONE shared integer:
* increment it and binary/octal/decimal/hex roll in lockstep, the binary row
* rolls fastest (the rightmost-bit frequency cascade), hex barely moves, so
* "base is a costume, not a different number" is something you watch, not read.
* A race toggle auto-counts via the frame loop so the cascade plays as motion.
* Composes the shared WheelRow (DRY: the wheel + carry animation live in one place).
*/
const LABELS = {
	2: "BIN",
	8: "OCT",
	10: "DEC",
	16: "HEX"
};
function BaseOdometerLab({ bases = [
	2,
	8,
	10,
	16
], width = "auto", start = 0, max = 255, race = false, speed = 2, highlightBase, target, title = "Base odometer", prompt = "One quantity, every base at once: +1 and watch them all roll.", objectives }) {
	const [value, setValue] = useState(Math.max(0, Math.min(max, Math.floor(start))));
	const [racing, setRacing] = useState(race);
	const acc = useRef(0);
	const { ref: viewRef, inView } = useInView();
	const widthFor = (b) => width === "auto" ? Math.max(1, Math.ceil(Math.log(max + 1) / Math.log(b) - 1e-9)) : width;
	const bump = (delta) => setValue((x) => Math.max(0, Math.min(max, x + delta)));
	useFrameTick(racing && inView, (f) => {
		acc.current += Math.min(.1, f.dtMs / 1e3) * speed;
		if (acc.current >= 1) {
			const steps = Math.floor(acc.current);
			acc.current -= steps;
			setValue((x) => (x + steps) % (max + 1));
		}
	});
	const solved = target != null && value === target;
	useCheckpoint({
		solved,
		activity: "base-odometer"
	});
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		style: {
			borderRadius: 14,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			padding: "16px 14px",
			display: "flex",
			flexDirection: "column",
			gap: 12
		},
		children: bases.map((b) => {
			const hot = b === highlightBase;
			return /* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 12,
					padding: hot ? "6px 8px" : 0,
					borderRadius: 10,
					background: hot ? "color-mix(in oklab, var(--stage-good) 12%, transparent)" : "transparent"
				},
				children: [
					/* @__PURE__ */ jsx("span", {
						style: {
							width: 42,
							fontWeight: 800,
							fontSize: 13,
							color: hot ? "var(--stage-good)" : "var(--stage-muted)"
						},
						children: LABELS[b] ?? `b${b}`
					}),
					/* @__PURE__ */ jsx(WheelRow, {
						value,
						base: b,
						width: widthFor(b),
						ariaPrefix: `base ${b} `
					}),
					/* @__PURE__ */ jsxs("span", {
						style: {
							marginLeft: "auto",
							fontWeight: 700,
							fontVariantNumeric: "tabular-nums",
							color: "var(--stage-fg)"
						},
						children: [toDigits(value, b, widthFor(b)).map(digitChar).join(""), /* @__PURE__ */ jsx("sub", { children: b })]
					})
				]
			}, b);
		})
	}), /* @__PURE__ */ jsx(LiveRegion, { children: `value ${value}` })] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
			label: "count",
			value: `= ${value}`,
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "flex",
					flexWrap: "wrap",
					gap: 10,
					alignItems: "center"
				},
				children: [
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "lang-speak",
						onClick: () => bump(-1),
						"aria-label": "minus one",
						style: {
							fontWeight: 800,
							minWidth: 44
						},
						children: "−1"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "lang-speak",
						onClick: () => bump(1),
						"aria-label": "plus one",
						style: {
							fontWeight: 800,
							minWidth: 44
						},
						children: "+1"
					}),
					/* @__PURE__ */ jsx(Chip, {
						selected: racing,
						onClick: () => setRacing((r) => !r),
						children: racing ? "⏸ pause" : "▶ race"
					})
				]
			})
		}) }),
		footer: target != null ? /* @__PURE__ */ jsx(StatusPill, {
			ok: solved,
			children: solved ? `✓ Reached ${target}` : `Count to ${target}`
		}) : void 0,
		children: figure
	});
}

//#endregion
export { BaseOdometerLab };