'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/discrete/combination-studio/figure.tsx
const SKIN = "#e8b98c";
/** A friendly stick-ish person who wears the chosen garments. */
function CharacterFigure({ parts, size = 64, dim = false }) {
	const { top = "#9aa3b2", bottom = "#5b6472", hat, hold } = parts;
	return /* @__PURE__ */ jsxs("svg", {
		width: size,
		height: size,
		viewBox: "0 0 64 64",
		style: {
			display: "block",
			opacity: dim ? .28 : 1,
			transition: "opacity .2s"
		},
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ jsx("rect", {
				x: "26",
				y: "40",
				width: "5",
				height: "16",
				rx: "2.5",
				fill: bottom
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "33",
				y: "40",
				width: "5",
				height: "16",
				rx: "2.5",
				fill: bottom
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "22",
				y: "24",
				width: "20",
				height: "20",
				rx: "6",
				fill: top
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "17",
				y: "26",
				width: "5",
				height: "14",
				rx: "2.5",
				fill: top
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "42",
				y: "26",
				width: "5",
				height: "14",
				rx: "2.5",
				fill: top
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "32",
				cy: "16",
				r: "9",
				fill: SKIN
			}),
			hat && /* @__PURE__ */ jsx("path", {
				d: "M20 13 Q32 -1 44 13 Z",
				fill: hat
			}),
			hat && /* @__PURE__ */ jsx("rect", {
				x: "18",
				y: "12",
				width: "28",
				height: "3.4",
				rx: "1.7",
				fill: hat
			}),
			hold && /* @__PURE__ */ jsx("text", {
				x: "47",
				y: "44",
				fontSize: "13",
				textAnchor: "middle",
				children: hold
			})
		]
	});
}
/** A stacked outcome card: one emoji (or colour swatch) per category. */
function ComboCard({ cells, size = 60, dim = false }) {
	return /* @__PURE__ */ jsx("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			gap: 2,
			opacity: dim ? .3 : 1,
			transition: "opacity .2s",
			width: size
		},
		"aria-hidden": true,
		children: cells.map((c, i) => c.emoji ? /* @__PURE__ */ jsx("span", {
			style: {
				fontSize: size * .42,
				lineHeight: 1
			},
			children: c.emoji
		}, i) : /* @__PURE__ */ jsx("span", { style: {
			width: size * .6,
			height: size * .26,
			borderRadius: 5,
			background: c.color ?? "#9aa3b2"
		} }, i))
	});
}
/** A pickable option in a rack: the swatch/emoji + its label, selected ring. */
function OptionSwatch({ emoji, color, label, selected, onClick }) {
	return /* @__PURE__ */ jsxs("button", {
		type: "button",
		onClick,
		"aria-pressed": selected,
		"aria-label": label,
		style: {
			display: "inline-flex",
			flexDirection: "column",
			alignItems: "center",
			gap: 3,
			cursor: "pointer",
			padding: "6px 8px",
			borderRadius: 10,
			background: "transparent",
			border: `2px solid ${selected ? "var(--stage-accent)" : "var(--stage-grid)"}`,
			boxShadow: selected ? "0 0 0 3px color-mix(in oklab, var(--stage-accent) 22%, transparent)" : "none",
			transition: "border-color .15s, box-shadow .15s"
		},
		children: [emoji ? /* @__PURE__ */ jsx("span", {
			style: {
				fontSize: 24,
				lineHeight: 1
			},
			children: emoji
		}) : /* @__PURE__ */ jsx("span", { style: {
			width: 28,
			height: 18,
			borderRadius: 5,
			background: color ?? "#9aa3b2"
		} }), /* @__PURE__ */ jsx("span", {
			style: {
				fontSize: 11,
				color: "var(--stage-muted)",
				fontWeight: 600
			},
			children: label
		})]
	});
}

//#endregion
export { CharacterFigure, ComboCard, OptionSwatch };