'use client';

import { Chip, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { BitCell, digitChar } from "./wheel.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/ict/number-systems/bit-grouper.tsx
/**
* BitGrouper, slice a byte into nibbles and read the hex.
*
* A strip of tappable bits that auto-slices into groups of k FROM THE RIGHT
* (4 for hex, 3 for octal), translating each group to a hex/octal digit live , 
* the "group the bits" trick made physical. Flip between hex and octal to watch
* the SAME bits re-slice and the leftmost group pad with zeros; in octal the top
* group of a byte never exceeds 3 (greyed), which is exactly why hex won.
*/
function sliceFromRight(value, width, k) {
	const nGroups = Math.ceil(width / k);
	const groups = [];
	for (let g = nGroups - 1; g >= 0; g--) {
		const startPos = g * k;
		const bitsInGroup = Math.min(k, width - startPos);
		let digit = 0;
		const cells = [];
		for (let b = bitsInGroup - 1; b >= 0; b--) {
			const pos = startPos + b;
			const bit = value >> pos & 1;
			digit += bit << b;
			cells.push({
				pos,
				bit
			});
		}
		groups.push({
			digit,
			cells,
			full: bitsInGroup === k
		});
	}
	return groups;
}
function BitGrouperLab({ width = 8, groupSize = 4, groupings = [4, 3], start = 0, target, showColor = false, title = "Bit grouper", prompt = "Tap the bits. Group from the right: 4 per hex digit, 3 per octal digit.", objectives }) {
	const cap = (1 << width) - 1;
	const [value, setValue] = useState(Math.max(0, Math.min(cap, Math.floor(start))));
	const [k, setK] = useState(groupSize);
	const groups = sliceFromRight(value, width, k);
	const radix = k === 4 ? 16 : k === 3 ? 8 : 2;
	const prefix = radix === 16 ? "0x" : radix === 8 ? "0o" : "0b";
	const hasPartial = groups.some((g) => !g.full);
	const toggle = (pos) => setValue((x) => x ^ 1 << pos);
	const solved = target != null && value === target.value;
	useCheckpoint({
		solved,
		activity: "bit-grouper"
	});
	const bitStr = value.toString(2).padStart(width, "0");
	const digitStr = groups.map((g) => digitChar(g.digit)).join("");
	const swatch = `rgb(${value & 255}, ${value >> 3 & 255 || value & 255}, ${value >> 5 & 255 || value & 255})`;
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
		style: {
			borderRadius: 14,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			padding: "18px 14px"
		},
		children: [
			/* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					gap: 16,
					justifyContent: "center",
					alignItems: "flex-start",
					flexWrap: "wrap"
				},
				children: groups.map((g, gi) => /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 6
					},
					children: [/* @__PURE__ */ jsx("div", {
						style: {
							display: "flex",
							gap: 5,
							padding: "6px",
							borderRadius: 9,
							background: g.full ? "transparent" : "color-mix(in oklab, var(--stage-muted) 14%, transparent)",
							border: "1px dashed var(--stage-grid)"
						},
						children: g.cells.map((c) => /* @__PURE__ */ jsx(BitCell, {
							on: c.bit === 1,
							onTap: () => toggle(c.pos),
							ariaLabel: `bit ${c.pos}, ${c.bit ? "on" : "off"}`
						}, c.pos))
					}), /* @__PURE__ */ jsx("div", {
						style: {
							fontSize: 26,
							fontWeight: 800,
							color: g.full ? "var(--stage-accent)" : "var(--stage-muted)",
							fontVariantNumeric: "tabular-nums"
						},
						children: digitChar(g.digit)
					})]
				}, gi))
			}),
			/* @__PURE__ */ jsxs("p", {
				style: {
					textAlign: "center",
					marginTop: 12,
					fontSize: 15,
					fontWeight: 700,
					fontVariantNumeric: "tabular-nums",
					color: "var(--stage-fg)"
				},
				children: [
					"0b",
					bitStr,
					" = ",
					prefix,
					digitStr,
					" = ",
					value
				]
			}),
			radix === 8 && hasPartial && /* @__PURE__ */ jsxs("p", {
				style: {
					textAlign: "center",
					fontSize: 12,
					color: "var(--stage-muted)"
				},
				children: [
					"the greyed top octal group is only ",
					width % k,
					" bits, it never passes ",
					(1 << width % k) - 1,
					", so octal wastes the top of a byte (why hex won)"
				]
			}),
			showColor && /* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					justifyContent: "center",
					marginTop: 10
				},
				children: /* @__PURE__ */ jsx("span", {
					style: {
						width: 64,
						height: 24,
						borderRadius: 6,
						background: swatch,
						border: "1px solid var(--stage-grid)"
					},
					"aria-label": "the bits as a colour swatch"
				})
			})
		]
	}), /* @__PURE__ */ jsx(LiveRegion, { children: `${prefix}${digitStr}, decimal ${value}` })] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
			label: "group by",
			children: /* @__PURE__ */ jsx("span", {
				style: {
					display: "inline-flex",
					gap: 6,
					alignItems: "center"
				},
				children: groupings.map((gs) => /* @__PURE__ */ jsx(Chip, {
					selected: gs === k,
					onClick: () => setK(gs),
					children: gs === 4 ? "4 → hex" : gs === 3 ? "3 → octal" : String(gs)
				}, gs))
			})
		}) }),
		footer: target != null ? /* @__PURE__ */ jsx(StatusPill, {
			ok: solved,
			children: solved ? "✓ Matches the target" : `Build ${target.base === 16 ? "0x" : target.base === 8 ? "0o" : "0b"}${target.value.toString(target.base).toUpperCase()}`
		}) : void 0,
		children: figure
	});
}

//#endregion
export { BitGrouperLab };