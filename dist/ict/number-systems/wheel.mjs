'use client';

import { useFrameTick } from "../../kit/anim.mjs";
import { useEffect, useRef } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useInView } from "@classytic/stage";

//#region src/ict/number-systems/wheel.tsx
/**
* Shared building blocks for the number-system labs: base digit helpers + the
* DigitWheel glyph (a mechanical odometer wheel). Tokenized SVG only, colours
* are `--stage-*` so the wheels retheme with the host. The roll is DATA: the lab
* passes a 0..1 `roll` phase its frame loop decays, so the digit visibly slides
* into place (no fake "press play", the motion tracks the real value change).
*/
/** Seconds for a wheel to settle after a digit changes. */
const ROLL_DUR = .32;
/** 0-9 then A-F… for bases up to 16. */
function digitChar(d) {
	return d < 10 ? String(d) : String.fromCharCode(65 + d - 10);
}
/** The `width` digits of `value` in `base`, most-significant first, zero-padded. */
function toDigits(value, base, width) {
	const out = [];
	let v = Math.max(0, Math.floor(value));
	for (let i = 0; i < width; i++) {
		out.unshift(v % base);
		v = Math.floor(v / base);
	}
	return out;
}
/** Largest value representable in `width` digits of `base`. */
function maxValue(base, width) {
	return Math.pow(base, width) - 1;
}
const CELL_W = 38;
const CELL_H = 50;
const ROW = 34;
/**
* One odometer wheel: the current digit large + the next/previous digits peeking
* (clipped) at the top/bottom edges, so it unmistakably reads as a wheel mid-roll.
*/
function DigitWheel({ base, digit, roll = 0, dir = 1, active, onTap, ariaLabel }) {
	const r = Math.max(0, Math.min(1, roll));
	const cy = CELL_H / 2;
	const cx = CELL_W / 2;
	const up = (digit + 1) % base;
	const down = (digit - 1 + base) % base;
	const offset = r * dir * ROW;
	const col = active ? "var(--stage-accent)" : "var(--stage-muted)";
	const clipId = `wheel-clip-${CELL_W}-${CELL_H}`;
	return /* @__PURE__ */ jsxs("svg", {
		width: CELL_W,
		height: CELL_H,
		viewBox: `0 0 ${CELL_W} ${CELL_H}`,
		role: onTap ? "button" : "img",
		"aria-label": ariaLabel,
		onClick: onTap,
		style: {
			cursor: onTap ? "pointer" : "default",
			flex: "0 0 auto"
		},
		children: [
			/* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("clipPath", {
				id: clipId,
				children: /* @__PURE__ */ jsx("rect", {
					x: 0,
					y: 0,
					width: CELL_W,
					height: CELL_H,
					rx: 7
				})
			}) }),
			/* @__PURE__ */ jsx("rect", {
				x: .75,
				y: .75,
				width: CELL_W - 1.5,
				height: CELL_H - 1.5,
				rx: 7,
				fill: "var(--stage-bg)",
				stroke: "var(--stage-fg)",
				strokeOpacity: .35,
				strokeWidth: 1.5
			}),
			/* @__PURE__ */ jsx("g", {
				clipPath: `url(#${clipId})`,
				fontWeight: 700,
				textAnchor: "middle",
				style: { pointerEvents: "none" },
				children: /* @__PURE__ */ jsxs("g", {
					transform: `translate(0 ${offset})`,
					children: [
						/* @__PURE__ */ jsx("text", {
							x: cx,
							y: cy - ROW,
							fill: "var(--stage-muted)",
							fontSize: 18,
							opacity: .3,
							dominantBaseline: "central",
							children: digitChar(down)
						}),
						/* @__PURE__ */ jsx("text", {
							x: cx,
							y: cy,
							fill: col,
							fontSize: 26,
							dominantBaseline: "central",
							children: digitChar(digit)
						}),
						/* @__PURE__ */ jsx("text", {
							x: cx,
							y: 59,
							fill: "var(--stage-muted)",
							fontSize: 18,
							opacity: .3,
							dominantBaseline: "central",
							children: digitChar(up)
						})
					]
				})
			}),
			/* @__PURE__ */ jsx("rect", {
				x: .75,
				y: .75,
				width: CELL_W - 1.5,
				height: CELL_H - 1.5,
				rx: 7,
				fill: "none",
				stroke: "var(--stage-fg)",
				strokeOpacity: active ? .5 : .25,
				strokeWidth: 1.5
			})
		]
	});
}
/** A binary ON/OFF cell, the "lightbulb worth 2^n" picture for base-2 mode. */
function BitCell({ on, onTap, ariaLabel }) {
	return /* @__PURE__ */ jsxs("svg", {
		width: CELL_W,
		height: CELL_H,
		viewBox: `0 0 ${CELL_W} ${CELL_H}`,
		role: onTap ? "button" : "img",
		"aria-label": ariaLabel,
		onClick: onTap,
		style: {
			cursor: onTap ? "pointer" : "default",
			flex: "0 0 auto"
		},
		children: [
			on && /* @__PURE__ */ jsx("rect", {
				x: 2,
				y: 2,
				width: CELL_W - 4,
				height: CELL_H - 4,
				rx: 7,
				fill: "var(--stage-good)",
				opacity: .18
			}),
			/* @__PURE__ */ jsx("rect", {
				x: .75,
				y: .75,
				width: CELL_W - 1.5,
				height: CELL_H - 1.5,
				rx: 7,
				fill: on ? "color-mix(in oklab, var(--stage-good) 26%, var(--stage-bg))" : "var(--stage-bg)",
				stroke: on ? "var(--stage-good)" : "var(--stage-fg)",
				strokeOpacity: on ? 1 : .3,
				strokeWidth: 1.5
			}),
			/* @__PURE__ */ jsx("text", {
				x: CELL_W / 2,
				y: CELL_H / 2,
				fill: on ? "var(--stage-good)" : "var(--stage-muted)",
				fontSize: 24,
				fontWeight: 800,
				textAnchor: "middle",
				dominantBaseline: "central",
				style: { pointerEvents: "none" },
				children: on ? "1" : "0"
			})
		]
	});
}
/**
* A row of odometer wheels (or bit cells) for `value` in `base`, with the
* carry-ripple roll animation OWNED here, the single reusable place-value
* primitive both PlaceValueDial and BaseOdometer compose, so the animation +
* weight rendering live in exactly one spot.
*/
function WheelRow({ value, base, width, cells, showWeights, onTapDigit, ariaPrefix = "" }) {
	const digits = toDigits(value, base, width);
	const prev = useRef(digits);
	const roll = useRef(digits.map(() => 0));
	const dir = useRef(digits.map(() => 1));
	const { ref: viewRef, inView } = useInView();
	useEffect(() => {
		const p = prev.current;
		let rightmost = -1;
		digits.forEach((d, i) => {
			if (d !== (p[i] ?? d)) rightmost = i;
		});
		digits.forEach((d, i) => {
			const pp = p[i] ?? d;
			if (d !== pp) {
				const delay = rightmost - i;
				roll.current[i] = 1 + Math.max(0, delay) * .45;
				dir.current[i] = (d - pp + base) % base <= base / 2 ? 1 : -1;
			}
		});
		prev.current = digits;
	}, [
		value,
		base,
		width
	]);
	useFrameTick(roll.current.some((r) => r > 0) && inView, (f) => {
		const dt = Math.min(.05, f.dtMs / 1e3);
		roll.current = roll.current.map((r) => Math.max(0, r - dt / ROLL_DUR));
	});
	return /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		style: {
			display: "flex",
			gap: 8,
			alignItems: "flex-start"
		},
		children: digits.map((d, i) => {
			const place = width - 1 - i;
			const weight = Math.pow(base, place);
			return /* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 4
				},
				children: [cells ? /* @__PURE__ */ jsx(BitCell, {
					on: d === 1,
					onTap: onTapDigit ? () => onTapDigit(i) : void 0,
					ariaLabel: `${ariaPrefix}bit worth ${weight}, ${d ? "on" : "off"}`
				}) : /* @__PURE__ */ jsx(DigitWheel, {
					base,
					digit: d,
					roll: Math.min(1, roll.current[i] ?? 0),
					dir: dir.current[i] ?? 1,
					active: d !== 0,
					onTap: onTapDigit ? () => onTapDigit(i) : void 0,
					ariaLabel: `${ariaPrefix}place ${place}, digit ${digitChar(d)}`
				}), showWeights && /* @__PURE__ */ jsxs("div", {
					style: {
						textAlign: "center",
						lineHeight: 1.15
					},
					children: [/* @__PURE__ */ jsxs("div", {
						style: {
							fontSize: 10,
							color: "var(--stage-muted)",
							fontVariantNumeric: "tabular-nums"
						},
						children: [base, /* @__PURE__ */ jsx("sup", { children: place })]
					}), /* @__PURE__ */ jsx("div", {
						style: {
							fontSize: 12,
							fontWeight: 700,
							fontVariantNumeric: "tabular-nums",
							color: d !== 0 ? "var(--stage-good)" : "var(--stage-muted)",
							opacity: d !== 0 ? 1 : .6
						},
						children: weight
					})]
				})]
			}, i);
		})
	});
}

//#endregion
export { BitCell, DigitWheel, WheelRow, digitChar, maxValue, toDigits };