'use client';

import { LabFrame } from "../kit/frame.mjs";
import { useCheckpoint } from "../kit/pedagogy.mjs";
import { SevenSegment, ToggleSwitch } from "../kit/logic-gates.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/logic/display.tsx
/**
* BinaryDisplayLab — the "number LED" for digital-logic / DLD projects. A row of weighted
* bit switches (8 4 2 1 …) drives a seven-segment display: flip bits and watch the digit
* form, with live binary / decimal / hex readouts. A decoder sits between the bits and the
* segments (bits → number → lit segments), so this is the payoff block where learners build
* a number out of ones and zeros. Optional `target` turns it into a "make this digit" goal.
*/
const FG = "var(--stage-fg)";
const MUT = "var(--stage-muted)";
function BinaryDisplayLab({ bits = 4, start = 0, target, title = "Build a number from bits", prompt, activity = "binary-display" } = {}) {
	const n = Math.max(1, Math.min(4, bits));
	const max = (1 << n) - 1;
	const [value, setValue] = useState(() => Math.max(0, Math.min(max, start)));
	const solved = target !== void 0 && value === (target % (max + 1) + (max + 1)) % (max + 1);
	useCheckpoint({
		solved,
		activity
	});
	const toggleBit = (i) => setValue((v) => v ^ 1 << i);
	const SW_W = 50, SW_H = 26, COL = 66, X0 = 40, ROWY = 150;
	const width = X0 * 2 + (n - 1) * COL + SW_W;
	const dispX = width / 2 - 23;
	const bitGlyphs = [];
	for (let k = 0; k < n; k++) {
		const i = n - 1 - k;
		const on = (value >> i & 1) === 1;
		const x = X0 + k * COL;
		bitGlyphs.push(/* @__PURE__ */ jsxs("g", {
			onClick: () => toggleBit(i),
			style: { cursor: "pointer" },
			role: "button",
			tabIndex: 0,
			onKeyDown: (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					toggleBit(i);
				}
			},
			"aria-label": `bit value ${1 << i}, ${on ? "on" : "off"}`,
			children: [
				/* @__PURE__ */ jsx("text", {
					x: x + SW_W / 2,
					y: ROWY - 14,
					fill: MUT,
					fontSize: 11,
					fontWeight: 700,
					textAnchor: "middle",
					children: 1 << i
				}),
				/* @__PURE__ */ jsx(ToggleSwitch, {
					x,
					y: ROWY,
					w: SW_W,
					h: SW_H,
					on
				}),
				/* @__PURE__ */ jsx("text", {
					x: x + SW_W / 2,
					y: 192,
					fill: on ? "var(--stage-live)" : MUT,
					fontSize: 14,
					fontWeight: 800,
					textAnchor: "middle",
					children: on ? 1 : 0
				})
			]
		}, i));
	}
	const binStr = value.toString(2).padStart(n, "0");
	const hexStr = value.toString(16).toUpperCase();
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: prompt ?? (target !== void 0 ? `Flip the switches so the display reads ${target.toString(16).toUpperCase()}.` : "Each switch is one bit, worth the number above it. Flip them and the decoder lights the matching digit."),
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${width} 240`,
			width: "100%",
			style: {
				maxWidth: width,
				display: "block",
				margin: "0 auto"
			},
			role: "img",
			"aria-label": `seven-segment display showing ${hexStr}, binary ${binStr}`,
			children: [
				/* @__PURE__ */ jsx(SevenSegment, {
					x: dispX,
					y: 26,
					w: 46,
					h: 80,
					value
				}),
				bitGlyphs,
				/* @__PURE__ */ jsx("text", {
					x: width / 2,
					y: 224,
					fill: FG,
					fontSize: 13,
					fontWeight: 700,
					textAnchor: "middle",
					style: { fontVariantNumeric: "tabular-nums" },
					children: `binary ${binStr}  =  decimal ${value}  =  hex ${hexStr}`
				}),
				solved && /* @__PURE__ */ jsxs("text", {
					x: width / 2,
					y: 18,
					fill: "var(--stage-good)",
					fontSize: 13,
					fontWeight: 800,
					textAnchor: "middle",
					children: ["✓ that is ", hexStr]
				})
			]
		})
	});
}

//#endregion
export { BinaryDisplayLab };