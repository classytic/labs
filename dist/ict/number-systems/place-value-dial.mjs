'use client';

import { Tex } from "../../core/tex.mjs";
import { Chip, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { WheelRow, digitChar, maxValue, toDigits } from "./wheel.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/ict/number-systems/place-value-dial.tsx
/**
* PlaceValueDial, count in any base and watch the carry ripple.
*
* A row of odometer wheels in base-N. +1 ticks the ones wheel; when it passes
* N−1 it snaps to 0 and KICKS the next wheel up, the carry ripples left while
* the power-of-N place values light up and sum to the live value. Re-base the
* SAME count with the base chips to see "10 in any base means you ticked over
* the base exactly once". In base-2 the wheels become ON/OFF cells, the
* "lightbulbs worth 1-2-4-8-16" picture. (Anti-pattern guard: weights stay on
* screen, the carry is shown not hidden, and it works in both directions.)
*/
function PlaceValueDialLab({ base: base0 = 2, width = 4, start = 0, target, bases = [
	2,
	8,
	10,
	16
], showWeights = true, title = "Place-value dial", prompt = "Press +1 and watch the carry ripple left.", objectives }) {
	const [base, setBase] = useState(base0);
	const [value, setValue] = useState(Math.max(0, Math.floor(start)));
	const cap = maxValue(base, width);
	const v = Math.min(value, cap);
	const digits = toDigits(v, base, width);
	const solved = target != null && v === target;
	useCheckpoint({
		solved,
		activity: "place-value-dial"
	});
	const bump = (delta) => setValue((x) => Math.max(0, Math.min(cap, x + delta)));
	const cycleDigit = (i) => {
		const place = width - 1 - i;
		const weight = Math.pow(base, place);
		const cur = digits[i] ?? 0;
		const next = (cur + 1) % base;
		setValue((x) => Math.max(0, Math.min(cap, x + (next - cur) * weight)));
	};
	const cells = base === 2;
	const terms = digits.map((d, i) => ({
		d,
		place: width - 1 - i,
		weight: Math.pow(base, width - 1 - i)
	})).filter((t) => t.d !== 0);
	const sumTex = terms.length ? terms.map((t) => `${digitChar(t.d)} \\cdot ${t.weight}`).join(" + ") + ` = ${v}` : `0 = ${v}`;
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
		style: {
			borderRadius: 14,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			padding: "18px 14px"
		},
		children: [/* @__PURE__ */ jsx("div", {
			style: {
				display: "flex",
				justifyContent: "center"
			},
			children: /* @__PURE__ */ jsx(WheelRow, {
				value: v,
				base,
				width,
				cells,
				showWeights,
				onTapDigit: cycleDigit
			})
		}), showWeights && /* @__PURE__ */ jsx("p", {
			style: {
				textAlign: "center",
				marginTop: 14,
				fontSize: 14,
				fontWeight: 600,
				fontVariantNumeric: "tabular-nums",
				color: "var(--stage-fg)"
			},
			children: /* @__PURE__ */ jsx(Tex, { tex: sumTex })
		})]
	}), /* @__PURE__ */ jsx(LiveRegion, { children: `${v} in base ${base} is ${digits.map(digitChar).join("")}` })] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "count",
			value: /* @__PURE__ */ jsxs("span", {
				style: { fontVariantNumeric: "tabular-nums" },
				children: [
					v,
					" = ",
					digits.map(digitChar).join(""),
					/* @__PURE__ */ jsx("sub", { children: base })
				]
			}),
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "flex",
					gap: 10,
					alignItems: "center"
				},
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "lang-speak",
					onClick: () => bump(-1),
					"aria-label": "minus one",
					style: {
						fontWeight: 800,
						minWidth: 44
					},
					children: "−1"
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "lang-speak",
					onClick: () => bump(1),
					"aria-label": "plus one",
					style: {
						fontWeight: 800,
						minWidth: 44
					},
					children: "+1"
				})]
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "base",
			children: /* @__PURE__ */ jsx("span", {
				style: {
					display: "inline-flex",
					gap: 6,
					alignItems: "center"
				},
				children: bases.map((b) => /* @__PURE__ */ jsx(Chip, {
					selected: b === base,
					onClick: () => setBase(b),
					children: b
				}, b))
			})
		})] }),
		footer: target != null ? /* @__PURE__ */ jsx(StatusPill, {
			ok: solved,
			children: solved ? `✓ Reached ${target}` : `Spin the dials to ${target}`
		}) : void 0,
		children: figure
	});
}

//#endregion
export { PlaceValueDialLab };